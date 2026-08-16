import { z } from "zod";
import * as db from "./db";
import { createHash } from "crypto";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { hashCmsUserPassword } from "./adminAuth";
import { storageGetSignedUrl, storagePut } from "./storage";
import { decodeMediaUpload, mediaStorageFilename } from "./mediaUpload";
import { BOOKING_STATUSES } from "../shared/business";
import { cmsCopywritingInputSchema, generateCmsCopywritingDraft } from "./cmsCopywriting";
import { analyzeCmsMediaImage } from "./cmsMediaAnalysis";

// Type assertion helper for role checking
export type AllowedRoles = "super_admin" | "admin" | "manager" | "customer_service" | "marketing" | "editor" | "user";

// 管理員 email 白名單
const ADMIN_EMAILS = ["jagentclean@gmail.com", "emilyku0jj@gmail.com"];

const CMS_SETTING_KEYS = ["site_name", "site_description", "logo_url", "contact_image_url", "company_phone", "company_fax", "company_email", "line_id", "line_url", "company_address", "facebook_url", "instagram_url", "google_map_embed", "google_map_url", "ga_id", "meta_pixel_id", "copyright_text"] as const;
/** 僅能由伺服器端環境變數／秘密管理服務使用，絕不可進入 CMS 資料流。 */
export const CMS_SENSITIVE_SETTING_KEYS = [
  "smtp_password",
  "openai_api_key",
  "cloudflare_api_key",
  "cloudflare_api_token",
] as const;
export const cmsSettingKeySchema = z.enum(CMS_SETTING_KEYS);

export function filterCmsSettingsForClient<T extends { key: string }>(items: T[]) {
  return items.filter((item) => (
    CMS_SETTING_KEYS.includes(item.key as (typeof CMS_SETTING_KEYS)[number])
    && !CMS_SENSITIVE_SETTING_KEYS.includes(item.key as (typeof CMS_SENSITIVE_SETTING_KEYS)[number])
  ));
}

export function validateCmsSettingValue(key: z.infer<typeof cmsSettingKeySchema>, value: string) {
  if (["logo_url", "contact_image_url"].includes(key) && value && !(/^(?:\/manus-storage\/)[A-Za-z0-9._-]+$/.test(value) || z.string().url().safeParse(value).success)) throw new Error("圖片 URL 格式不正確");
  if (key === "company_phone" && value && !/^[0-9+()\-\s]{6,30}$/.test(value)) throw new Error("公司電話格式不正確");
  if (key === "company_email" && value && !z.string().email().safeParse(value).success) throw new Error("公司 Email 格式不正確");
  if (["line_url", "facebook_url", "instagram_url", "google_map_embed", "google_map_url"].includes(key) && value && !z.string().url().safeParse(value).success) throw new Error("連結格式不正確");
  if (key === "ga_id" && value && !/^G-[A-Z0-9]{4,32}$/i.test(value)) throw new Error("Google Analytics ID 格式不正確");
  if (key === "meta_pixel_id" && value && !/^\d{5,20}$/.test(value)) throw new Error("Meta Pixel ID 格式不正確");
}

/**
 * 舊版 CMS 同時在「網站設定」與「頁尾管理」提供公司聯絡與版權欄位。
 * 為避免兩份資料各自更新造成公開網站顯示不一致，這些重疊公開欄位以雙向同步
 * 維持相同值；資料庫結構及既有頁尾介紹／快速連結資料均不受影響。
 */
const FOOTER_SETTING_FIELD_MAP = {
  company_address: "address",
  company_phone: "phone",
  company_email: "email",
  copyright_text: "copyrightText",
} as const;

type FooterPublicFields = {
  address?: string;
  phone?: string;
  email?: string;
  copyrightText?: string;
};

async function syncFooterFromSiteSettings(settings: Partial<Record<z.infer<typeof cmsSettingKeySchema>, string>>) {
  const footerPatch: FooterPublicFields = {};
  for (const [settingKey, footerField] of Object.entries(FOOTER_SETTING_FIELD_MAP) as Array<[keyof typeof FOOTER_SETTING_FIELD_MAP, keyof FooterPublicFields]>) {
    if (Object.prototype.hasOwnProperty.call(settings, settingKey)) footerPatch[footerField] = settings[settingKey];
  }
  if (Object.keys(footerPatch).length === 0) return;

  const existingFooter = await db.getFooter();
  if (existingFooter) await db.updateFooter(existingFooter.id, footerPatch);
}

async function syncSiteSettingsFromFooter(footerFields: FooterPublicFields) {
  const settingUpdates = Object.entries(FOOTER_SETTING_FIELD_MAP)
    .map(([settingKey, footerField]) => [settingKey, footerFields[footerField as keyof FooterPublicFields]] as const)
    .filter((entry): entry is readonly [string, string] => entry[1] !== undefined);
  await Promise.all(settingUpdates.map(([key, value]) => db.updateSetting(key, value)));
}

export const CMS_ROLE_ALIASES = {
  manager: "admin",
} as const;

/**
 * CMS 的唯一功能權限來源。super_admin 與指定的最高權限 Email 由
 * `canAccessCmsPermission` 統一繼承所有權限，不需要重複列入每個項目。
 */
export const CMS_PERMISSIONS = {
  DASHBOARD_READ: ["admin"],
  PAGES_READ: ["admin", "editor"],
  PAGES_CREATE: ["admin"],
  PAGES_UPDATE: ["admin", "editor"],
  PAGES_DELETE: ["admin"],
  SERVICES_READ: ["admin", "editor"],
  SERVICES_CREATE: ["admin"],
  SERVICES_UPDATE: ["admin", "editor"],
  SERVICES_DELETE: ["admin"],
  BOOKINGS_MANAGE: ["admin", "customer_service"],
  CONTACTS_READ: ["admin", "customer_service"],
  CONTACTS_UPDATE: ["admin", "customer_service"],
  MEDIA_MANAGE: ["admin", "editor"],
  MEDIA_DELETE: ["admin"],
  SETTINGS_MANAGE: ["admin"],
  CASES_MANAGE: ["admin", "editor"],
  CASES_DELETE: ["admin"],
  BLOGS_MANAGE: ["admin", "editor", "marketing"],
  BLOGS_DELETE: ["admin"],
  CATEGORIES_MANAGE: ["admin", "editor", "marketing"],
  CATEGORIES_DELETE: ["admin"],
  FAQS_MANAGE: ["admin", "editor"],
  FAQS_DELETE: ["admin"],
  MENUS_MANAGE: ["admin"],
  SEO_MANAGE: ["admin", "editor"],
  USERS_MANAGE: ["admin"],
  HERO_MANAGE: ["admin", "editor"],
  HERO_DELETE: ["admin"],
  FOOTER_MANAGE: ["admin", "editor"],
  FOOTER_DELETE: ["admin"],
  REVIEWS_MANAGE: ["admin", "marketing"],
  REVIEWS_DELETE: ["admin"],
  AI_COPY_GENERATE: ["admin", "marketing"],
  MEDIA_AI_ANALYZE: ["admin", "editor"],
} as const satisfies Record<string, readonly AllowedRoles[]>;

