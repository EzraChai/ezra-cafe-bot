import { FunctionDeclaration, Type } from "@google/genai";
import { cartItems, menuItems } from "../db/schema";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";

export const removeFromCartTool: FunctionDeclaration = {
  name: "remove_from_cart",
  description: "Remove a specific menu item from the customer's cart.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      item_id: {
        type: Type.STRING,
        description: "The exact menu item ID to be removed from the cart.",
      },
    },
    required: ["item_id"],
  },
};

export async function removeFromCart(
  db: ReturnType<typeof drizzle>,
  itemId: string,
  customerId: number,
) {
  const existingItem = await db
    .select({
      cartItemId: cartItems.id,
      name: menuItems.name,
      quantity: cartItems.quantity,
    })
    .from(cartItems)
    .innerJoin(menuItems, eq(cartItems.menuItemId, menuItems.id))
    .where(
      and(
        eq(cartItems.customerId, customerId),
        eq(cartItems.menuItemId, itemId),
      ),
    )
    .limit(1);

  if (existingItem.length === 0) {
    return {
      success: false,
      error: "The item is not in the cart",
    };
  }

  await db
    .delete(cartItems)
    .where(eq(cartItems.id, existingItem[0].cartItemId));
  return {
    success: true,
    item_id: itemId,
    name: existingItem[0].name,
    removed_quantity: existingItem[0].quantity,
  };
}
