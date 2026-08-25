import { FunctionDeclaration, Type } from "@google/genai";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { cartItems, menuItems } from "../db/schema";

export const getCartTool: FunctionDeclaration = {
  name: "get_cart",

  description:
    "Get the customer's current shopping cart, including items, quantities, prices, and total.",
  parameters: {
    type: Type.OBJECT,

    properties: {},

    required: [],
  },
};

export async function getCart(
  db: ReturnType<typeof drizzle>,
  customerId: number,
) {
  const items = await db
    .select({
      cartItemId: cartItems.id,
      itemId: menuItems.id,
      quantity: cartItems.quantity,
      name: menuItems.name,
      price: menuItems.price,
    })
    .from(cartItems)
    .innerJoin(menuItems, eq(cartItems.menuItemId, menuItems.id))
    .where(eq(cartItems.customerId, customerId));

  if (items.length === 0) {
    return {
      items: [],
      total: 0,
      item_count: 0,
      message: "Your cart is currently empty.",
    };
  }
  const formattedItems = items.map((item) => ({
    cart_item_id: item.cartItemId,
    item_id: item.itemId,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    subtotal: item.price * item.quantity,
  }));

  const total = formattedItems.reduce((sum, item) => sum + item.subtotal, 0);

  const itemCount = formattedItems.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );

  return {
    items: formattedItems,
    total,
    item_count: itemCount,
    currency: "MYR",
  };
}
