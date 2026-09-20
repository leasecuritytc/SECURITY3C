CREATE TABLE `audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text DEFAULT 'securitytc' NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`action` text NOT NULL,
	`description` text NOT NULL,
	`actor_name` text NOT NULL,
	`before_json` text DEFAULT '' NOT NULL,
	`after_json` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_audit_company_created_at` ON `audit_logs` (`company_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_audit_entity` ON `audit_logs` (`entity_type`,`entity_id`);--> statement-breakpoint
CREATE TABLE `catalog_items` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text DEFAULT 'securitytc' NOT NULL,
	`name` text NOT NULL,
	`item_type` text NOT NULL,
	`service_mode` text NOT NULL,
	`category` text DEFAULT '' NOT NULL,
	`unit` text DEFAULT 'un' NOT NULL,
	`price_cents` integer NOT NULL,
	`warranty` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'Ativo' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT '' NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
CREATE INDEX `idx_catalog_company_name` ON `catalog_items` (`company_id`,`name`);--> statement-breakpoint
CREATE TABLE `contracts` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text DEFAULT 'securitytc' NOT NULL,
	`number` text NOT NULL,
	`customer_name` text NOT NULL,
	`service_mode` text NOT NULL,
	`service_type` text NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text DEFAULT '' NOT NULL,
	`total_cents` integer NOT NULL,
	`status` text DEFAULT 'Rascunho' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT '' NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_contracts_company_number` ON `contracts` (`company_id`,`number`);--> statement-breakpoint
CREATE INDEX `idx_contracts_company_status` ON `contracts` (`company_id`,`status`);--> statement-breakpoint
CREATE TABLE `customers` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text DEFAULT 'securitytc' NOT NULL,
	`name` text NOT NULL,
	`person_type` text NOT NULL,
	`document` text DEFAULT '' NOT NULL,
	`contact_name` text DEFAULT '' NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`email` text DEFAULT '' NOT NULL,
	`address` text DEFAULT '' NOT NULL,
	`city` text DEFAULT '' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'Ativo' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT '' NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
CREATE INDEX `idx_customers_company_name` ON `customers` (`company_id`,`name`);--> statement-breakpoint
CREATE TABLE `finance_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text DEFAULT 'securitytc' NOT NULL,
	`customer_name` text NOT NULL,
	`reference` text NOT NULL,
	`due_date` text NOT NULL,
	`amount_cents` integer NOT NULL,
	`status` text DEFAULT 'Pendente' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT '' NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
CREATE INDEX `idx_finance_company_due_date` ON `finance_entries` (`company_id`,`due_date`);--> statement-breakpoint
CREATE INDEX `idx_finance_company_status` ON `finance_entries` (`company_id`,`status`);--> statement-breakpoint
ALTER TABLE `quotes` ADD `service_mode` text DEFAULT 'Não informado' NOT NULL;--> statement-breakpoint
ALTER TABLE `quotes` ADD `description` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `quotes` ADD `updated_at` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `quotes` ADD `deleted_at` text;--> statement-breakpoint
ALTER TABLE `work_orders` ADD `service_mode` text DEFAULT 'Não informado' NOT NULL;--> statement-breakpoint
ALTER TABLE `work_orders` ADD `diagnosis` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `work_orders` ADD `materials` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `work_orders` ADD `warranty` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `work_orders` ADD `updated_at` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `work_orders` ADD `deleted_at` text;