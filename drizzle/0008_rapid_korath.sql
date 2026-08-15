CREATE TABLE `advance_repayments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`advanceId` int NOT NULL,
	`payrollPeriodId` int,
	`repaymentDate` varchar(10) NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`notes` text,
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `advance_repayments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `attendance_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`scheduleId` int,
	`workDate` varchar(10) NOT NULL,
	`scheduledStartTime` varchar(5),
	`scheduledEndTime` varchar(5),
	`actualStartTime` varchar(5),
	`actualEndTime` varchar(5),
	`status` enum('present','leave','day_off','absent','late','early_leave','half_day','emergency_overtime') NOT NULL DEFAULT 'present',
	`lateMinutes` int NOT NULL DEFAULT 0,
	`earlyLeaveMinutes` int NOT NULL DEFAULT 0,
	`mealAllowance` decimal(12,2) NOT NULL DEFAULT '0.00',
	`notes` text,
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `attendance_records_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `employee_advances` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`advanceDate` varchar(10) NOT NULL,
	`originalAmount` decimal(12,2) NOT NULL,
	`notes` text,
	`status` enum('open','settled') NOT NULL DEFAULT 'open',
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `employee_advances_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `employee_salary_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`effectiveFrom` varchar(10) NOT NULL,
	`effectiveTo` varchar(10),
	`salaryType` enum('daily','hourly','monthly','special') NOT NULL,
	`dailyRate` decimal(12,2),
	`hourlyRate` decimal(12,2),
	`monthlyRate` decimal(12,2),
	`mealAllowance` decimal(12,2) NOT NULL DEFAULT '0.00',
	`supervisorAllowance` decimal(12,2) NOT NULL DEFAULT '0.00',
	`drivingAllowance` decimal(12,2) NOT NULL DEFAULT '0.00',
	`transportationAllowance` decimal(12,2) NOT NULL DEFAULT '0.00',
	`otherAllowance` decimal(12,2) NOT NULL DEFAULT '0.00',
	`overtimeMode` enum('manual','hourly_multiplier','fixed') NOT NULL DEFAULT 'manual',
	`overtimeMultiplier` decimal(6,2) NOT NULL DEFAULT '1.00',
	`overtimeFixedRate` decimal(12,2),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `employee_salary_settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `employees` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`employeeCode` varchar(32),
	`name` varchar(120) NOT NULL,
	`nickname` varchar(120),
	`phone` varchar(32),
	`nationalIdEncrypted` varchar(512),
	`address` text,
	`jobTitle` varchar(120),
	`hireDate` varchar(10) NOT NULL,
	`terminationDate` varchar(10),
	`employmentStatus` enum('active','terminated') NOT NULL DEFAULT 'active',
	`bankName` varchar(120),
	`bankAccountEncrypted` varchar(512),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `employees_id` PRIMARY KEY(`id`),
	CONSTRAINT `employees_employeeCode_unique` UNIQUE(`employeeCode`)
);
--> statement-breakpoint
CREATE TABLE `overtime_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`workDate` varchar(10) NOT NULL,
	`startTime` varchar(5) NOT NULL,
	`endTime` varchar(5) NOT NULL,
	`hours` decimal(8,2) NOT NULL,
	`multiplier` decimal(6,2) NOT NULL DEFAULT '1.00',
	`calculatedAmount` decimal(12,2) NOT NULL,
	`manualAmount` decimal(12,2),
	`notes` text,
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `overtime_records_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payroll_audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`actorUserId` int NOT NULL,
	`entityType` varchar(64) NOT NULL,
	`entityId` int NOT NULL,
	`action` varchar(64) NOT NULL,
	`beforeData` json,
	`afterData` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `payroll_audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payroll_bonuses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`payrollPeriodId` int NOT NULL,
	`bonusDate` varchar(10) NOT NULL,
	`name` varchar(120) NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`notes` text,
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payroll_bonuses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payroll_deductions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`payrollPeriodId` int NOT NULL,
	`deductionDate` varchar(10) NOT NULL,
	`type` enum('advance','salary_advance','labor_insurance','health_insurance','late','early_leave','absence','other') NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`notes` text,
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payroll_deductions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payroll_line_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`payrollRunId` int NOT NULL,
	`category` enum('base_salary','daily_wage','hourly_wage','overtime','meal','supervisor_allowance','driving_allowance','transportation_allowance','bonus','perfect_attendance','other_income','advance','labor_insurance','health_insurance','late','early_leave','absence','other_deduction') NOT NULL,
	`direction` enum('income','deduction') NOT NULL,
	`label` varchar(160) NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`sourceType` varchar(64),
	`sourceId` int,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `payroll_line_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payroll_payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`payrollRunId` int NOT NULL,
	`employeeId` int NOT NULL,
	`payrollPeriodId` int NOT NULL,
	`netAmount` decimal(12,2) NOT NULL,
	`paidAt` timestamp,
	`paymentMethod` enum('pending','transfer','cash','other') NOT NULL DEFAULT 'pending',
	`bankNameSnapshot` varchar(120),
	`bankAccountMaskedSnapshot` varchar(64),
	`notes` text,
	`status` enum('pending','transferred','cash','other') NOT NULL DEFAULT 'pending',
	`recordedByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payroll_payments_id` PRIMARY KEY(`id`),
	CONSTRAINT `payroll_payments_payrollRunId_unique` UNIQUE(`payrollRunId`)
);
--> statement-breakpoint
CREATE TABLE `payroll_periods` (
	`id` int AUTO_INCREMENT NOT NULL,
	`label` varchar(32) NOT NULL,
	`periodStart` varchar(10) NOT NULL,
	`periodEnd` varchar(10) NOT NULL,
	`status` enum('draft','pending_review','confirmed','pending_payment','paid') NOT NULL DEFAULT 'draft',
	`confirmedAt` timestamp,
	`confirmedByUserId` int,
	`paidAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payroll_periods_id` PRIMARY KEY(`id`),
	CONSTRAINT `payroll_periods_label_unique` UNIQUE(`label`)
);
--> statement-breakpoint
CREATE TABLE `payroll_runs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`payrollPeriodId` int NOT NULL,
	`employeeId` int NOT NULL,
	`status` enum('draft','pending_review','confirmed','pending_payment','paid') NOT NULL DEFAULT 'draft',
	`grossPay` decimal(12,2) NOT NULL DEFAULT '0.00',
	`deductionTotal` decimal(12,2) NOT NULL DEFAULT '0.00',
	`netPay` decimal(12,2) NOT NULL DEFAULT '0.00',
	`calculatedAt` timestamp,
	`confirmedAt` timestamp,
	`confirmedByUserId` int,
	`lockedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payroll_runs_id` PRIMARY KEY(`id`),
	CONSTRAINT `payroll_runs_period_employee_unique` UNIQUE(`payrollPeriodId`,`employeeId`)
);
--> statement-breakpoint
CREATE TABLE `work_schedules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`workDate` varchar(10) NOT NULL,
	`startTime` varchar(5) NOT NULL,
	`endTime` varchar(5) NOT NULL,
	`location` varchar(500),
	`notes` text,
	`status` enum('scheduled','completed','cancelled') NOT NULL DEFAULT 'scheduled',
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `work_schedules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('super_admin','admin','manager','customer_service','marketing','editor','accountant','supervisor','employee','user') NOT NULL DEFAULT 'user';--> statement-breakpoint
CREATE INDEX `advance_repayments_advance_idx` ON `advance_repayments` (`advanceId`);--> statement-breakpoint
CREATE INDEX `attendance_employee_date_idx` ON `attendance_records` (`employeeId`,`workDate`);--> statement-breakpoint
CREATE INDEX `attendance_schedule_idx` ON `attendance_records` (`scheduleId`);--> statement-breakpoint
CREATE INDEX `advances_employee_status_idx` ON `employee_advances` (`employeeId`,`status`);--> statement-breakpoint
CREATE INDEX `salary_settings_employee_effective_idx` ON `employee_salary_settings` (`employeeId`,`effectiveFrom`);--> statement-breakpoint
CREATE INDEX `employees_user_idx` ON `employees` (`userId`);--> statement-breakpoint
CREATE INDEX `employees_status_idx` ON `employees` (`employmentStatus`);--> statement-breakpoint
CREATE INDEX `overtime_employee_date_idx` ON `overtime_records` (`employeeId`,`workDate`);--> statement-breakpoint
CREATE INDEX `payroll_audit_entity_idx` ON `payroll_audit_logs` (`entityType`,`entityId`);--> statement-breakpoint
CREATE INDEX `payroll_audit_actor_idx` ON `payroll_audit_logs` (`actorUserId`);--> statement-breakpoint
CREATE INDEX `bonuses_employee_period_idx` ON `payroll_bonuses` (`employeeId`,`payrollPeriodId`);--> statement-breakpoint
CREATE INDEX `deductions_employee_period_idx` ON `payroll_deductions` (`employeeId`,`payrollPeriodId`);--> statement-breakpoint
CREATE INDEX `payroll_line_items_run_idx` ON `payroll_line_items` (`payrollRunId`);--> statement-breakpoint
CREATE INDEX `payments_period_status_idx` ON `payroll_payments` (`payrollPeriodId`,`status`);--> statement-breakpoint
CREATE INDEX `payroll_runs_status_idx` ON `payroll_runs` (`status`);--> statement-breakpoint
CREATE INDEX `schedules_employee_date_idx` ON `work_schedules` (`employeeId`,`workDate`);--> statement-breakpoint
CREATE INDEX `schedules_date_idx` ON `work_schedules` (`workDate`);