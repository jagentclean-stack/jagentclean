ALTER TABLE `employee_salary_settings` MODIFY COLUMN `mealAllowance` decimal(12,2) NOT NULL DEFAULT '100.00';--> statement-breakpoint
ALTER TABLE `employees` ADD `bankAccountLast4` varchar(4);