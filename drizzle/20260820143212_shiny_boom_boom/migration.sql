CREATE TABLE `cart_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`customer_id` integer NOT NULL,
	`menu_item_id` text NOT NULL,
	`quantity` integer NOT NULL,
	CONSTRAINT `fk_cart_items_customer_id_customers_id_fk` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_cart_items_menu_item_id_menu_items_id_fk` FOREIGN KEY (`menu_item_id`) REFERENCES `menu_items`(`id`)
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`telegram_chat_id` text NOT NULL,
	`telegram_username` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `menu_items` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`price` integer NOT NULL,
	`active` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `telegram_chat_id_idx` ON `customers` (`telegram_chat_id`);