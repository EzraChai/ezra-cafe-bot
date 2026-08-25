import { FunctionDeclaration, Type } from "@google/genai";
import { drizzle } from "drizzle-orm/d1";
import { cartItems, menuItems } from "../db/schema";
import { and, eq } from "drizzle-orm";

export const updateCartTool: FunctionDeclaration = {
  name: "update_cart",
  description: `
Set the FINAL quantity of an existing item in the customer's cart.

IMPORTANT:
This tool REPLACES the existing quantity.
It does NOT add to the existing quantity.

Example:
If the cart currently contains:
Nasi Lemak × 4

Customer says:
"I want 3 nasi lemak instead of 4."

Call:
update_cart(item_id: "<nasi-le-mak-id>", quantity: 3)

The final quantity will be:
Nasi Lemak × 3

NOT:
Nasi Lemak × 7

Use update_cart when the customer wants to CHANGE, REPLACE, REDUCE, or SET the quantity.

Examples:
- "Change my nasi lemak to 3"
- "Make the nasi lemak 3"
- "I only want 3 nasi lemak"
- "I want 3 nasi lemak instead"
- "I want 3 nasi lemak instead of 4"
- "Change the quantity to 3"
- "Reduce it to 2"
- "Increase it to 5"

Do NOT use update_cart for requests that mean ADDITION.

Examples:
- "Add 3 nasi lemak"
- "Add one more nasi lemak"
- "Give me another nasi lemak"
- "Add 2 more"

Those requests must use add_to_cart.

The quantity parameter is ALWAYS the new FINAL quantity.
`,
  parameters: {
    type: Type.OBJECT,
    properties: {
      item_id: {
        type: Type.STRING,
        description:
          "The exact menu item ID of the item that already exists in the customer's cart.",
      },
      quantity: {
        type: Type.INTEGER,
        description:
          "The NEW FINAL quantity. Replace the existing quantity with this number. Do NOT add this number to the existing quantity.",
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
      message: "Quantity must be greater than zero.",
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

  const item = existingItem[0];

  await db
    .update(cartItems)
    .set({
      quantity,
    })
    .where(eq(cartItems.id, item.cartItemId));

  return {
    success: true,
    item_id: item.itemId,
    name: item.name,
    old_quantity: item.oldQuantity,
    new_quantity: quantity,
    price: item.price,
    subtotal: item.price * quantity,
  };
}
