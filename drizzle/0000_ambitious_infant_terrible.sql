CREATE TABLE `entries` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`owner` text NOT NULL,
	`name` text NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`subject` text NOT NULL,
	`kind` text NOT NULL,
	`files` text DEFAULT '[]' NOT NULL,
	`source` text DEFAULT '' NOT NULL,
	`exercise` text DEFAULT '' NOT NULL,
	`answer` text DEFAULT '' NOT NULL,
	`created` integer NOT NULL,
	`resolved` integer DEFAULT 0 NOT NULL,
	`helper` text,
	`helper_name` text,
	`reflection` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `replies` (
	`id` text PRIMARY KEY NOT NULL,
	`entry_id` text NOT NULL,
	`owner` text NOT NULL,
	`name` text NOT NULL,
	`body` text NOT NULL,
	`files` text DEFAULT '[]' NOT NULL,
	`created` integer NOT NULL,
	FOREIGN KEY (`entry_id`) REFERENCES `entries`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `reports` (
	`entry_id` text NOT NULL,
	`owner` text NOT NULL,
	`reason` text NOT NULL,
	`created` integer NOT NULL,
	PRIMARY KEY(`entry_id`, `owner`)
);
--> statement-breakpoint
CREATE TABLE `uploads` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`entry_id` text,
	`name` text NOT NULL,
	`mime` text NOT NULL,
	`size` integer NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `votes` (
	`entry_id` text NOT NULL,
	`owner` text NOT NULL,
	`score` integer NOT NULL,
	PRIMARY KEY(`entry_id`, `owner`),
	FOREIGN KEY (`entry_id`) REFERENCES `entries`(`id`) ON UPDATE no action ON DELETE cascade
);
