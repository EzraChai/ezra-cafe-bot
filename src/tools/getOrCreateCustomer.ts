import { eq } from "drizzle-orm";
import { customers } from "../db/schema";
import { drizzle } from "drizzle-orm/d1";

export async function getOrCreateCustomer(
  db: ReturnType<typeof drizzle>,
  chatId: number,
  username?: string,
) {
  const existing = await db
    .select()
    .from(customers)
    .where(eq(customers.telegramChatId, chatId))
    .limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  const newCustomer = await db
    .insert(customers)
    .values({
      telegramChatId: chatId,
      telegramUsername: username ?? null,
      createdAt: new Date(),
    })
    .returning();

  return newCustomer[0];
}