export type CmsPermission = keyof typeof CMS_PERMISSIONS;

const cmsRolePermissionOverrideCache = new Map<string, boolean>();
const permissionOverrideCacheKey = (role: string, permission: CmsPermission) => `${role}:${permission}`;

/**
 * 自訂角色權限儲存在資料庫；快取載入失敗時刻意回退中央預設矩陣，避免因暫時
 * 資料庫問題而意外提高任何帳號的存取權限。更新設定後會立即刷新目前執行個體。
 */
export async function refreshCmsRolePermissionOverrideCache() {
  const overrides = await db.getAllCmsRolePermissionOverrides();
  applyCmsRolePermissionOverrides(overrides);
}

export function applyCmsRolePermissionOverrides(overrides: Array<{ role: string; permission: string; isAllowed: boolean }>) {
  cmsRolePermissionOverrideCache.clear();
  for (const override of overrides) {
    if (Object.prototype.hasOwnProperty.call(CMS_PERMISSIONS, override.permission)) {
      cmsRolePermissionOverrideCache.set(
        permissionOverrideCacheKey(override.role, override.permission as CmsPermission),
        override.isAllowed,
      );
    }
  }
}

void refreshCmsRolePermissionOverrideCache().catch((error) => {
  console.warn("[CMS RBAC] 無法載入自訂角色權限，已安全回退至預設權限矩陣。", error);
});

export const resolveCmsPermission = (roles: readonly AllowedRoles[]): CmsPermission | undefined => {
  const normalizedRoles = Array.from(new Set(
    roles
      .filter((role) => role !== "super_admin")
      .map((role) => normalizeCmsRole(role))
      .filter((role): role is AllowedRoles => Boolean(role)),
  )).sort();
  return (Object.keys(CMS_PERMISSIONS) as CmsPermission[]).find((permission) => {
    const permissionRoles = [...CMS_PERMISSIONS[permission]].sort();
    return permissionRoles.length === normalizedRoles.length
      && permissionRoles.every((role, index) => role === normalizedRoles[index]);
  });
};

export const normalizeCmsRole = (role: string | undefined | null): AllowedRoles | undefined => {
  if (!role) return undefined;
  return (CMS_ROLE_ALIASES[role as keyof typeof CMS_ROLE_ALIASES] ?? role) as AllowedRoles;
};

export const canAccessCmsPermission = (
  userRole: string | undefined | null,
  userEmail: string | undefined | null,
  permission: CmsPermission,
): boolean => {
  const normalizedRole = normalizeCmsRole(userRole);
  // Email 白名單及 Super Admin 為跨功能繼承規則，避免各個路由發生遺漏。
  if (userEmail && ADMIN_EMAILS.includes(userEmail)) {
    return true;
  }
  if (normalizedRole === "super_admin") return true;
  const explicitOverride = userRole
    ? cmsRolePermissionOverrideCache.get(permissionOverrideCacheKey(userRole, permission))
    : undefined;
  const normalizedOverride = normalizedRole
    ? cmsRolePermissionOverrideCache.get(permissionOverrideCacheKey(normalizedRole, permission))
    : undefined;
  if (explicitOverride !== undefined) return explicitOverride;
  if (normalizedOverride !== undefined) return normalizedOverride;
  return CMS_PERMISSIONS[permission].includes(normalizedRole as never);
};

/**
 * 舊路由在遷移期間的相容層。所有既有角色組合會先對應至權限矩陣；新路由
 * 必須直接使用 canAccessCmsPermission，避免日後新增功能時重複撰寫角色判斷。
 */
const checkRole = (
  userRole: string | undefined | null,
  userEmailOrFirstRole: string | undefined | null,
  ...allowedRoles: AllowedRoles[]
): boolean => {
  const userEmail = userEmailOrFirstRole?.includes("@") ? userEmailOrFirstRole : null;
  const legacyRoles = userEmail ? allowedRoles : [userEmailOrFirstRole as AllowedRoles, ...allowedRoles];
  const matchingPermission = resolveCmsPermission(legacyRoles);
  if (matchingPermission) return canAccessCmsPermission(userRole, userEmail, matchingPermission);
  const normalizedRole = normalizeCmsRole(userRole);
  if (userEmail && ADMIN_EMAILS.includes(userEmail)) return true;
  if (normalizedRole === "super_admin") return true;
  const normalizedLegacyRoles = legacyRoles
    .filter((role): role is AllowedRoles => Boolean(role) && role !== "super_admin")
    .map((role) => normalizeCmsRole(role));
  return normalizedLegacyRoles.includes(normalizedRole as AllowedRoles);
};

const priceValueSchema = z.string().trim().regex(/^$|^\d+(?:\.\d{1,2})?$/, "價格僅能輸入最多兩位小數的非負數").optional();
const cmsUserRoleSchema = z.enum(["super_admin", "admin", "manager", "customer_service", "marketing", "editor", "user"]);

export function onlyPublishedServices<T extends { isPublished: boolean | null }>(records: T[]) {
  return records.filter((service) => service.isPublished === true);
}

export function onlyPublishedServicesWithVisibleFAQs<
  T extends { isPublished: boolean | null; faqs?: Array<{ isVisible?: boolean | null }> },
>(records: T[]) {
  return onlyPublishedServices(records).map((service) => ({
    ...service,
    faqs: (service.faqs ?? []).filter((faq) => faq.isVisible === true),
  }));
}
const isHighestAdmin = (email: string | null | undefined) => Boolean(email && ADMIN_EMAILS.includes(email));

async function resolveMediaImageUrlForAnalysis(storedUrl: string) {
  const storagePrefix = "/manus-storage/";
  if (storedUrl.startsWith(storagePrefix)) {
    const storageKey = storedUrl.slice(storagePrefix.length);
    if (!storageKey || storageKey.includes("..")) throw new Error("媒體儲存位置無效，無法進行分析");
    return storageGetSignedUrl(storageKey);
  }

  const externalUrl = new URL(storedUrl);
  if (externalUrl.protocol !== "https:") throw new Error("僅支援安全 HTTPS 圖片網址進行分析");
  return externalUrl.toString();
}

async function assertValidFAQServiceLink(serviceId: number | null | undefined) {
  if (serviceId === undefined || serviceId === null) return;
  if (!(await db.getServiceById(serviceId))) throw new Error("指定的服務不存在");
}

