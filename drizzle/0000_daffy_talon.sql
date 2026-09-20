CREATE TABLE `quotes` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text DEFAULT 'securitytc' NOT NULL,
	`number` text NOT NULL,
	`customer_name` text NOT NULL,
	`service_type` text NOT NULL,
	`total_cents` integer NOT NULL,
	`status` text DEFAULT 'Rascunho' NOT NULL,
	`valid_until` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_quotes_company_number` ON `quotes` (`company_id`,`number`);--> statement-breakpoint
CREATE INDEX `idx_quotes_company_status` ON `quotes` (`company_id`,`status`);--> statement-breakpoint
CREATE TABLE `work_orders` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text DEFAULT 'securitytc' NOT NULL,
	`number` text NOT NULL,
	`customer_name` text NOT NULL,
	`service_type` text NOT NULL,
	`status` text DEFAULT 'Aberta' NOT NULL,
	`scheduled_at` text NOT NULL,
	`technician` text NOT NULL,
	`issue` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_work_orders_company_number` ON `work_orders` (`company_id`,`number`);--> statement-breakpoint
CREATE INDEX `idx_work_orders_company_status` ON `work_orders` (`company_id`,`status`);