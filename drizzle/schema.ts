import { 
  int, 
  mysqlEnum, 
  mysqlTable, 
  text, 
  timestamp, 
  varchar,
  boolean,
  decimal,
  json,
  datetime,
  longtext,
  unique
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  passwordHash: varchar("passwordHash", { length: 255 }),
  role: mysqlEnum("role", ["super_admin", "admin", "manager", "customer_service", "marketing", "editor", "user"]).default("user").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * 角色權限表
 */
export const roles = mysqlTable("roles", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 64 }).notNull().unique(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Role = typeof roles.$inferSelect;
export type InsertRole = typeof roles.$inferInsert;

/**
 * 權限設定表
 */
export const permissions = mysqlTable("permissions", {
  id: int("id").autoincrement().primaryKey(),
  roleId: int("roleId").notNull(),
  resource: varchar("resource", { length: 64 }).notNull(),
  canView: boolean("canView").default(false),
  canCreate: boolean("canCreate").default(false),
  canEdit: boolean("canEdit").default(false),
  canDelete: boolean("canDelete").default(false),
  canPublish: boolean("canPublish").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Permission = typeof permissions.$inferSelect;
export type InsertPermission = typeof permissions.$inferInsert;

/**
 * 網站頁面表
 */
export const pages = mysqlTable("pages", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  content: longtext("content"),
  isPublished: boolean("isPublished").default(false),
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  createdBy: int("createdBy"),
});

export type Page = typeof pages.$inferSelect;
export type InsertPage = typeof pages.$inferInsert;

/**
 * 首頁區塊表
 */
export const sections = mysqlTable("sections", {
  id: int("id").autoincrement().primaryKey(),
  pageId: int("pageId").notNull(),
  sectionType: varchar("sectionType", { length: 64 }).notNull(),
  title: varchar("title", { length: 255 }),
  content: longtext("content"),
  data: json("data"),
  order: int("order").default(0),
  isVisible: boolean("isVisible").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Section = typeof sections.$inferSelect;
export type InsertSection = typeof sections.$inferInsert;

/**
 * 導覽列菜單表
 */
export const menus = mysqlTable("menus", {
  id: int("id").autoincrement().primaryKey(),
  label: varchar("label", { length: 255 }).notNull(),
  url: varchar("url", { length: 500 }),
  parentId: int("parentId"),
  order: int("order").default(0),
  icon: varchar("icon", { length: 255 }),
  isVisible: boolean("isVisible").default(true),
  openNewWindow: boolean("openNewWindow").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Menu = typeof menus.$inferSelect;
export type InsertMenu = typeof menus.$inferInsert;

/**
 * 服務項目表
 */
export const services = mysqlTable("services", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: longtext("description"),
  icon: varchar("icon", { length: 500 }),
  bannerImage: varchar("bannerImage", { length: 500 }),
  basePrice: decimal("basePrice", { precision: 10, scale: 2 }),
  pricePerUnit: decimal("pricePerUnit", { precision: 10, scale: 2 }),
  unit: varchar("unit", { length: 64 }),
  promotion: varchar("promotion", { length: 255 }),
  priceNote: text("priceNote"),
  process: longtext("process"),
  faq: longtext("faq"),
  video: varchar("video", { length: 500 }),
  order: int("order").default(0),
  isPublished: boolean("isPublished").default(true),
  seoTitle: varchar("seoTitle", { length: 255 }),
  seoDescription: varchar("seoDescription", { length: 500 }),
  seoKeywords: varchar("seoKeywords", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Service = typeof services.$inferSelect;
export type InsertService = typeof services.$inferInsert;

/**
 * 案例表
 */
export const cases = mysqlTable("cases", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  address: varchar("address", { length: 500 }),
  serviceId: int("serviceId"),
  constructionDate: datetime("constructionDate"),
  constructionTime: varchar("constructionTime", { length: 255 }),
  beforeImages: json("beforeImages"),
  afterImages: json("afterImages"),
  video: varchar("video", { length: 500 }),
  testimonial: longtext("testimonial"),
  googleReview: varchar("googleReview", { length: 500 }),
  tags: json("tags"),
  categoryId: int("categoryId"),
  order: int("order").default(0),
  isPublished: boolean("isPublished").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Case = typeof cases.$inferSelect;
export type InsertCase = typeof cases.$inferInsert;

/**
 * 文章表
 */
export const blogs = mysqlTable("blogs", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  content: longtext("content"),
  excerpt: varchar("excerpt", { length: 500 }),
  featuredImage: varchar("featuredImage", { length: 500 }),
  categoryId: int("categoryId"),
  authorId: int("authorId"),
  isPublished: boolean("isPublished").default(false),
  publishedAt: timestamp("publishedAt"),
  scheduledAt: timestamp("scheduledAt"),
  seoTitle: varchar("seoTitle", { length: 255 }),
  seoDescription: varchar("seoDescription", { length: 500 }),
  seoKeywords: varchar("seoKeywords", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Blog = typeof blogs.$inferSelect;
export type InsertBlog = typeof blogs.$inferInsert;

/**
 * 分類表
 */
export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  type: mysqlEnum("type", ["blog", "case"]).notNull(),
  order: int("order").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

/**
 * FAQ 表
 */
export const faqs = mysqlTable("faqs", {
  id: int("id").autoincrement().primaryKey(),
  question: varchar("question", { length: 500 }).notNull(),
  answer: longtext("answer"),
  categoryId: int("categoryId"),
  order: int("order").default(0),
  isVisible: boolean("isVisible").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FAQ = typeof faqs.$inferSelect;
export type InsertFAQ = typeof faqs.$inferInsert;

/**
 * 客戶評價表
 */
export const reviews = mysqlTable("reviews", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  avatar: varchar("avatar", { length: 500 }),
  rating: int("rating").notNull(),
  content: longtext("content"),
  serviceId: int("serviceId"),
  isHomepageDisplay: boolean("isHomepageDisplay").default(false),
  isPublished: boolean("isPublished").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Review = typeof reviews.$inferSelect;
export type InsertReview = typeof reviews.$inferInsert;

/**
 * Banner 表
 */
export const banners = mysqlTable("banners", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }),
  image: varchar("image", { length: 500 }).notNull(),
  video: varchar("video", { length: 500 }),
  link: varchar("link", { length: 500 }),
  order: int("order").default(0),
  isVisible: boolean("isVisible").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Banner = typeof banners.$inferSelect;
export type InsertBanner = typeof banners.$inferInsert;

/**
 * 媒體表
 */
export const media = mysqlTable("media", {
  id: int("id").autoincrement().primaryKey(),
  filename: varchar("filename", { length: 255 }).notNull(),
  url: varchar("url", { length: 500 }).notNull(),
  type: mysqlEnum("type", ["image", "video"]).notNull(),
  mimeType: varchar("mimeType", { length: 64 }),
  size: int("size"),
  width: int("width"),
  height: int("height"),
  alt: varchar("alt", { length: 500 }),
  category: varchar("category", { length: 255 }),
  tags: json("tags"),
  uploadedBy: int("uploadedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Media = typeof media.$inferSelect;
export type InsertMedia = typeof media.$inferInsert;

/**
 * 聯絡表單表
 */
export const contacts = mysqlTable("contacts", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  message: longtext("message"),
  isRead: boolean("isRead").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Contact = typeof contacts.$inferSelect;
export type InsertContact = typeof contacts.$inferInsert;

/**
 * 預約表
 */
export const bookings = mysqlTable("bookings", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  line: varchar("line", { length: 255 }),
  email: varchar("email", { length: 320 }),
  address: varchar("address", { length: 500 }),
  serviceId: int("serviceId"),
  bookingDate: datetime("bookingDate"),
  images: json("images"),
  requirements: longtext("requirements"),
  status: mysqlEnum("status", ["pending", "quoted", "in_progress", "completed", "cancelled"]).default("pending"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = typeof bookings.$inferInsert;

/**
 * 網站設定表
 */
export const settings = mysqlTable("settings", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 255 }).notNull().unique(),
  value: longtext("value"),
  type: mysqlEnum("type", ["string", "number", "boolean", "json"]).default("string"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Setting = typeof settings.$inferSelect;
export type InsertSetting = typeof settings.$inferInsert;

/**
 * SEO 設定表
 */
export const seo = mysqlTable("seo", {
  id: int("id").autoincrement().primaryKey(),
  pageId: int("pageId"),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  description: varchar("description", { length: 500 }),
  keywords: varchar("keywords", { length: 500 }),
  canonical: varchar("canonical", { length: 500 }),
  ogImage: varchar("ogImage", { length: 500 }),
  schema: json("schema"),
  index: boolean("index").default(true),
  noindex: boolean("noindex").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SEO = typeof seo.$inferSelect;
export type InsertSEO = typeof seo.$inferInsert;

/**
 * 首頁 Hero 區塊表
 */
export const hero = mysqlTable("hero", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  subtitle: varchar("subtitle", { length: 500 }),
  backgroundImage: varchar("backgroundImage", { length: 500 }),
  backgroundVideo: varchar("backgroundVideo", { length: 500 }),
  ctaText: varchar("ctaText", { length: 100 }),
  ctaLink: varchar("ctaLink", { length: 500 }),
  isPublished: boolean("isPublished").default(false),
  order: int("order").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Hero = typeof hero.$inferSelect;
export type InsertHero = typeof hero.$inferInsert;

/**
 * 頁腳表
 */
export const footer = mysqlTable("footer", {
  id: int("id").autoincrement().primaryKey(),
  address: text("address"),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 255 }),
  socialLinks: json("socialLinks"), // { facebook, instagram, line, twitter, etc }
  copyrightText: text("copyrightText"),
  aboutText: text("aboutText"),
  quickLinks: json("quickLinks"), // Array of { label, url }
  isPublished: boolean("isPublished").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Footer = typeof footer.$inferSelect;
export type InsertFooter = typeof footer.$inferInsert;
