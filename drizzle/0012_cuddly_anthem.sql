CREATE TABLE `employee_salary_adjustment_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`salarySettingId` int NOT NULL,
	`adjustedByUserId` int NOT NULL,
	`effectiveDate` varchar(10) NOT NULL,
	`reason` text,
	`previousConfig` json,
	`newConfig` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `employee_salary_adjustment_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `salary_adjustment_employee_date_idx` ON `employee_salary_adjustment_history` (`employeeId`,`effectiveDate`);--> statement-breakpoint
CREATE INDEX `salary_adjustment_setting_idx` ON `employee_salary_adjustment_history` (`salarySettingId`);--> statement-breakpoint
CREATE INDEX `salary_adjustment_actor_idx` ON `employee_salary_adjustment_history` (`adjustedByUserId`);