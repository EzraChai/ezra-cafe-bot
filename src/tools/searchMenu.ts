import { eq } from "drizzle-orm";
import { menuItems } from "../db/schema";
import { drizzle } from "drizzle-orm/d1";

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
