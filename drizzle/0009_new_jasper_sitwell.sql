CREATE TABLE `departments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(120) NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `departments_id` PRIMARY KEY(`id`),
	CONSTRAINT `departments_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `leave_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`leaveType` varchar(80) NOT NULL,
	`startDate` varchar(10) NOT NULL,
	`endDate` varchar(10) NOT NULL,
	`hours` decimal(8,2) NOT NULL DEFAULT '0.00',
	`status` enum('pending','approved','rejected','cancelled') NOT NULL DEFAULT 'pending',
	`reason` text,
	`reviewedByUserId` int,
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leave_records_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payroll_alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` varchar(80) NOT NULL,
	`severity` enum('warning','critical') NOT NULL DEFAULT 'warning',
	`employeeId` int,
	`payrollPeriodId` int,
	`message` varchar(500) NOT NULL,
	`isResolved` boolean NOT NULL DEFAULT false,
	`resolvedByUserId` int,
	`resolvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payroll_alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `positions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`departmentId` int,
	`name` varchar(120) NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `positions_id` PRIMARY KEY(`id`),
	CONSTRAINT `positions_department_name_unique` UNIQUE(`departmentId`,`name`)
);
--> statement-breakpoint
ALTER TABLE `employees` MODIFY COLUMN `employmentStatus` enum('active','inactive','leave_of_absence','terminated') NOT NULL DEFAULT 'active';--> statement-breakpoint
ALTER TABLE `attendance_records` ADD `workHours` decimal(8,2) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE `employees` ADD `email` varchar(320);--> statement-breakpoint
ALTER TABLE `employees` ADD `gender` enum('female','male','other','unspecified');--> statement-breakpoint
ALTER TABLE `employees` ADD `birthDate` varchar(10);--> statement-breakpoint
ALTER TABLE `employees` ADD `emergencyContactName` varchar(120);--> statement-breakpoint
ALTER TABLE `employees` ADD `emergencyContactPhone` varchar(32);--> statement-breakpoint
ALTER TABLE `employees` ADD `departmentId` int;--> statement-breakpoint
ALTER TABLE `employees` ADD `positionId` int;--> statement-breakpoint
ALTER TABLE `overtime_records` ADD `approvedByUserId` int;--> statement-breakpoint
ALTER TABLE `overtime_records` ADD `approvedAt` timestamp;--> statement-breakpoint
ALTER TABLE `overtime_records` ADD `status` enum('pending','approved','rejected') DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `payroll_audit_logs` ADD `reason` text;--> statement-breakpoint
ALTER TABLE `work_schedules` ADD `jobDescription` text;--> statement-breakpoint
ALTER TABLE `work_schedules` ADD `breakMinutes` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `work_schedules` ADD `expectedWorkHours` decimal(8,2);--> statement-breakpoint
CREATE INDEX `leave_employee_dates_idx` ON `leave_records` (`employeeId`,`startDate`,`endDate`);--> statement-breakpoint
CREATE INDEX `leave_status_idx` ON `leave_records` (`status`);--> statement-breakpoint
CREATE INDEX `payroll_alerts_active_idx` ON `payroll_alerts` (`isResolved`,`severity`);--> statement-breakpoint
CREATE INDEX `payroll_alerts_employee_idx` ON `payroll_alerts` (`employeeId`);--> statement-breakpoint
CREATE INDEX `positions_department_idx` ON `positions` (`departmentId`);--> statement-breakpoint
CREATE INDEX `employees_department_idx` ON `employees` (`departmentId`);--> statement-breakpoint
CREATE INDEX `employees_position_idx` ON `employees` (`positionId`);