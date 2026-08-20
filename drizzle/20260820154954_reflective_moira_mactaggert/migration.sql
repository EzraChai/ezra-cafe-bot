PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_customers` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`telegram_chat_id` integer NOT NULL,
	`telegram_username` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_customers`(`id`, `telegram_chat_id`, `telegram_username`, `created_at`) SELECT `id`, `telegram_chat_id`, `telegram_username`, `created_at` FROM `customers`;--> statement-breakpoint
DROP TABLE `customers`;--> statement-breakpoint
ALTER TABLE `__new_customers` RENAME TO `customers`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
DROP INDEX IF EXISTS `telegram_chat_id_idx`;--> statement-breakpoint
CREATE UNIQUE INDEX `customers_telegram_chat_id_idx` ON `customers` (`telegram_chat_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `cart_customer_menu_item_idx` ON `cart_items` (`customer_id`,`menu_item_id`);