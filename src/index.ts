import { Hono } from "hono";

import { GoogleGenAI } from "@google/genai";

type Bindings = {
  AI_API_KEY: string;
  TELEGRAM_BOT_TOKEN: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.post("/telegram/webhook", async (c) => {
  const ai = new GoogleGenAI({
    apiKey: c.env.AI_API_KEY,
  });

  const update = await c.req.json();

  console.log("Received update:", update);

  return c.json({ ok: true });
  //   const interaction = await ai.interactions.create({
  //     model: "gemini-3.5-flash-lite",
  //     input: `
  // You are a café ordering assistant.

  // Menu:
  // - Chicken Rice — RM8
  // - Nasi Lemak — RM7
  // - Iced Coffee — RM4
  // - Teh Ais — RM3

  // Customer:
  // "I want two chicken rice and one iced coffee."
  //   `,
  //   });
  //   return c.text(
  //     interaction.output_text ? interaction.output_text : "No output available",
  //   );
});

export default app;
