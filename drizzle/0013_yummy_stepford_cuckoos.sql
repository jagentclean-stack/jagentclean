CREATE TABLE `cms_permission_audit_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`role` varchar(64) NOT NULL,
	`permission` varchar(96) NOT NULL,
	`previousAllowed` boolean,
	`nextAllowed` boolean NOT NULL,
	`changedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cms_permission_audit_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cms_role_permission_overrides` (
	`id` int AUTO_INCREMENT NOT NULL,
	`role` varchar(64) NOT NULL,
	`permission` varchar(96) NOT NULL,
	`isAllowed` boolean NOT NULL,
	`updatedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cms_role_permission_overrides_id` PRIMARY KEY(`id`),
	CONSTRAINT `cms_role_permission_overrides_role_permission_unique` UNIQUE(`role`,`permission`)
);
--> statement-breakpoint
CREATE INDEX `cms_permission_audit_log_role_permission_idx` ON `cms_permission_audit_log` (`role`,`permission`);--> statement-breakpoint
CREATE INDEX `cms_permission_audit_log_changed_by_idx` ON `cms_permission_audit_log` (`changedBy`);--> statement-breakpoint
CREATE INDEX `cms_role_permission_overrides_role_idx` ON `cms_role_permission_overrides` (`role`);