ALTER TABLE `finance_entries` ADD `entry_type` text DEFAULT 'Receita' NOT NULL;--> statement-breakpoint
ALTER TABLE `finance_entries` ADD `customer_type` text DEFAULT 'Cadastrado' NOT NULL;--> statement-breakpoint
ALTER TABLE `finance_entries` ADD `customer_id` text;--> statement-breakpoint
ALTER TABLE `finance_entries` ADD `customer_document` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `finance_entries` ADD `customer_phone` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `finance_entries` ADD `customer_email` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `finance_entries` ADD `category` text DEFAULT 'Outros' NOT NULL;--> statement-breakpoint
ALTER TABLE `finance_entries` ADD `payment_method` text DEFAULT 'Não informado' NOT NULL;--> statement-breakpoint
ALTER TABLE `finance_entries` ADD `paid_at` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `finance_entries` ADD `receipt_number` text DEFAULT '' NOT NULL;--> statement-breakpoint
CREATE INDEX `idx_finance_company_type` ON `finance_entries` (`company_id`,`entry_type`);--> statement-breakpoint
CREATE INDEX `idx_finance_company_customer` ON `finance_entries` (`company_id`,`customer_id`);