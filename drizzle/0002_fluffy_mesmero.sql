CREATE TABLE `claim_relations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`left_claim_id` integer NOT NULL,
	`right_claim_id` integer NOT NULL,
	`relation` text NOT NULL,
	`confidence` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `claim_relations_unique` ON `claim_relations` (`left_claim_id`,`right_claim_id`);--> statement-breakpoint
CREATE TABLE `entities` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`canonical_name` text NOT NULL,
	`entity_type` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `entities_name_type_unique` ON `entities` (`canonical_name`,`entity_type`);--> statement-breakpoint
CREATE TABLE `event_entities` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`event_id` integer NOT NULL,
	`entity_id` integer NOT NULL,
	`mention_count` integer DEFAULT 1 NOT NULL,
	`relevance` real DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `event_entities_unique` ON `event_entities` (`event_id`,`entity_id`);--> statement-breakpoint
CREATE TABLE `event_updates` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`event_id` integer NOT NULL,
	`article_id` integer,
	`update_type` text NOT NULL,
	`headline` text NOT NULL,
	`occurred_at` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
