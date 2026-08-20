import { FunctionDeclaration, Type } from "@google/genai";
import { drizzle } from "drizzle-orm/d1";
import { cartItems, menuItems } from "../db/schema";
import { and, eq } from "drizzle-orm";

export const addToCartTool: FunctionDeclaration = {
  name: "add_to_cart",

  description:
    "Add one or more items from the cafe menu to the customer's cart.",

  parameters: {
    type: Type.OBJECT,

    properties: {
      item_id: {
        type: Type.STRING,
        description: "The exact menu item ID returned by search_menu.",
      },

      quantity: {
        type: Type.INTEGER,
        description: "The number of items to add to the cart.",
      },
    },

    required: ["item_id", "quantity"],
  },
};

export async function addToCart(
  db: ReturnType<typeof drizzle>,
  itemId: string,
  customerId: number,
  quantity: number,
) {
  if (quantity <= 0) {
    return {
      success: false,
      message: "Quantity must be greater than zero.",
    };
  }

  const menuItem = await db
    .select()
    .from(menuItems)
    .where(and(eq(menuItems.id, itemId), eq(menuItems.active, true)))
    .limit(1);

  if (menuItem.length === 0) {
    return {
      success: false,
      message: "The specified menu item does not exist or is not available.",
    };
  }

  const existing = await db
    .select()
    .from(cartItems)
    .where(
      and(
        eq(cartItems.customerId, customerId),
        eq(cartItems.menuItemId, itemId),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(cartItems)
      .set({
        quantity: existing[0].quantity + quantity,
      })
      .where(eq(cartItems.id, existing[0].id));
  } else {
    await db.insert(cartItems).values({
      customerId,
      menuItemId: itemId,
      quantity,
    });
  }

  return {
    success: true,
    item: menuItem[0].name,
    quantity,
    message: `Added ${quantity} × ${menuItem[0].name} to the cart.`,
  };
}
