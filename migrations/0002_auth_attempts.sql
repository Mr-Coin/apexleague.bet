-- Exact per-key attempt counter for password / PIN guessing. The Workers rate-limit
-- binding is permissive and eventually consistent, so it only filters bursts.
CREATE TABLE `auth_attempts` (
	`key` text PRIMARY KEY NOT NULL,
	`window_start` integer NOT NULL,
	`count` integer NOT NULL
);
