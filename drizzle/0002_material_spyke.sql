CREATE TABLE `footer` (
	`id` int AUTO_INCREMENT NOT NULL,
	`address` text,
	`phone` varchar(20),
	`email` varchar(255),
	`socialLinks` json,
	`copyrightText` text,
	`aboutText` text,
	`quickLinks` json,
	`isPublished` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `footer_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `hero` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`subtitle` varchar(500),
	`backgroundImage` varchar(500),
	`backgroundVideo` varchar(500),
	`ctaText` varchar(100),
	`ctaLink` varchar(500),
	`isPublished` boolean DEFAULT false,
	`order` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `hero_id` PRIMARY KEY(`id`)
);
