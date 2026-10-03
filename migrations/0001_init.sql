CREATE TABLE `cache` (
	`id` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL,
	`updated` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `members` (
	`email` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`team_id` integer NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `member_team` ON `members` (`team_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `member_user` ON `members` (`user_id`);--> statement-breakpoint
CREATE TABLE `picks` (
	`id` text PRIMARY KEY NOT NULL,
	`season` integer NOT NULL,
	`week` integer NOT NULL,
	`team_id` integer NOT NULL,
	`user_id` text NOT NULL,
	`data` text NOT NULL,
	`result` text DEFAULT 'pending' NOT NULL,
	`actual` text,
	`updated` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `pick_team_week` ON `picks` (`season`,`week`,`team_id`);--> statement-breakpoint
CREATE TABLE `rounds` (
	`id` text PRIMARY KEY NOT NULL,
	`season` integer NOT NULL,
	`week` integer NOT NULL,
	`data` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `usage` (
	`id` text PRIMARY KEY NOT NULL,
	`credits` integer DEFAULT 0 NOT NULL
);
