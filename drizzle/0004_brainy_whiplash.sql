CREATE TABLE `portfolio_items` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text DEFAULT 'securitytc' NOT NULL,
	`title` text NOT NULL,
	`service_type` text NOT NULL,
	`service_mode` text NOT NULL,
	`city` text DEFAULT '' NOT NULL,
	`completed_at` text DEFAULT '' NOT NULL,
	`summary` text NOT NULL,
	`image_object_key` text NOT NULL,
	`image_name` text NOT NULL,
	`image_type` text NOT NULL,
	`alt_text` text NOT NULL,
	`status` text DEFAULT 'Rascunho' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`featured` integer DEFAULT false NOT NULL,
	`created_by` text NOT NULL,
	`updated_by` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
CREATE INDEX `idx_portfolio_company_status_sort` ON `portfolio_items` (`company_id`,`status`,`sort_order`);--> statement-breakpoint
CREATE TABLE `site_content` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text DEFAULT 'securitytc' NOT NULL,
	`content_json` text NOT NULL,
	`updated_by` text NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
