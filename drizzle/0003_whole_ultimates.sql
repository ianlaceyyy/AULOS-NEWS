CREATE TABLE `narrative_sentences` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`narrative_version_id` integer NOT NULL,
	`position` integer NOT NULL,
	`label` text NOT NULL,
	`classification` text NOT NULL,
	`text` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `narrative_sentence_position_unique` ON `narrative_sentences` (`narrative_version_id`,`position`);--> statement-breakpoint
CREATE TABLE `narrative_versions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`event_id` integer NOT NULL,
	`version` integer NOT NULL,
	`headline` text NOT NULL,
	`dek` text NOT NULL,
	`generation_mode` text NOT NULL,
	`evidence_hash` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `narrative_event_version_unique` ON `narrative_versions` (`event_id`,`version`);--> statement-breakpoint
CREATE TABLE `sentence_citations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`sentence_id` integer NOT NULL,
	`article_id` integer NOT NULL,
	`citation_order` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sentence_article_unique` ON `sentence_citations` (`sentence_id`,`article_id`);