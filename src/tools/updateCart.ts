import { FunctionDeclaration, Type } from "@google/genai";
import { drizzle } from "drizzle-orm/d1";
import { cartItems, menuItems } from "../db/schema";
import { and, eq } from "drizzle-orm";

export const updateCartTool: FunctionDeclaration = {
  name: "update_cart",
  description:
    "Change the quantity of an existing menu item in the customer's cart. The quantity is replaced with the new exact quantity.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      item_id: {
        type: Type.STRING,
        description: "The exact menu item ID returned by search_menu.",
      },
      quantity: {
        type: Type.INTEGER,
        description: "The new quantity to set for the item in the cart.",
      },
    },
    required: ["item_id", "quantity"],
  },
};

export async function updateCart(
  db: ReturnType<typeof drizzle>,
  itemId: string,
  customerId: number,
  quantity: number,
) {
  if (!Number.isInteger(quantity) || quantity <= 0) {
    return {
      success: false,
      message: "Quantity must be zero or greater.",
    };
  }
  const existingItem = await db
    .select({
      cartItemId: cartItems.id,
      itemId: menuItems.id,
      name: menuItems.name,
      price: menuItems.price,
      oldQuantity: cartItems.quantity,
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
      message: "The item is not in the cart.",
    };
  }

  await db
    .update(cartItems)
    .set({ quantity })
    .where(eq(cartItems.id, existingItem[0].cartItemId));

  return {
    success: true,
    item_id: itemId,
    name: existingItem[0].name,
    old_quantity: existingItem[0].oldQuantity,
    new_quantity: quantity,
    price: existingItem[0].price,
    subtotal: existingItem[0].price * quantity,
  };
}
