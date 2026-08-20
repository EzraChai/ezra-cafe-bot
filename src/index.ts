import { Hono } from "hono";

import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.AI_API_KEY,
});

const app = new Hono();

app.post("/telegram/webhook", async (c) => {
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
