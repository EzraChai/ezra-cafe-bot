import { Hono } from "hono";
import { GoogleGenAI, type Content, type Tool } from "@google/genai";
import { drizzle } from "drizzle-orm/d1";
import { menuItems } from "./db/schema";
import { eq } from "drizzle-orm";
import { searchMenu, searchMenuTool } from "./tools/searchMenu";
import { SYSTEM_INSTRUCTION } from "./systemInstruction";
import { addToCart, addToCartTool } from "./tools/addToCart";
import { getOrCreateCustomer } from "./tools/getOrCreateCustomer";
import { getCart, getCartTool } from "./tools/getCart";
import { removeFromCart, removeFromCartTool } from "./tools/removeFromCart";
import { updateCart, updateCartTool } from "./tools/updateCart";

type Bindings = {
  AI_API_KEY: string;
  TELEGRAM_BOT_TOKEN: string;
  DB_BINDING: D1Database;
};

const tools: Tool[] = [
  {
    functionDeclarations: [
      searchMenuTool,
      addToCartTool,
      getCartTool,
      removeFromCartTool,
      updateCartTool,
    ],
  },
];

// NOTE: verify this model string against the current @google/genai
// model list for your SDK version — left unchanged from the original.
const MODEL = "gemini-3.5-flash-lite";
const app = new Hono<{ Bindings: Bindings }>();

app.get("/", async (c) => {
  const db = drizzle(c.env.DB_BINDING, { logger: true });
  const items = await db.select().from(menuItems);
  return c.json({ items });
});

app.post("/telegram/webhook", async (c) => {
  const update = await c.req.json();

  console.log("Received update:", update);

  c.executionCtx.waitUntil(
    processUpdate(c.env, update).catch((error) => {
      console.error("processUpdate failed:", error);
    }),
  );

  return c.json({ ok: true });
});

async function processUpdate(env: Bindings, update: any) {
  const db = drizzle(env.DB_BINDING, { logger: true });

  const message = update.message;

  if (!message?.text) {
    return;
  }

  const chatId = message.chat.id;
  const userText = message.text.trim();

  // /start
  if (userText === "/start") {
    const items = await db
      .select()
      .from(menuItems)
      .where(eq(menuItems.active, true));

    const menuText = formatMenu(items);

    await sendTelegramMessage(
      env.TELEGRAM_BOT_TOKEN,
      chatId,
      `*Welcome to Ezra Café!* ☕

*Menu*

${menuText}

What would you like to order?`,
      message.message_id,
    );
    return;
  }

  const ai = new GoogleGenAI({
    apiKey: env.AI_API_KEY,
  });

  const customer = await getOrCreateCustomer(
    db,
    message.chat.id,
    message.from?.username,
  );

  // Explicitly typed so later pushes of model/function-response turns
  // don't get rejected by an inferred literal type from the first entry.
  const contents: Content[] = [
    {
      role: "user",
      parts: [
        {
          text: userText,
        },
      ],
    },
  ];

  let response = await ai.models.generateContent({
    model: MODEL,
    contents,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      tools,
    },
  });
  while (response.functionCalls?.length) {
    const functionResponses: Content["parts"] = [];

    for (const functionCall of response.functionCalls) {
      const result = await executeTool(
        db,
        functionCall.name!!,
        customer.id,
        functionCall.args,
      );

      functionResponses.push({
        functionResponse: {
          name: functionCall.name,
          response: {
            result,
          },
        },
      });
    }

    contents.push({
      role: "model",
      parts: response.candidates?.[0]?.content?.parts ?? [],
    });

    contents.push({
      role: "user",
      parts: functionResponses,
    });

    response = await ai.models.generateContent({
      model: MODEL,
      contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools,
      },
    });
  }

  const reply = response.text ?? "Sorry, I couldn't understand that.";

  await sendTelegramMessage(
    env.TELEGRAM_BOT_TOKEN,
    chatId,
    reply,
    message.message_id,
  );
}

async function sendTelegramMessage(
  token: string,
  chatId: number,
  text: string,
  replyToMessageId: number,
) {
  const response = await fetch(
    `https://api.telegram.org/bot${token}/sendMessage`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "Markdown",
        ...(replyToMessageId
          ? {
              reply_parameters: {
                message_id: replyToMessageId,
              },
            }
          : {}),
      }),
    },
  );

  if (!response.ok) {
    console.error("Telegram error:", await response.text());
  }
}

export default app;

function formatMenu(items: { name: string; price: number }[]): string {
  return items
    .map((item) => `- ${item.name}: RM${(item.price / 100).toFixed(2)}`)
    .join("\n");
}

async function executeTool(
  db: ReturnType<typeof drizzle>,
  name: string,
  customerId: number,
  args: Record<string, unknown> | undefined,
) {
  switch (name) {
    case "search_menu":
      return searchMenu(db, String(args?.query ?? ""));

    case "add_to_cart":
      const itemId = String(args?.item_id ?? "");
      const quantity = Number(args?.quantity ?? 0);

      return addToCart(db, itemId, customerId, quantity);

    case "get_cart":
      return getCart(db, customerId);

    case "remove_from_cart":
      const removeItemId = String(args?.item_id ?? "");
      return removeFromCart(db, removeItemId, customerId);

    case "update_cart":
      const updateItemId = String(args?.item_id ?? "");
      const updateQuantity = Number(args?.quantity ?? 0);
      return updateCart(db, updateItemId, customerId, updateQuantity);

    default:
      return {
        error: `Unknown function: ${name}`,
      };
  }
}
