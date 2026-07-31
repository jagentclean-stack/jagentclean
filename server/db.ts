import { eq, and, desc, asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, roles, permissions, pages, sections, menus, services, cases, blogs, categories, faqs, reviews, banners, media, contacts, bookings, settings, seo } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Role & Permission Management
 */
export async function getAllRoles() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(roles);
}

export async function getRolePermissions(roleId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(permissions).where(eq(permissions.roleId, roleId));
}

export async function createPermission(data: typeof permissions.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(permissions).values(data);
}

export async function updatePermission(permissionId: number, data: Partial<typeof permissions.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(permissions).set(data).where(eq(permissions.id, permissionId));
}

/**
 * Pages Management
 */
export async function getAllPages() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(pages).orderBy(desc(pages.updatedAt));
}

export async function getPageBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(pages).where(eq(pages.slug, slug)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createPage(data: typeof pages.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(pages).values(data);
}

export async function updatePage(pageId: number, data: Partial<typeof pages.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(pages).set(data).where(eq(pages.id, pageId));
}

export async function deletePage(pageId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(pages).where(eq(pages.id, pageId));
}

/**
 * Sections Management
 */
export async function getSectionsByPageId(pageId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(sections).where(eq(sections.pageId, pageId)).orderBy(asc(sections.order));
}

export async function createSection(data: typeof sections.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(sections).values(data);
}

export async function updateSection(sectionId: number, data: Partial<typeof sections.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(sections).set(data).where(eq(sections.id, sectionId));
}

export async function deleteSection(sectionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(sections).where(eq(sections.id, sectionId));
}

/**
 * Menus Management
 */
export async function getAllMenus() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(menus).where(eq(menus.parentId, null as any)).orderBy(asc(menus.order));
}

export async function getMenuChildren(parentId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(menus).where(eq(menus.parentId, parentId)).orderBy(asc(menus.order));
}

export async function createMenu(data: typeof menus.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(menus).values(data);
}

export async function updateMenu(menuId: number, data: Partial<typeof menus.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(menus).set(data).where(eq(menus.id, menuId));
}

export async function deleteMenu(menuId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(menus).where(eq(menus.id, menuId));
}

/**
 * Services Management
 */
export async function getAllServices() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(services).orderBy(asc(services.order));
}

export async function getServiceBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(services).where(eq(services.slug, slug)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createService(data: typeof services.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(services).values(data);
}

export async function updateService(serviceId: number, data: Partial<typeof services.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(services).set(data).where(eq(services.id, serviceId));
}

export async function deleteService(serviceId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(services).where(eq(services.id, serviceId));
}

/**
 * Cases Management
 */
export async function getAllCases() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(cases).orderBy(asc(cases.order));
}

export async function getCaseBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(cases).where(eq(cases.slug, slug)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createCase(data: typeof cases.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(cases).values(data);
}

export async function updateCase(caseId: number, data: Partial<typeof cases.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(cases).set(data).where(eq(cases.id, caseId));
}

export async function deleteCase(caseId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(cases).where(eq(cases.id, caseId));
}

/**
 * Blogs Management
 */
export async function getAllBlogs() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(blogs).orderBy(desc(blogs.publishedAt));
}

export async function getBlogBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(blogs).where(eq(blogs.slug, slug)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createBlog(data: typeof blogs.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(blogs).values(data);
}

export async function updateBlog(blogId: number, data: Partial<typeof blogs.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(blogs).set(data).where(eq(blogs.id, blogId));
}

export async function deleteBlog(blogId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(blogs).where(eq(blogs.id, blogId));
}

/**
 * Categories Management
 */
export async function getAllCategories() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(categories).orderBy(asc(categories.order));
}

export async function getCategoriesByType(type: "blog" | "case") {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(categories).where(eq(categories.type, type)).orderBy(asc(categories.order));
}

export async function createCategory(data: typeof categories.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(categories).values(data);
}

