import { Hono } from "hono";

import { GoogleGenAI } from "@google/genai";

type Bindings = {
  AI_API_KEY: string;
  TELEGRAM_BOT_TOKEN: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get("/", (c) => {
  return c.text("Hello, World!");
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
  const message = update.message;

  if (!message?.text) {
    return;
  }

  const chatId = message.chat.id;
  const userText = message.text;

  const ai = new GoogleGenAI({
    apiKey: env.AI_API_KEY,
  });

  const interaction = await ai.interactions.create({
    model: "gemini-3.5-flash-lite",
    input: `
You are a friendly café ordering assistant.

Menu:
- Chicken Rice — RM8
- Nasi Lemak — RM7
- Iced Coffee — RM4
- Teh Ais — RM3

Customer message:
${userText}
    `,
  });

  const reply = interaction.output_text ?? "Sorry, I couldn't understand that.";

  await fetch(
    `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: reply,
      }),
    },
  );
}

export default app;
