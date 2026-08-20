import {
  sqliteTable,
  text,
  integer,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const customers = sqliteTable(
  "customers",
  {
    id: integer("id").primaryKey({
      autoIncrement: true,
    }),

    telegramChatId: text("telegram_chat_id").notNull(),

    telegramUsername: text("telegram_username"),

    createdAt: integer("created_at", {
      mode: "timestamp",
    }).notNull(),
  },
  (table) => [uniqueIndex("telegram_chat_id_idx").on(table.telegramChatId)],
);

export const menuItems = sqliteTable("menu_items", {
  id: text("id").primaryKey(),

  name: text("name").notNull(),

  price: integer("price").notNull(),

  active: integer("active", {
    mode: "boolean",
  }).notNull(),
});

export const cartItems = sqliteTable("cart_items", {
  id: integer("id").primaryKey({
    autoIncrement: true,
  }),

  customerId: integer("customer_id")
    .notNull()
    .references(() => customers.id, {
      onDelete: "cascade",
    }),

  menuItemId: text("menu_item_id")
    .notNull()
    .references(() => menuItems.id),

  quantity: integer("quantity").notNull(),
});