export async function updateCategory(categoryId: number, data: Partial<typeof categories.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(categories).set(data).where(eq(categories.id, categoryId));
}

export async function deleteCategory(categoryId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(categories).where(eq(categories.id, categoryId));
}

/**
 * FAQs Management
 */
export async function getAllFAQs() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(faqs).orderBy(asc(faqs.order));
}

export async function getFAQsByCategory(categoryId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(faqs).where(eq(faqs.categoryId, categoryId)).orderBy(asc(faqs.order));
}

export async function createFAQ(data: typeof faqs.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(faqs).values(data);
}

export async function updateFAQ(faqId: number, data: Partial<typeof faqs.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(faqs).set(data).where(eq(faqs.id, faqId));
}

export async function deleteFAQ(faqId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(faqs).where(eq(faqs.id, faqId));
}

/**
 * Reviews Management
 */
export async function getAllReviews() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(reviews).orderBy(desc(reviews.createdAt));
}

export async function getHomepageReviews() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(reviews).where(eq(reviews.isHomepageDisplay, true)).orderBy(desc(reviews.createdAt));
}

export async function createReview(data: typeof reviews.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(reviews).values(data);
}

export async function updateReview(reviewId: number, data: Partial<typeof reviews.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(reviews).set(data).where(eq(reviews.id, reviewId));
}

export async function deleteReview(reviewId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(reviews).where(eq(reviews.id, reviewId));
}

/**
 * Banners Management
 */
export async function getAllBanners() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(banners).orderBy(asc(banners.order));
}

export async function createBanner(data: typeof banners.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(banners).values(data);
}

export async function updateBanner(bannerId: number, data: Partial<typeof banners.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(banners).set(data).where(eq(banners.id, bannerId));
}

export async function deleteBanner(bannerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(banners).where(eq(banners.id, bannerId));
}

/**
 * Media Management
 */
export async function getAllMedia() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(media).orderBy(desc(media.createdAt));
}

export async function getMediaByCategory(category: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(media).where(eq(media.category, category)).orderBy(desc(media.createdAt));
}

export async function createMedia(data: typeof media.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(media).values(data);
}

export async function updateMedia(mediaId: number, data: Partial<typeof media.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(media).set(data).where(eq(media.id, mediaId));
}

export async function deleteMedia(mediaId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(media).where(eq(media.id, mediaId));
}

/**
 * Contacts Management
 */
export async function getAllContacts() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(contacts).orderBy(desc(contacts.createdAt));
}

export async function createContact(data: typeof contacts.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(contacts).values(data);
}

export async function updateContact(contactId: number, data: Partial<typeof contacts.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(contacts).set(data).where(eq(contacts.id, contactId));
}

/**
 * Bookings Management
 */
export async function getAllBookings() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bookings).orderBy(desc(bookings.createdAt));
}

export async function getBookingsByStatus(status: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bookings).where(eq(bookings.status, status as any)).orderBy(desc(bookings.createdAt));
}

export async function createBooking(data: typeof bookings.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(bookings).values(data);
}

export async function updateBooking(bookingId: number, data: Partial<typeof bookings.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(bookings).set(data).where(eq(bookings.id, bookingId));
}

/**
 * Settings Management
 */
export async function getSetting(key: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllSettings() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(settings);
}

export async function createSetting(data: typeof settings.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(settings).values(data);
}

export async function updateSetting(key: string, value: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(settings).set({ value }).where(eq(settings.key, key));
}

/**
 * SEO Management
 */
export async function getSEOBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(seo).where(eq(seo.slug, slug)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllSEO() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(seo).orderBy(desc(seo.updatedAt));
}

export async function createSEO(data: typeof seo.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(seo).values(data);
}

export async function updateSEO(seoId: number, data: Partial<typeof seo.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(seo).set(data).where(eq(seo.id, seoId));
}

export async function deleteSEO(seoId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(seo).where(eq(seo.id, seoId));
}