async function assertValidFAQCategoryLink(categoryId: number | null | undefined) {
  if (categoryId === undefined || categoryId === null) return;
  const category = await db.getCategoryById(categoryId);
  if (!category || category.type !== "faq") throw new Error("指定的 FAQ 分類不存在");
}

/**
 * CMS Dashboard Router
 * 處理所有後台管理功能
 */
export const cmsRouter = router({
  aiCopy: router({
    generate: protectedProcedure
      .input(cmsCopywritingInputSchema)
      .mutation(async ({ ctx, input }) => {
        if (!canAccessCmsPermission(ctx.user?.role, ctx.user?.email, "AI_COPY_GENERATE")) {
          throw new Error("您沒有 AI 文案草稿功能的使用權限");
        }
        return generateCmsCopywritingDraft(input);
      }),
  }),
  /** 前台可安全讀取的已發布內容，不含草稿或內部資料。 */
  publicContent: router({
    homepage: publicProcedure.query(async () => {
      const [heroes, services, faqs, reviews, footerContent] = await Promise.all([
        db.getPublishedHeroes(),
        db.getPublishedServices(),
        db.getVisibleFAQs(),
        db.getPublishedHomepageReviews(),
        db.getPublishedFooter(),
      ]);

      return {
        hero: heroes[0] ?? null,
        services,
        faqs,
        reviews,
        footer: footerContent,
      };
    }),
    services: publicProcedure.query(async () => onlyPublishedServicesWithVisibleFAQs(await db.getPublishedServicesWithFAQs())),
    cases: publicProcedure.query(() => db.getPublishedCases()),
    blogs: publicProcedure.query(() => db.getPublishedBlogs()),
    faqs: publicProcedure.query(() => db.getVisibleFAQs()),
    footer: publicProcedure.query(() => db.getPublishedFooter()),
    menus: publicProcedure.query(() => db.getPublicMenuTree()),
    siteSettings: publicProcedure.query(async () => {
      const settings = filterCmsSettingsForClient(await db.getSettingsByKeys([
        "site_name", "site_description", "logo_url", "contact_image_url", "company_phone", "company_fax", "company_email",
        "line_id", "line_url", "company_address", "facebook_url", "instagram_url", "google_map_embed",
        "google_map_url", "copyright_text",
      ]));
      const values = Object.fromEntries(settings.map((setting) => [setting.key, setting.value || ""]));
      return {
        siteName: values.site_name || "",
        siteDescription: values.site_description || "",
        logoUrl: values.logo_url || null,
        contactImageUrl: values.contact_image_url || null,
        companyPhone: values.company_phone || "",
        companyFax: values.company_fax || "",
        companyEmail: values.company_email || "",
        lineId: values.line_id || "",
        lineUrl: values.line_url || "",
        companyAddress: values.company_address || "",
        facebookUrl: values.facebook_url || "",
        instagramUrl: values.instagram_url || "",
        googleMapEmbed: values.google_map_embed || "",
        googleMapUrl: values.google_map_url || "",
        copyrightText: values.copyright_text || "",
      };
    }),
    seo: publicProcedure
      .input(z.object({ slug: z.string().trim().min(1).max(255) }))
      .query(({ input }) => db.getSEOBySlug(input.slug)),
  }),

  /**
   * Dashboard 統計資訊
   */
  dashboard: protectedProcedure.query(async ({ ctx }) => {
    // 只允許管理員存取
    if (!canAccessCmsPermission(ctx.user?.role, ctx.user?.email, "DASHBOARD_READ")) {
      throw new Error("Unauthorized");
    }

    const [
      totalServices,
      totalCases,
      totalBlogs,
      totalBookings,
      totalContacts,
      totalReviews,
    ] = await Promise.all([
      db.getAllServices(),
      db.getAllCases(),
      db.getAllBlogs(),
      db.getAllBookings(),
      db.getAllContacts(),
      db.getAllReviews(),
    ]);

    return {
      totalServices: totalServices.length,
      totalCases: totalCases.length,
      totalBlogs: totalBlogs.length,
      totalBookings: totalBookings.length,
      totalContacts: totalContacts.length,
      totalReviews: totalReviews.length,
    };
  }),

  /**
   * Pages Management
   */
  pages: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      if (!canAccessCmsPermission(ctx.user?.role, ctx.user?.email, "PAGES_READ")) {
        throw new Error("Unauthorized");
      }
      return db.getAllPages();
    }),

    getBySlug: protectedProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input, ctx }) => {
        if (!canAccessCmsPermission(ctx.user?.role, ctx.user?.email, "PAGES_READ")) {
          throw new Error("Unauthorized");
        }
        return db.getPageBySlug(input.slug);
      }),

    create: protectedProcedure
      .input(
        z.object({
          slug: z.string(),
          title: z.string(),
          content: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!canAccessCmsPermission(ctx.user?.role, ctx.user?.email, "PAGES_CREATE")) {
          throw new Error("Unauthorized");
        }
        return db.createPage({
          ...input,
          createdBy: ctx.user?.id,
        });
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          slug: z.string().optional(),
          title: z.string().optional(),
          content: z.string().optional(),
          isPublished: z.boolean().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!canAccessCmsPermission(ctx.user?.role, ctx.user?.email, "PAGES_UPDATE")) {
          throw new Error("Unauthorized");
        }
        const { id, ...data } = input;
        return db.updatePage(id, data);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!canAccessCmsPermission(ctx.user?.role, ctx.user?.email, "PAGES_DELETE")) {
          throw new Error("Unauthorized");
        }
        return db.deletePage(input.id);
      }),
  }),

  /**
   * Services Management
   */
  services: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      if (!canAccessCmsPermission(ctx.user?.role, ctx.user?.email, "SERVICES_READ")) {
        throw new Error("Unauthorized");
      }
      return db.getAllServices();
    }),

    getBySlug: protectedProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input, ctx }) => {
        if (!canAccessCmsPermission(ctx.user?.role, ctx.user?.email, "SERVICES_READ")) {
          throw new Error("Unauthorized");
        }
        return db.getServiceBySlug(input.slug);
      }),

    create: protectedProcedure
      .input(
        z.object({
          name: z.string(),
          slug: z.string(),
          description: z.string().optional(),
          icon: z.string().optional(),
          bannerImage: z.string().optional(),
          process: z.string().optional(),
          faq: z.string().trim().max(5000).optional(),
          video: z.string().optional(),
          basePrice: priceValueSchema,
          pricePerUnit: priceValueSchema,
          unit: z.string().optional(),
          promotion: z.string().trim().max(255).optional(),
          priceNote: z.string().trim().max(1000).optional(),
          isPublished: z.boolean().optional(),
          seoTitle: z.string().trim().max(255).optional(),
          seoDescription: z.string().trim().max(500).optional(),
          seoKeywords: z.string().trim().max(500).optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!canAccessCmsPermission(ctx.user?.role, ctx.user?.email, "SERVICES_CREATE")) {
          throw new Error("Unauthorized");
        }
        return db.createService(input as any);
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          slug: z.string().optional(),
          description: z.string().optional(),
          icon: z.string().optional(),
          bannerImage: z.string().optional(),
          process: z.string().optional(),
          faq: z.string().trim().max(5000).optional(),
          video: z.string().optional(),
          basePrice: priceValueSchema,
          pricePerUnit: priceValueSchema,
          unit: z.string().optional(),
          promotion: z.string().trim().max(255).optional(),
          priceNote: z.string().trim().max(1000).optional(),
          isPublished: z.boolean().optional(),
          seoTitle: z.string().trim().max(255).optional(),
          seoDescription: z.string().trim().max(500).optional(),
          seoKeywords: z.string().trim().max(500).optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!canAccessCmsPermission(ctx.user?.role, ctx.user?.email, "SERVICES_UPDATE")) {
          throw new Error("Unauthorized");
        }
        const { id, ...data } = input;
        if (data.basePrice === "") data.basePrice = null as any;
        if (data.pricePerUnit === "") data.pricePerUnit = null as any;
        return db.updateService(id, data as any);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!canAccessCmsPermission(ctx.user?.role, ctx.user?.email, "SERVICES_DELETE")) {
          throw new Error("Unauthorized");
        }
        return db.deleteService(input.id);
      }),
  }),

  /**
   * Bookings Management
   */
  bookings: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      if (!canAccessCmsPermission(ctx.user?.role, ctx.user?.email, "BOOKINGS_MANAGE")) {
        throw new Error("Unauthorized");
      }
      return db.getAllBookings();
    }),

    getByStatus: protectedProcedure
      .input(z.object({ status: z.enum(BOOKING_STATUSES) }))
      .query(async ({ input, ctx }) => {
        if (!canAccessCmsPermission(ctx.user?.role, ctx.user?.email, "BOOKINGS_MANAGE")) {
          throw new Error("Unauthorized");
        }
        return db.getBookingsByStatus(input.status);
      }),

    create: protectedProcedure
      .input(
        z.object({
          name: z.string(),
          phone: z.string(),
          email: z.string().email().optional(),
          line: z.string().optional(),
          address: z.string().optional(),
          serviceId: z.number().optional(),
          requirements: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!canAccessCmsPermission(ctx.user?.role, ctx.user?.email, "BOOKINGS_MANAGE")) {
          throw new Error("Unauthorized");
        }
        return db.createBooking({
          ...input,
          status: "pending",
        });
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum(BOOKING_STATUSES).optional(),
          name: z.string().optional(),
          phone: z.string().optional(),
          email: z.string().optional(),
          address: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!canAccessCmsPermission(ctx.user?.role, ctx.user?.email, "BOOKINGS_MANAGE")) {
          throw new Error("Unauthorized");
        }
        const { id, ...data } = input;
        return db.updateBooking(id, data);
      }),
  }),

  /**
   * Contacts Management
   */
  contacts: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      if (!canAccessCmsPermission(ctx.user?.role, ctx.user?.email, "CONTACTS_READ")) {
        throw new Error("Unauthorized");
      }
      return db.getAllContacts();
    }),

    markAsRead: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!canAccessCmsPermission(ctx.user?.role, ctx.user?.email, "CONTACTS_UPDATE")) {
          throw new Error("Unauthorized");
        }
        return db.updateContact(input.id, { isRead: true });
      }),
  }),

  /**
   * Media Management
   */
  media: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      if (!canAccessCmsPermission(ctx.user?.role, ctx.user?.email, "MEDIA_MANAGE")) {
        throw new Error("Unauthorized");
      }
      return db.getAllMedia();
    }),

    getByCategory: protectedProcedure
      .input(z.object({ category: z.string() }))
      .query(async ({ input, ctx }) => {
        if (!canAccessCmsPermission(ctx.user?.role, ctx.user?.email, "MEDIA_MANAGE")) {
          throw new Error("Unauthorized");
        }
        return db.getMediaByCategory(input.category);
      }),

    analyzeImage: protectedProcedure
      .input(z.object({ mediaId: z.number().int().positive() }))
      .mutation(async ({ input, ctx }) => {
        if (!canAccessCmsPermission(ctx.user?.role, ctx.user?.email, "MEDIA_AI_ANALYZE")) {
          throw new Error("您沒有 AI 圖片分析功能的使用權限");
        }
        const record = await db.getMediaById(input.mediaId);
        if (!record) throw new Error("找不到指定媒體檔案");
        if (record.type !== "image") throw new Error("僅能分析圖片格式的媒體檔案");

        const imageUrl = await resolveMediaImageUrlForAnalysis(record.url);
        return analyzeCmsMediaImage({
          imageUrl,
          filename: record.filename,
          mimeType: record.mimeType,
        });
      }),

    create: protectedProcedure
      .input(
        z.object({
          filename: z.string(),
          url: z.string(),
          type: z.enum(["image", "video"]),
          category: z.string().optional(),
          alt: z.string().optional(),
          tags: z.array(z.string()).optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!canAccessCmsPermission(ctx.user?.role, ctx.user?.email, "MEDIA_MANAGE")) {
          throw new Error("Unauthorized");
        }
        return db.createMedia({
          ...input,
          uploadedBy: ctx.user?.id,
        });
      }),

    upload: protectedProcedure
      .input(
        z.object({
          filename: z.string().trim().min(1).max(255),
          dataUrl: z.string().min(1).max(29_000_000),
          mimeType: z.string().trim().min(1).max(64),
          category: z.string().trim().max(255).optional(),
          alt: z.string().trim().max(500).optional(),
          tags: z.array(z.string().trim().min(1).max(100)).max(20).optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!canAccessCmsPermission(ctx.user?.role, ctx.user?.email, "MEDIA_MANAGE")) {
          throw new Error("Unauthorized");
        }

        const uploaded = decodeMediaUpload(input.dataUrl, input.mimeType);
        const filename = mediaStorageFilename(input.filename, uploaded.mimeType);
        const storagePath = `cms-media/${ctx.user?.id ?? "system"}/${Date.now()}-${filename}`;
        const { url } = await storagePut(storagePath, uploaded.bytes, uploaded.mimeType);

        await db.createMedia({
          filename,
          url,
          type: uploaded.type,
          mimeType: uploaded.mimeType,
          size: uploaded.bytes.length,
          category: input.category || null,
          alt: input.alt || null,
          tags: input.tags ?? null,
          uploadedBy: ctx.user?.id,
        });

        return { url, filename, type: uploaded.type, mimeType: uploaded.mimeType, size: uploaded.bytes.length };
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number().int().positive(),
          filename: z.string().trim().min(1).max(255).optional(),
          category: z.string().trim().max(255).nullable().optional(),
          alt: z.string().trim().max(500).nullable().optional(),
          tags: z.array(z.string().trim().min(1).max(100)).max(20).nullable().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!canAccessCmsPermission(ctx.user?.role, ctx.user?.email, "MEDIA_MANAGE")) {
          throw new Error("Unauthorized");
        }
        const { id, ...data } = input;
        return db.updateMedia(id, data);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!canAccessCmsPermission(ctx.user?.role, ctx.user?.email, "MEDIA_DELETE")) {
          throw new Error("Unauthorized");
        }
        return db.deleteMedia(input.id);
      }),
  }),

  /**
   * Settings Management
   */
  settings: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      if (!canAccessCmsPermission(ctx.user?.role, ctx.user?.email, "SETTINGS_MANAGE")) {
        throw new Error("Unauthorized");
      }
      return filterCmsSettingsForClient(await db.getSettingsByKeys(CMS_SETTING_KEYS));
    }),

    get: protectedProcedure
      .input(z.object({ key: cmsSettingKeySchema }))
      .query(async ({ input, ctx }) => {
        if (!canAccessCmsPermission(ctx.user?.role, ctx.user?.email, "SETTINGS_MANAGE")) {
          throw new Error("Unauthorized");
        }
        return db.getSetting(input.key);
      }),

    update: protectedProcedure
      .input(z.object({ key: cmsSettingKeySchema, value: z.string().max(10_000) }))
      .mutation(async ({ input, ctx }) => {
        if (!canAccessCmsPermission(ctx.user?.role, ctx.user?.email, "SETTINGS_MANAGE")) {
          throw new Error("Unauthorized");
        }
        validateCmsSettingValue(input.key, input.value);
        const result = await db.updateSetting(input.key, input.value);
        await syncFooterFromSiteSettings({ [input.key]: input.value });
        return result;
      }),
    updateBatch: protectedProcedure
      .input(z.object({ settings: z.record(cmsSettingKeySchema, z.string().max(10_000)) }))
      .mutation(async ({ input, ctx }) => {
        if (!canAccessCmsPermission(ctx.user?.role, ctx.user?.email, "SETTINGS_MANAGE")) {
          throw new Error("Unauthorized");
        }
        Object.entries(input.settings).forEach(([key, value]) => validateCmsSettingValue(key as z.infer<typeof cmsSettingKeySchema>, value));
        await Promise.all(Object.entries(input.settings).map(([key, value]) => db.updateSetting(key, value)));
        await syncFooterFromSiteSettings(input.settings);
        return { success: true, updatedKeys: Object.keys(input.settings) };
      }),
  }),

  /**
   * Cases Management
   */
  cases: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      if (!canAccessCmsPermission(ctx.user?.role, ctx.user?.email, "CASES_MANAGE")) {
        throw new Error("Unauthorized");
      }
      return db.getAllCases();
    }),

    getBySlug: protectedProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input, ctx }) => {
        if (!canAccessCmsPermission(ctx.user?.role, ctx.user?.email, "CASES_MANAGE")) {
          throw new Error("Unauthorized");
        }
        return db.getCaseBySlug(input.slug);
      }),

    create: protectedProcedure
      .input(
        z.object({
          title: z.string().trim().min(1, "案例標題必填").max(255),
          slug: z.string().trim().min(1, "URL Slug 必填").max(255),
          address: z.string().trim().max(500).optional(),
          serviceId: z.number().int().positive().nullable().optional(),
          constructionDate: z.coerce.date().nullable().optional(),
          constructionTime: z.string().trim().max(255).optional(),
          beforeImages: z.array(z.string().trim().min(1).max(500)).max(20).optional(),
          afterImages: z.array(z.string().trim().min(1).max(500)).max(20).optional(),
          video: z.string().trim().max(500).optional(),
          testimonial: z.string().trim().max(10_000).optional(),
          googleReview: z.string().trim().max(500).optional(),
          tags: z.array(z.string().trim().min(1).max(100)).max(30).optional(),
          categoryId: z.number().int().positive().nullable().optional(),
          order: z.number().int().min(0).max(100_000).optional(),
          isPublished: z.boolean().default(true),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!canAccessCmsPermission(ctx.user?.role, ctx.user?.email, "CASES_MANAGE")) {
          throw new Error("Unauthorized");
        }
        return db.createCase(input as any);
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          title: z.string().trim().min(1).max(255).optional(),
          slug: z.string().trim().min(1).max(255).optional(),
          address: z.string().trim().max(500).optional(),
          serviceId: z.number().int().positive().nullable().optional(),
          constructionDate: z.coerce.date().nullable().optional(),
          constructionTime: z.string().trim().max(255).optional(),
          beforeImages: z.array(z.string().trim().min(1).max(500)).max(20).optional(),
          afterImages: z.array(z.string().trim().min(1).max(500)).max(20).optional(),
          video: z.string().trim().max(500).optional(),
          testimonial: z.string().trim().max(10_000).optional(),
          googleReview: z.string().trim().max(500).optional(),
          tags: z.array(z.string().trim().min(1).max(100)).max(30).optional(),
          categoryId: z.number().int().positive().nullable().optional(),
          order: z.number().int().min(0).max(100_000).optional(),
          isPublished: z.boolean().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!canAccessCmsPermission(ctx.user?.role, ctx.user?.email, "CASES_MANAGE")) {
          throw new Error("Unauthorized");
        }
        const { id, ...data } = input;
        return db.updateCase(id, data as any);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!canAccessCmsPermission(ctx.user?.role, ctx.user?.email, "CASES_DELETE")) {
          throw new Error("Unauthorized");
        }
        return db.deleteCase(input.id);
      }),
  }),

  /**
   * Blogs Management
   */
  blogs: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      if (!canAccessCmsPermission(ctx.user?.role, ctx.user?.email, "BLOGS_MANAGE")) {
        throw new Error("Unauthorized");
      }
      return db.getAllBlogs();
    }),

    getBySlug: protectedProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input, ctx }) => {
        if (!canAccessCmsPermission(ctx.user?.role, ctx.user?.email, "BLOGS_MANAGE")) {
          throw new Error("Unauthorized");
        }
        return db.getBlogBySlug(input.slug);
      }),

    create: protectedProcedure
      .input(
        z.object({
          title: z.string().trim().min(1, "文章標題必填").max(255),
          slug: z.string().trim().min(1, "URL Slug 必填").max(255),
          excerpt: z.string().trim().max(500).optional(),
          content: z.string().max(100_000).optional(),
          featuredImage: z.string().trim().max(500).nullable().optional(),
          categoryId: z.number().int().positive().nullable().optional(),
          isPublished: z.boolean().default(false),
          publishedAt: z.coerce.date().nullable().optional(),
          scheduledAt: z.coerce.date().nullable().optional(),
          seoTitle: z.string().trim().max(255).nullable().optional(),
          seoDescription: z.string().trim().max(500).nullable().optional(),
          seoKeywords: z.string().trim().max(500).nullable().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!canAccessCmsPermission(ctx.user?.role, ctx.user?.email, "BLOGS_MANAGE")) {
          throw new Error("Unauthorized");
        }
        return db.createBlog({
          ...input,
          authorId: ctx.user?.id,
          publishedAt: input.publishedAt ?? (input.isPublished ? new Date() : null),
        } as any);
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          title: z.string().trim().min(1).max(255).optional(),
          slug: z.string().trim().min(1).max(255).optional(),
          excerpt: z.string().trim().max(500).nullable().optional(),
          content: z.string().max(100_000).nullable().optional(),
          featuredImage: z.string().trim().max(500).nullable().optional(),
          categoryId: z.number().int().positive().nullable().optional(),
          isPublished: z.boolean().optional(),
          publishedAt: z.coerce.date().nullable().optional(),
          scheduledAt: z.coerce.date().nullable().optional(),
          seoTitle: z.string().trim().max(255).nullable().optional(),
          seoDescription: z.string().trim().max(500).nullable().optional(),
          seoKeywords: z.string().trim().max(500).nullable().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!canAccessCmsPermission(ctx.user?.role, ctx.user?.email, "BLOGS_MANAGE")) {
          throw new Error("Unauthorized");
        }
        const { id, ...data } = input;
        return db.updateBlog(id, {
          ...data,
          publishedAt: data.publishedAt ?? (data.isPublished ? new Date() : undefined),
        } as any);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!canAccessCmsPermission(ctx.user?.role, ctx.user?.email, "BLOGS_DELETE")) {
          throw new Error("Unauthorized");
        }
        return db.deleteBlog(input.id);
      }),
  }),

  /** 可供內容管理表單使用的分類清單。 */
  categories: router({
    list: protectedProcedure
      .input(z.object({ type: z.enum(["blog", "case", "faq"]).optional() }).optional())
      .query(async ({ input, ctx }) => {
        if (!canAccessCmsPermission(ctx.user?.role, ctx.user?.email, "CATEGORIES_MANAGE")) {
          throw new Error("Unauthorized");
        }
        return input?.type ? db.getCategoriesByType(input.type) : db.getAllCategories();
      }),
    create: protectedProcedure
      .input(z.object({
        name: z.string().trim().min(1, "分類名稱必填").max(255),
        slug: z.string().trim().min(1, "分類 Slug 必填").max(255),
        description: z.string().trim().max(2_000).nullable().optional(),
        type: z.enum(["blog", "case", "faq"]),
        order: z.number().int().min(0).max(100_000).default(0),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!canAccessCmsPermission(ctx.user?.role, ctx.user?.email, "CATEGORIES_MANAGE")) {
          throw new Error("Unauthorized");
        }
        return db.createCategory(input as any);
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number().int().positive(),
        name: z.string().trim().min(1).max(255).optional(),
        slug: z.string().trim().min(1).max(255).optional(),
        description: z.string().trim().max(2_000).nullable().optional(),
        order: z.number().int().min(0).max(100_000).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!canAccessCmsPermission(ctx.user?.role, ctx.user?.email, "CATEGORIES_MANAGE")) {
          throw new Error("Unauthorized");
        }
        const { id, ...data } = input;
        return db.updateCategory(id, data as any);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ input, ctx }) => {
        if (!canAccessCmsPermission(ctx.user?.role, ctx.user?.email, "CATEGORIES_DELETE")) {
          throw new Error("Unauthorized");
        }
        return db.deleteCategory(input.id);
      }),
  }),

  /**
   * FAQs Management
   */
  faqs: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      if (!canAccessCmsPermission(ctx.user?.role, ctx.user?.email, "FAQS_MANAGE")) {
        throw new Error("Unauthorized");
      }
      return db.getAllFAQs();
    }),

    create: protectedProcedure
      .input(
        z.object({
          question: z.string(),
          answer: z.string(),
          categoryId: z.number().int().positive().nullable().optional(),
          serviceId: z.number().int().positive().nullable().optional(),
          order: z.number().default(0),
          isVisible: z.boolean().default(true),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!canAccessCmsPermission(ctx.user?.role, ctx.user?.email, "FAQS_MANAGE")) {
          throw new Error("Unauthorized");
        }
        await assertValidFAQServiceLink(input.serviceId);
        await assertValidFAQCategoryLink(input.categoryId);
        return db.createFAQ(input as any);
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          question: z.string().optional(),
          answer: z.string().optional(),
          categoryId: z.number().int().positive().nullable().optional(),
          serviceId: z.number().int().positive().nullable().optional(),
          order: z.number().optional(),
          isVisible: z.boolean().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!canAccessCmsPermission(ctx.user?.role, ctx.user?.email, "FAQS_MANAGE")) {
          throw new Error("Unauthorized");
        }
        const { id, ...data } = input;
        await assertValidFAQServiceLink(data.serviceId);
        await assertValidFAQCategoryLink(data.categoryId);
        return db.updateFAQ(id, data as any);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!canAccessCmsPermission(ctx.user?.role, ctx.user?.email, "FAQS_DELETE")) {
          throw new Error("Unauthorized");
        }
        return db.deleteFAQ(input.id);
      }),
  }),

  /**
   * Menus Management
   */
  menus: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      if (!canAccessCmsPermission(ctx.user?.role, ctx.user?.email, "MENUS_MANAGE")) {
        throw new Error("Unauthorized");
      }
      return db.getAllMenus();
    }),

    create: protectedProcedure
      .input(
        z.object({
          label: z.string().min(1, "菜單標籤必填"),
          url: z.string().min(1, "URL 必填"),
          order: z.number().optional(),
          isVisible: z.boolean().default(true),
          openNewWindow: z.boolean().default(false),
          parentId: z.number().optional().nullable(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!canAccessCmsPermission(ctx.user?.role, ctx.user?.email, "MENUS_MANAGE")) {
          throw new Error("Unauthorized");
        }
        return db.createMenu(input);
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          label: z.string().optional(),
          url: z.string().optional(),
          order: z.number().optional(),
          isVisible: z.boolean().optional(),
          openNewWindow: z.boolean().optional(),
          parentId: z.number().optional().nullable(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!canAccessCmsPermission(ctx.user?.role, ctx.user?.email, "MENUS_MANAGE")) {
          throw new Error("Unauthorized");
        }
        const { id, ...data } = input;
        return db.updateMenu(id, data);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!canAccessCmsPermission(ctx.user?.role, ctx.user?.email, "MENUS_MANAGE")) {
          throw new Error("Unauthorized");
        }
        return db.deleteMenu(input.id);
      }),
  }),

  /**
   * SEO Management
   */
  seo: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      if (!canAccessCmsPermission(ctx.user?.role, ctx.user?.email, "SEO_MANAGE")) {
        throw new Error("Unauthorized");
      }
      return db.getAllSEO();
    }),

    getBySlug: protectedProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input, ctx }) => {
        if (!canAccessCmsPermission(ctx.user?.role, ctx.user?.email, "SEO_MANAGE")) {
          throw new Error("Unauthorized");
        }
        return db.getSEOBySlug(input.slug);
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          title: z.string().optional(),
          description: z.string().optional(),
          keywords: z.string().optional(),
          canonical: z.string().optional(),
          ogImage: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!canAccessCmsPermission(ctx.user?.role, ctx.user?.email, "SEO_MANAGE")) {
          throw new Error("Unauthorized");
        }
        const { id, ...data } = input;
        return db.updateSEO(id, data);
      }),
  }),

  /**
   * Users Management
   */
  users: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      if (!canAccessCmsPermission(ctx.user?.role, ctx.user?.email, "USERS_MANAGE")) throw new Error("Unauthorized");
      return db.getAllUsers();
    }),
    create: protectedProcedure
      .input(z.object({
        name: z.string().trim().min(1).max(120),
        email: z.string().trim().email().max(320),
        role: cmsUserRoleSchema.default("user"),
        initialPassword: z.string().min(12, "初始密碼至少需要 12 個字元").max(128),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!canAccessCmsPermission(ctx.user?.role, ctx.user?.email, "USERS_MANAGE")) throw new Error("Unauthorized");
        if (input.role === "super_admin" && !isHighestAdmin(ctx.user?.email)) throw new Error("只有最高權限管理員可建立 Super Admin");
        const email = input.email.toLowerCase();
        if (await db.getUserByEmail(email)) throw new Error("此 Email 已建立員工帳號");
        return db.createCmsUser({
          openId: `cms-user:${createHash("sha256").update(email).digest("hex")}`,
          name: input.name,
          email,
          loginMethod: "cms_password",
          passwordHash: await hashCmsUserPassword(input.initialPassword),
          role: input.role,
          isActive: true,
          lastSignedIn: new Date(),
        });
      }),
    updateRole: protectedProcedure
      .input(
        z.object({
          id: z.number().int().positive().optional(),
          email: z.string().email().optional(),
          role: cmsUserRoleSchema,
        }).refine((input) => input.id !== undefined || input.email !== undefined, "請提供使用者 ID 或 Email")
      )
      .mutation(async ({ input, ctx }) => {
        if (!canAccessCmsPermission(ctx.user?.role, ctx.user?.email, "USERS_MANAGE")) throw new Error("Unauthorized");
        if (input.role === "super_admin" && !isHighestAdmin(ctx.user?.email)) throw new Error("只有最高權限管理員可授予 Super Admin");
        const user = input.id !== undefined
          ? (await db.getAllUsers()).find((candidate) => candidate.id === input.id)
          : await db.getUserByEmail(input.email!.toLowerCase());
        if (!user) throw new Error("User not found");
        if (user.role === "super_admin" && !isHighestAdmin(ctx.user?.email)) throw new Error("只有最高權限管理員可調整 Super Admin");
        await db.updateUserRoleAndStatus(user.id, { role: input.role });
        return { success: true, message: `User role updated to ${input.role}` };
      }),
    updateProfile: protectedProcedure
      .input(z.object({
        id: z.number().int().positive(),
        name: z.string().trim().min(1).max(120),
        email: z.string().trim().email().max(320),
        newPassword: z.string().min(12, "重設密碼至少需要 12 個字元").max(128).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!canAccessCmsPermission(ctx.user?.role, ctx.user?.email, "USERS_MANAGE")) throw new Error("Unauthorized");
        const user = (await db.getAllUsers()).find((candidate) => candidate.id === input.id);
        if (!user) throw new Error("User not found");
        if ((user.role === "super_admin" || isHighestAdmin(user.email)) && !isHighestAdmin(ctx.user?.email)) {
          throw new Error("只有最高權限管理員可編輯 Super Admin");
        }
        const email = input.email.toLowerCase();
        const existing = await db.getUserByEmail(email);
        if (existing && existing.id !== user.id) throw new Error("此 Email 已建立員工帳號");
        await db.updateCmsUserProfile(user.id, {
          name: input.name,
          email,
          ...(input.newPassword ? { passwordHash: await hashCmsUserPassword(input.newPassword) } : {}),
        });
        return { success: true };
      }),
    setActive: protectedProcedure
      .input(z.object({ id: z.number().int().positive(), isActive: z.boolean() }))
      .mutation(async ({ input, ctx }) => {
        if (!canAccessCmsPermission(ctx.user?.role, ctx.user?.email, "USERS_MANAGE")) throw new Error("Unauthorized");
        const user = (await db.getAllUsers()).find((candidate) => candidate.id === input.id);
        if (!user) throw new Error("User not found");
        if (user.role === "super_admin" || isHighestAdmin(user.email)) throw new Error("最高權限管理員帳號不可停用");
        if (user.id === ctx.user?.id) throw new Error("不可停用目前登入帳號");
        await db.updateUserRoleAndStatus(user.id, { isActive: input.isActive });
        return { success: true };
      }),
  }),
  /**
   * Hero Management
   */
  hero: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      if (!canAccessCmsPermission(ctx.user?.role, ctx.user?.email, "HERO_MANAGE")) {
        throw new Error("Unauthorized");
      }
      return db.getAllHeroes();
    }),
    create: protectedProcedure
      .input(
        z.object({
          title: z.string().min(1, "Title is required"),
          subtitle: z.string().optional(),
          backgroundImage: z.string().optional(),
          backgroundVideo: z.string().optional(),
          ctaText: z.string().optional(),
          ctaLink: z.string().optional(),
          isPublished: z.boolean().default(false),
          order: z.number().default(0),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!canAccessCmsPermission(ctx.user?.role, ctx.user?.email, "HERO_MANAGE")) {
          throw new Error("Unauthorized");
        }
        return db.createHero(input);
      }),
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          title: z.string().optional(),
          subtitle: z.string().optional(),
          backgroundImage: z.string().optional(),
          backgroundVideo: z.string().optional(),
          ctaText: z.string().optional(),
          ctaLink: z.string().optional(),
          isPublished: z.boolean().optional(),
          order: z.number().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!canAccessCmsPermission(ctx.user?.role, ctx.user?.email, "HERO_MANAGE")) {
          throw new Error("Unauthorized");
        }
        const { id, ...data } = input;
        return db.updateHero(id, data);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!canAccessCmsPermission(ctx.user?.role, ctx.user?.email, "HERO_DELETE")) {
          throw new Error("Unauthorized");
        }
        return db.deleteHero(input.id);
      }),
  }),
  /**
   * Footer Management
   */
  footer: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      if (!canAccessCmsPermission(ctx.user?.role, ctx.user?.email, "FOOTER_MANAGE")) {
        throw new Error("Unauthorized");
      }
      return db.getFooter();
    }),
    create: protectedProcedure
      .input(
        z.object({
          address: z.string().optional(),
          phone: z.string().optional(),
          email: z.string().optional(),
          socialLinks: z.any().optional(),
          copyrightText: z.string().optional(),
          aboutText: z.string().optional(),
          quickLinks: z.any().optional(),
          isPublished: z.boolean().default(false),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!canAccessCmsPermission(ctx.user?.role, ctx.user?.email, "FOOTER_MANAGE")) {
          throw new Error("Unauthorized");
        }
        const result = await db.createFooter(input);
        await syncSiteSettingsFromFooter(input);
        return result;
      }),
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          address: z.string().optional(),
          phone: z.string().optional(),
          email: z.string().optional(),
          socialLinks: z.any().optional(),
          copyrightText: z.string().optional(),
          aboutText: z.string().optional(),
          quickLinks: z.any().optional(),
          isPublished: z.boolean().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!canAccessCmsPermission(ctx.user?.role, ctx.user?.email, "FOOTER_MANAGE")) {
          throw new Error("Unauthorized");
        }
        const { id, ...data } = input;
        const result = await db.updateFooter(id, data);
        await syncSiteSettingsFromFooter(data);
        return result;
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!canAccessCmsPermission(ctx.user?.role, ctx.user?.email, "FOOTER_DELETE")) {
          throw new Error("Unauthorized");
        }
        return db.deleteFooter(input.id);
      }),
    }),

  /**
   * Reviews Management
   */
  reviews: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      if (!canAccessCmsPermission(ctx.user?.role, ctx.user?.email, "REVIEWS_MANAGE")) {
        throw new Error("Unauthorized");
      }
      return db.getAllReviews();
    }),

    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1, "姓名必填"),
          avatar: z.string().optional(),
          rating: z.number().min(1).max(5),
          content: z.string().min(1, "評論必填"),
          isPublished: z.boolean().default(false),
          isHomepageDisplay: z.boolean().default(false),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!canAccessCmsPermission(ctx.user?.role, ctx.user?.email, "REVIEWS_MANAGE")) {
          throw new Error("Unauthorized");
        }
        return db.createReview(input as any);
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          avatar: z.string().optional(),
          rating: z.number().min(1).max(5).optional(),
          content: z.string().optional(),
          isPublished: z.boolean().optional(),
          isHomepageDisplay: z.boolean().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!canAccessCmsPermission(ctx.user?.role, ctx.user?.email, "REVIEWS_MANAGE")) {
          throw new Error("Unauthorized");
        }
        const { id, ...data } = input;
        return db.updateReview(id, data as any);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!canAccessCmsPermission(ctx.user?.role, ctx.user?.email, "REVIEWS_DELETE")) {
          throw new Error("Unauthorized");
        }
        return db.deleteReview(input.id);
      }),
  }),

  /** 可由最高權限帳號調整的 CMS 功能權限覆寫；未設定時回退中央預設矩陣。 */
  rolePermissions: router({
    list: protectedProcedure
      .input(z.object({ role: cmsUserRoleSchema.exclude(["super_admin"]) }))
      .query(async ({ input, ctx }) => {
        if (!isHighestAdmin(ctx.user?.email)) throw new Error("只有最高權限管理員可檢視角色功能權限。");
        const overrides = await db.getCmsRolePermissionOverrides(input.role);
        const overrideByPermission = new Map(overrides.map((item) => [item.permission, item]));
        return (Object.keys(CMS_PERMISSIONS) as CmsPermission[]).map((permission) => {
          const override = overrideByPermission.get(permission);
          const defaultAllowed = CMS_PERMISSIONS[permission].includes(normalizeCmsRole(input.role) as never);
          return {
            permission,
            defaultAllowed,
            isAllowed: override?.isAllowed ?? defaultAllowed,
            isOverridden: Boolean(override),
            updatedAt: override?.updatedAt ?? null,
          };
        });
      }),
    update: protectedProcedure
      .input(z.object({
        role: cmsUserRoleSchema.exclude(["super_admin"]),
        permission: z.enum(Object.keys(CMS_PERMISSIONS) as [CmsPermission, ...CmsPermission[]]),
        isAllowed: z.boolean(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!isHighestAdmin(ctx.user?.email) || !ctx.user) throw new Error("只有最高權限管理員可調整角色功能權限。");
        await db.setCmsRolePermissionOverride({ ...input, updatedBy: ctx.user.id });
        await refreshCmsRolePermissionOverrideCache();
        return { success: true };
      }),
    audit: protectedProcedure
      .input(z.object({ role: cmsUserRoleSchema.exclude(["super_admin"]).optional() }).optional())
      .query(async ({ input, ctx }) => {
        if (!isHighestAdmin(ctx.user?.email)) throw new Error("只有最高權限管理員可檢視權限異動紀錄。");
        return db.getCmsPermissionAudit(input?.role);
      }),
  }),

  /**
   * Contact Form
   */
  contact: {
    sendEmail: publicProcedure
      .input(z.object({
        name: z.string().min(1, "姓名為必填"),
        email: z.string().email("請輸入有效的電子郵件"),
        subject: z.string().min(1, "主旨為必填"),
        message: z.string().min(1, "訊息為必填"),
      }))
      .mutation(async ({ input }: { input: { name: string; email: string; subject: string; message: string } }) => {
        try {
          // 保存聯繫訊息到資料庫
          await db.createContact({
            name: input.name,
            email: input.email,
            message: input.message,
            createdAt: new Date(),
          });
          
          // TODO: 事後可以添加發送郵件的邏輯
          // 例如使用 SMTP、SendGrid 等服務
          // 或使用 Manus 的位會通知 API
          console.log("[Contact] New message from:", input.email);
          console.log("[Contact] Subject:", input.subject);

          return { success: true, message: "訊息已成功保存" };
        } catch (error) {
          console.error("[Contact] Error:", error);
          throw new Error("無法保存訊息，請稍後重試");
        }
      }),
  },
});
export type CMSRouter = typeof cmsRouter;
