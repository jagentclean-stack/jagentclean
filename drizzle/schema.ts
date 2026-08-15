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
  unique,
  index
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
  role: mysqlEnum("role", ["super_admin", "admin", "manager", "customer_service", "marketing", "editor", "accountant", "supervisor", "employee", "user"]).default("user").notNull(),
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
  type: mysqlEnum("type", ["blog", "case", "faq"]).notNull(),
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
  serviceId: int("serviceId"),
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

/** 人事薪資管理系統的可維護組織資料。 */
export const departments = mysqlTable("departments", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 120 }).notNull().unique(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const positions = mysqlTable("positions", {
  id: int("id").autoincrement().primaryKey(),
  departmentId: int("departmentId"),
  name: varchar("name", { length: 120 }).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("positions_department_idx").on(table.departmentId), unique("positions_department_name_unique").on(table.departmentId, table.name)]);

/**
 * 人事薪資管理系統：員工主檔。身分證與帳號僅儲存經伺服器端加密的值，
 * 不會經由一般 CMS 或公開 API 輸出。
 */
export const employees = mysqlTable("employees", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  employeeCode: varchar("employeeCode", { length: 32 }).unique(),
  name: varchar("name", { length: 120 }).notNull(),
  nickname: varchar("nickname", { length: 120 }),
  phone: varchar("phone", { length: 32 }),
  email: varchar("email", { length: 320 }),
  nationalIdEncrypted: varchar("nationalIdEncrypted", { length: 512 }),
  gender: mysqlEnum("gender", ["female", "male", "other", "unspecified"]),
  birthDate: varchar("birthDate", { length: 10 }),
  address: text("address"),
  emergencyContactName: varchar("emergencyContactName", { length: 120 }),
  emergencyContactPhone: varchar("emergencyContactPhone", { length: 32 }),
  departmentId: int("departmentId"),
  positionId: int("positionId"),
  jobTitle: varchar("jobTitle", { length: 120 }),
  hireDate: varchar("hireDate", { length: 10 }).notNull(),
  terminationDate: varchar("terminationDate", { length: 10 }),
  employmentStatus: mysqlEnum("employmentStatus", ["active", "inactive", "leave_of_absence", "terminated"]).default("active").notNull(),
  bankName: varchar("bankName", { length: 120 }),
  bankAccountEncrypted: varchar("bankAccountEncrypted", { length: 512 }),
  bankAccountLast4: varchar("bankAccountLast4", { length: 4 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("employees_user_idx").on(table.userId), index("employees_status_idx").on(table.employmentStatus), index("employees_department_idx").on(table.departmentId), index("employees_position_idx").on(table.positionId)]);

export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = typeof employees.$inferInsert;

/** 每位員工可有多個有效期間的獨立薪資設定，不在程式碼中硬編薪資。 */
export const employeeSalarySettings = mysqlTable("employee_salary_settings", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employeeId").notNull(),
  effectiveFrom: varchar("effectiveFrom", { length: 10 }).notNull(),
  effectiveTo: varchar("effectiveTo", { length: 10 }),
  salaryType: mysqlEnum("salaryType", ["daily", "hourly", "monthly", "special"]).notNull(),
  dailyRate: decimal("dailyRate", { precision: 12, scale: 2 }),
  hourlyRate: decimal("hourlyRate", { precision: 12, scale: 2 }),
  monthlyRate: decimal("monthlyRate", { precision: 12, scale: 2 }),
  mealAllowance: decimal("mealAllowance", { precision: 12, scale: 2 }).default("100.00").notNull(),
  supervisorAllowance: decimal("supervisorAllowance", { precision: 12, scale: 2 }).default("0.00").notNull(),
  drivingAllowance: decimal("drivingAllowance", { precision: 12, scale: 2 }).default("0.00").notNull(),
  transportationAllowance: decimal("transportationAllowance", { precision: 12, scale: 2 }).default("0.00").notNull(),
  otherAllowance: decimal("otherAllowance", { precision: 12, scale: 2 }).default("0.00").notNull(),
  overtimeMode: mysqlEnum("overtimeMode", ["manual", "hourly_multiplier", "fixed"]).default("manual").notNull(),
  overtimeMultiplier: decimal("overtimeMultiplier", { precision: 6, scale: 2 }).default("1.00").notNull(),
  overtimeFixedRate: decimal("overtimeFixedRate", { precision: 12, scale: 2 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("salary_settings_employee_effective_idx").on(table.employeeId, table.effectiveFrom)]);

export type EmployeeSalarySetting = typeof employeeSalarySettings.$inferSelect;

/**
 * 員工每次薪資異動的不可變更稽核紀錄。設定本身採有效期間版本化；
 * 此表額外保留調整原因、操作者以及調整前後完整快照，方便會計追溯。
 */
export const employeeSalaryAdjustmentHistory = mysqlTable("employee_salary_adjustment_history", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employeeId").notNull(),
  salarySettingId: int("salarySettingId").notNull(),
  adjustedByUserId: int("adjustedByUserId").notNull(),
  effectiveDate: varchar("effectiveDate", { length: 10 }).notNull(),
  reason: text("reason"),
  previousConfig: json("previousConfig"),
  newConfig: json("newConfig").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("salary_adjustment_employee_date_idx").on(table.employeeId, table.effectiveDate),
  index("salary_adjustment_setting_idx").on(table.salarySettingId),
  index("salary_adjustment_actor_idx").on(table.adjustedByUserId),
]);

export type EmployeeSalaryAdjustmentHistory = typeof employeeSalaryAdjustmentHistory.$inferSelect;

/** 薪資計算、審核、發薪所共同使用的月份與狀態。 */
export const payrollPeriods = mysqlTable("payroll_periods", {
  id: int("id").autoincrement().primaryKey(),
  label: varchar("label", { length: 32 }).notNull().unique(),
  periodStart: varchar("periodStart", { length: 10 }).notNull(),
  periodEnd: varchar("periodEnd", { length: 10 }).notNull(),
  periodType: mysqlEnum("periodType", ["first_half", "second_half", "monthly", "custom"]).default("custom").notNull(),
  status: mysqlEnum("status", ["draft", "pending_review", "confirmed", "pending_payment", "paid"]).default("draft").notNull(),
  confirmedAt: timestamp("confirmedAt"),
  confirmedByUserId: int("confirmedByUserId"),
  paidAt: timestamp("paidAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PayrollPeriod = typeof payrollPeriods.$inferSelect;

/** 一位員工同一天可建立多筆工作時段。 */
export const workSchedules = mysqlTable("work_schedules", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employeeId").notNull(),
  workDate: varchar("workDate", { length: 10 }).notNull(),
  startTime: varchar("startTime", { length: 5 }).notNull(),
  endTime: varchar("endTime", { length: 5 }).notNull(),
  location: varchar("location", { length: 500 }),
  jobDescription: text("jobDescription"),
  breakMinutes: int("breakMinutes").default(0).notNull(),
  expectedWorkHours: decimal("expectedWorkHours", { precision: 8, scale: 2 }),
  notes: text("notes"),
  status: mysqlEnum("status", ["scheduled", "completed", "cancelled"]).default("scheduled").notNull(),
  createdByUserId: int("createdByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("schedules_employee_date_idx").on(table.employeeId, table.workDate), index("schedules_date_idx").on(table.workDate)]);

export type WorkSchedule = typeof workSchedules.$inferSelect;

export const attendanceRecords = mysqlTable("attendance_records", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employeeId").notNull(),
  scheduleId: int("scheduleId"),
  workDate: varchar("workDate", { length: 10 }).notNull(),
  scheduledStartTime: varchar("scheduledStartTime", { length: 5 }),
  scheduledEndTime: varchar("scheduledEndTime", { length: 5 }),
  actualStartTime: varchar("actualStartTime", { length: 5 }),
  actualEndTime: varchar("actualEndTime", { length: 5 }),
  workHours: decimal("workHours", { precision: 8, scale: 2 }).default("0.00").notNull(),
  status: mysqlEnum("status", ["present", "leave", "day_off", "absent", "late", "early_leave", "half_day", "emergency_overtime"]).default("present").notNull(),
  lateMinutes: int("lateMinutes").default(0).notNull(),
  earlyLeaveMinutes: int("earlyLeaveMinutes").default(0).notNull(),
  mealAllowance: decimal("mealAllowance", { precision: 12, scale: 2 }).default("0.00").notNull(),
  notes: text("notes"),
  createdByUserId: int("createdByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("attendance_employee_date_idx").on(table.employeeId, table.workDate), index("attendance_schedule_idx").on(table.scheduleId)]);

export type AttendanceRecord = typeof attendanceRecords.$inferSelect;

export const overtimeRecords = mysqlTable("overtime_records", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employeeId").notNull(),
  workDate: varchar("workDate", { length: 10 }).notNull(),
  startTime: varchar("startTime", { length: 5 }).notNull(),
  endTime: varchar("endTime", { length: 5 }).notNull(),
  hours: decimal("hours", { precision: 8, scale: 2 }).notNull(),
  multiplier: decimal("multiplier", { precision: 6, scale: 2 }).default("1.00").notNull(),
  calculatedAmount: decimal("calculatedAmount", { precision: 12, scale: 2 }).notNull(),
  manualAmount: decimal("manualAmount", { precision: 12, scale: 2 }),
  approvedByUserId: int("approvedByUserId"),
  approvedAt: timestamp("approvedAt"),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  notes: text("notes"),
  createdByUserId: int("createdByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("overtime_employee_date_idx").on(table.employeeId, table.workDate)]);

export type OvertimeRecord = typeof overtimeRecords.$inferSelect;

export const payrollBonuses = mysqlTable("payroll_bonuses", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employeeId").notNull(),
  payrollPeriodId: int("payrollPeriodId").notNull(),
  bonusDate: varchar("bonusDate", { length: 10 }).notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  notes: text("notes"),
  createdByUserId: int("createdByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("bonuses_employee_period_idx").on(table.employeeId, table.payrollPeriodId)]);

export const employeeAdvances = mysqlTable("employee_advances", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employeeId").notNull(),
  advanceDate: varchar("advanceDate", { length: 10 }).notNull(),
  originalAmount: decimal("originalAmount", { precision: 12, scale: 2 }).notNull(),
  notes: text("notes"),
  status: mysqlEnum("status", ["open", "settled"]).default("open").notNull(),
  createdByUserId: int("createdByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("advances_employee_status_idx").on(table.employeeId, table.status)]);

export const advanceRepayments = mysqlTable("advance_repayments", {
  id: int("id").autoincrement().primaryKey(),
  advanceId: int("advanceId").notNull(),
  payrollPeriodId: int("payrollPeriodId"),
  repaymentDate: varchar("repaymentDate", { length: 10 }).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  notes: text("notes"),
  createdByUserId: int("createdByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [index("advance_repayments_advance_idx").on(table.advanceId)]);

export const payrollDeductions = mysqlTable("payroll_deductions", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employeeId").notNull(),
  payrollPeriodId: int("payrollPeriodId").notNull(),
  deductionDate: varchar("deductionDate", { length: 10 }).notNull(),
  type: mysqlEnum("type", ["advance", "salary_advance", "labor_insurance", "health_insurance", "late", "early_leave", "absence", "other"]).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  notes: text("notes"),
  createdByUserId: int("createdByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("deductions_employee_period_idx").on(table.employeeId, table.payrollPeriodId)]);

/** 每位員工每個薪資月份一份不可直接覆寫的薪資快照。 */
export const payrollRuns = mysqlTable("payroll_runs", {
  id: int("id").autoincrement().primaryKey(),
  payrollPeriodId: int("payrollPeriodId").notNull(),
  employeeId: int("employeeId").notNull(),
  status: mysqlEnum("status", ["draft", "pending_review", "confirmed", "pending_payment", "paid"]).default("draft").notNull(),
  grossPay: decimal("grossPay", { precision: 12, scale: 2 }).default("0.00").notNull(),
  deductionTotal: decimal("deductionTotal", { precision: 12, scale: 2 }).default("0.00").notNull(),
  netPay: decimal("netPay", { precision: 12, scale: 2 }).default("0.00").notNull(),
  calculatedAt: timestamp("calculatedAt"),
  confirmedAt: timestamp("confirmedAt"),
  confirmedByUserId: int("confirmedByUserId"),
  lockedAt: timestamp("lockedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [unique("payroll_runs_period_employee_unique").on(table.payrollPeriodId, table.employeeId), index("payroll_runs_status_idx").on(table.status)]);

export type PayrollRun = typeof payrollRuns.$inferSelect;

export const payrollLineItems = mysqlTable("payroll_line_items", {
  id: int("id").autoincrement().primaryKey(),
  payrollRunId: int("payrollRunId").notNull(),
  category: mysqlEnum("category", ["base_salary", "daily_wage", "hourly_wage", "overtime", "meal", "supervisor_allowance", "driving_allowance", "transportation_allowance", "bonus", "perfect_attendance", "other_income", "advance", "labor_insurance", "health_insurance", "late", "early_leave", "absence", "other_deduction"]).notNull(),
  direction: mysqlEnum("direction", ["income", "deduction"]).notNull(),
  label: varchar("label", { length: 160 }).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  sourceType: varchar("sourceType", { length: 64 }),
  sourceId: int("sourceId"),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [index("payroll_line_items_run_idx").on(table.payrollRunId)]);

export const payrollPayments = mysqlTable("payroll_payments", {
  id: int("id").autoincrement().primaryKey(),
  payrollRunId: int("payrollRunId").notNull().unique(),
  employeeId: int("employeeId").notNull(),
  payrollPeriodId: int("payrollPeriodId").notNull(),
  netAmount: decimal("netAmount", { precision: 12, scale: 2 }).notNull(),
  paidAt: timestamp("paidAt"),
  paymentMethod: mysqlEnum("paymentMethod", ["pending", "transfer", "cash", "other"]).default("pending").notNull(),
  bankNameSnapshot: varchar("bankNameSnapshot", { length: 120 }),
  bankAccountMaskedSnapshot: varchar("bankAccountMaskedSnapshot", { length: 64 }),
  notes: text("notes"),
  status: mysqlEnum("status", ["pending", "transferred", "cash", "other"]).default("pending").notNull(),
  recordedByUserId: int("recordedByUserId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("payments_period_status_idx").on(table.payrollPeriodId, table.status)]);

/** 薪資、借支、獎金、扣款與發薪的變動均在此留下不可變更的稽核軌跡。 */
export const payrollAuditLogs = mysqlTable("payroll_audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  actorUserId: int("actorUserId").notNull(),
  entityType: varchar("entityType", { length: 64 }).notNull(),
  entityId: int("entityId").notNull(),
  action: varchar("action", { length: 64 }).notNull(),
  reason: text("reason"),
  beforeData: json("beforeData"),
  afterData: json("afterData"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [index("payroll_audit_entity_idx").on(table.entityType, table.entityId), index("payroll_audit_actor_idx").on(table.actorUserId)]);

export type PayrollAuditLog = typeof payrollAuditLogs.$inferSelect;

/** 請假資料以獨立資料表保留完整期間與審核狀態。 */
export const leaveRecords = mysqlTable("leave_records", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employeeId").notNull(),
  leaveType: varchar("leaveType", { length: 80 }).notNull(),
  startDate: varchar("startDate", { length: 10 }).notNull(),
  endDate: varchar("endDate", { length: 10 }).notNull(),
  hours: decimal("hours", { precision: 8, scale: 2 }).default("0.00").notNull(),
  status: mysqlEnum("status", ["pending", "approved", "rejected", "cancelled"]).default("pending").notNull(),
  reason: text("reason"),
  reviewedByUserId: int("reviewedByUserId"),
  createdByUserId: int("createdByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("leave_employee_dates_idx").on(table.employeeId, table.startDate, table.endDate), index("leave_status_idx").on(table.status)]);

/** 儀表板用的異常警示，保留處理者與處理時間，避免重要待辦遺失。 */
export const payrollAlerts = mysqlTable("payroll_alerts", {
  id: int("id").autoincrement().primaryKey(),
  type: varchar("type", { length: 80 }).notNull(),
  severity: mysqlEnum("severity", ["warning", "critical"]).default("warning").notNull(),
  employeeId: int("employeeId"),
  payrollPeriodId: int("payrollPeriodId"),
  message: varchar("message", { length: 500 }).notNull(),
  isResolved: boolean("isResolved").default(false).notNull(),
  resolvedByUserId: int("resolvedByUserId"),
  resolvedAt: timestamp("resolvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("payroll_alerts_active_idx").on(table.isResolved, table.severity), index("payroll_alerts_employee_idx").on(table.employeeId)]);
