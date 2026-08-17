-- MySQL schema for HMHMS
CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(128) NOT NULL UNIQUE,
  `password_hash` VARCHAR(128) NULL,
  `name` VARCHAR(128) NOT NULL,
  `active` BOOLEAN DEFAULT TRUE,
  `browser_notifications_enabled` BOOLEAN DEFAULT TRUE,
  `email_verified` BOOLEAN DEFAULT FALSE,
  `verification_token` VARCHAR(255) NULL,
  `verification_token_expires` DATETIME NULL,
  `oauth_provider` VARCHAR(50) NULL,
  `oauth_id` VARCHAR(255) NULL,
  `avatar_url` VARCHAR(500) NULL,
  INDEX `idx_users_oauth_provider` (`oauth_provider`),
  INDEX `idx_users_oauth_id` (`oauth_id`),
  UNIQUE KEY `unique_oauth_provider_id` (`oauth_provider`, `oauth_id`)
);

CREATE TABLE `monitors` (
  `id` VARCHAR(36) PRIMARY KEY,
  `user_id` INT NOT NULL,
  `team_id` INT NULL,
  `name` VARCHAR(128) NOT NULL,
  `type` ENUM('http','tcp','ping','smb') NOT NULL,
  `target` VARCHAR(255) NOT NULL,
  `port` INT,
  `interval_seconds` INT DEFAULT 60,
  `timeout_ms` INT DEFAULT 5000,
  `active` BOOLEAN DEFAULT TRUE,
  `is_paused` BOOLEAN DEFAULT FALSE,
  `tags` VARCHAR(255),
  `smb_username` VARCHAR(128),
  `smb_password` VARCHAR(128),
  `dependency` VARCHAR(255),
  `email_recipients` TEXT,
  `notify_alert` BOOLEAN DEFAULT TRUE,
  `notify_owner` BOOLEAN DEFAULT TRUE,
  `retry_interval` INT DEFAULT 60,
  `max_retries` INT DEFAULT 3,
  `notification_resend_after` INT DEFAULT 180,
  `last_check` DATETIME NULL,
  `last_status` ENUM('up','down','unknown') DEFAULT 'unknown',
  `last_response_time` INT NULL,
  `uptime_percentage` DECIMAL(5,2) DEFAULT 100.00,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_monitors_user_id` (`user_id`),
  INDEX `idx_monitors_team_id` (`team_id`),
  INDEX `idx_monitors_last_check` (`last_check`),
  INDEX `idx_monitors_active_paused` (`active`, `is_paused`),
  CONSTRAINT `fk_monitors_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

CREATE TABLE `check_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `monitor_id` VARCHAR(36) NOT NULL,
  `timestamp` DATETIME NOT NULL,
  `status` ENUM('up','down') NOT NULL,
  `response_time_ms` INT,
  `http_status` INT,
  `error_text` TEXT,
  INDEX (`monitor_id`),
  INDEX (`timestamp`)
);

-- Teams table
CREATE TABLE `teams` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(128) NOT NULL,
  `description` TEXT,
  `created_by` INT NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_teams_created_by` (`created_by`),
  CONSTRAINT `fk_teams_creator` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

-- Team members table
CREATE TABLE `team_members` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `team_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `role` ENUM('owner','admin','member') NOT NULL DEFAULT 'member',
  `status` ENUM('pending','active') NOT NULL DEFAULT 'pending',
  `joined_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_team_member` (`team_id`, `user_id`),
  INDEX `idx_team_members_team_id` (`team_id`),
  INDEX `idx_team_members_user_id` (`user_id`),
  CONSTRAINT `fk_team_members_team` FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_team_members_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

-- Shared monitors table
CREATE TABLE `shared_monitors` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `monitor_id` VARCHAR(36) NOT NULL,
  `shared_by` INT NOT NULL,
  `shared_with_user` INT NULL,
  `shared_with_team` INT NULL,
  `role` ENUM('viewer','editor') NOT NULL DEFAULT 'viewer',
  `status` ENUM('pending','accepted','declined') NOT NULL DEFAULT 'pending',
  `shared_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `responded_at` DATETIME NULL,
  INDEX `idx_shared_monitors_monitor_id` (`monitor_id`),
  INDEX `idx_shared_monitors_shared_with_user` (`shared_with_user`),
  INDEX `idx_shared_monitors_shared_with_team` (`shared_with_team`),
  CONSTRAINT `fk_shared_monitors_monitor` FOREIGN KEY (`monitor_id`) REFERENCES `monitors`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_shared_monitors_shared_by` FOREIGN KEY (`shared_by`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_shared_monitors_user` FOREIGN KEY (`shared_with_user`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_shared_monitors_team` FOREIGN KEY (`shared_with_team`) REFERENCES `teams`(`id`) ON DELETE CASCADE,
  CHECK ((`shared_with_user` IS NOT NULL AND `shared_with_team` IS NULL) OR (`shared_with_user` IS NULL AND `shared_with_team` IS NOT NULL))
);

-- Notifications table (system notifications for UI)
CREATE TABLE `user_notifications` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `type` ENUM('share','invite','alert','system') NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `related_monitor_id` VARCHAR(36) NULL,
  `related_team_id` INT NULL,
  `related_share_id` INT NULL,
  `is_read` BOOLEAN DEFAULT FALSE,
  `action_url` VARCHAR(255) NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_user_notifications_user_id` (`user_id`),
  INDEX `idx_user_notifications_is_read` (`is_read`),
  INDEX `idx_user_notifications_type` (`type`),
  CONSTRAINT `fk_user_notifications_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

-- Notifications table (tracks sent email notifications for throttling)
CREATE TABLE `notifications` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `monitor_id` VARCHAR(36) NOT NULL,
  `event_type` ENUM('down','up') NOT NULL,
  `sent_to` VARCHAR(255) NOT NULL,
  `sent_at` DATETIME NOT NULL,
  INDEX `idx_notifications_monitor_id` (`monitor_id`),
  INDEX `idx_notifications_sent_at` (`sent_at`)
);

-- Monitor tags table
CREATE TABLE `monitor_tags` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `monitor_id` VARCHAR(36) NOT NULL,
  `tag` VARCHAR(64) NOT NULL,
  UNIQUE KEY `unique_monitor_tag` (`monitor_id`, `tag`),
  INDEX `idx_monitor_tags_monitor_id` (`monitor_id`),
  INDEX `idx_monitor_tags_tag` (`tag`),
  CONSTRAINT `fk_monitor_tags_monitor` FOREIGN KEY (`monitor_id`) REFERENCES `monitors`(`id`) ON DELETE CASCADE
);

-- Monitor dependencies table
CREATE TABLE `monitor_dependencies` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `monitor_id` VARCHAR(36) NOT NULL,
  `depends_on_monitor_id` VARCHAR(36) NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_dependency` (`monitor_id`, `depends_on_monitor_id`),
  INDEX `idx_monitor_dependencies_monitor_id` (`monitor_id`),
  INDEX `idx_monitor_dependencies_depends_on` (`depends_on_monitor_id`),
  CONSTRAINT `fk_monitor_dependencies_monitor` FOREIGN KEY (`monitor_id`) REFERENCES `monitors`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_monitor_dependencies_depends_on` FOREIGN KEY (`depends_on_monitor_id`) REFERENCES `monitors`(`id`) ON DELETE CASCADE,
  CHECK (`monitor_id` != `depends_on_monitor_id`)
);
