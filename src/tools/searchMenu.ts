import { eq } from "drizzle-orm";
import { menuItems } from "../db/schema";
import { drizzle } from "drizzle-orm/d1";
import { FunctionDeclaration, Type } from "@google/genai";

export const searchMenuTool: FunctionDeclaration = {
  name: "search_menu",
  description: "Search the cafe menu for available items and their prices.",

  parameters: {
    type: Type.OBJECT,

    properties: {
      query: {
        type: Type.STRING,
        description: "The food or drink the customer is asking about.",
      },
    },

    required: ["query"],
  },
};

export async function searchMenu(
  db: ReturnType<typeof drizzle>,
  query: string,
) {
  const items = await db
    .select()
    .from(menuItems)
    .where(eq(menuItems.active, true));

  if (!query) {
    return items;
  }

  return items.filter((item) =>
    item.name.toLowerCase().includes(query.toLowerCase()),
  );
}
