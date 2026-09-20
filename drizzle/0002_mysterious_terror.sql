CREATE TABLE `service_photos` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text DEFAULT 'securitytc' NOT NULL,
	`order_id` text NOT NULL,
	`object_key` text NOT NULL,
	`file_name` text NOT NULL,
	`content_type` text NOT NULL,
	`size_bytes` integer NOT NULL,
	`caption` text DEFAULT '' NOT NULL,
	`uploaded_by` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_service_photos_order` ON `service_photos` (`order_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_service_photos_object_key` ON `service_photos` (`object_key`);--> statement-breakpoint
ALTER TABLE `contracts` ADD `payment_terms` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `contracts` ADD `warranty_terms` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `contracts` ADD `termination_penalty_percent` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `contracts` ADD `clauses` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `contracts` ADD `signer_name` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `contracts` ADD `signer_document` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `contracts` ADD `signer_email` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `contracts` ADD `signed_at` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `contracts` ADD `signature_hash` text DEFAULT '' NOT NULL;