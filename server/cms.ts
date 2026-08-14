import { z } from "zod";
import * as db from "./db";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { storagePut } from "./storage";
import { decodeMediaUpload, mediaStorageFilename } from "./mediaUpload";

// Type assertion helper for role checking
type AllowedRoles = "admin" | "manager" | "customer_service" | "marketing" | "editor" | "user";

// 管理員 email 白名單
const ADMIN_EMAILS = ["jagentclean@gmail.com", "emilyku0jj@gmail.com"];

const checkRole = (userRole: string | undefined | null, userEmailOrFirstRole: string | undefined | null, ...allowedRoles: AllowedRoles[]): boolean => {
  const userEmail = userEmailOrFirstRole?.includes("@") ? userEmailOrFirstRole : null;
  const resolvedRoles = userEmail ? allowedRoles : [userEmailOrFirstRole, ...allowedRoles];
  // 如果 email 在白名單中，自動授予 admin 權限
  if (userEmail && ADMIN_EMAILS.includes(userEmail)) {
    return true;
  }
  return resolvedRoles.includes(userRole as AllowedRoles);
};

/**
 * CMS Dashboard Router
 * 處理所有後台管理功能
 */
export const cmsRouter = router({
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
    services: publicProcedure.query(() => db.getPublishedServices()),
    cases: publicProcedure.query(() => db.getPublishedCases()),
    blogs: publicProcedure.query(() => db.getPublishedBlogs()),
    faqs: publicProcedure.query(() => db.getVisibleFAQs()),
    footer: publicProcedure.query(() => db.getPublishedFooter()),
    menus: publicProcedure.query(() => db.getPublicMenuTree()),
  }),

  /**
   * Dashboard 統計資訊
   */
  dashboard: protectedProcedure.query(async ({ ctx }) => {
    // 只允許管理員存取
    if (!checkRole(ctx.user?.role, ctx.user?.email, "admin", "manager")) {
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
      if (!checkRole(ctx.user?.role, "admin", "editor")) {
        throw new Error("Unauthorized");
      }
      return db.getAllPages();
    }),

    getBySlug: protectedProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input, ctx }) => {
        if (!checkRole(ctx.user?.role, "admin", "editor")) {
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
        if (!checkRole(ctx.user?.role, "admin")) {
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
        if (!checkRole(ctx.user?.role, "admin", "editor")) {
          throw new Error("Unauthorized");
        }
        const { id, ...data } = input;
        return db.updatePage(id, data);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!checkRole(ctx.user?.role, "admin")) {
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
      if (!checkRole(ctx.user?.role, "admin", "editor")) {
        throw new Error("Unauthorized");
      }
      return db.getAllServices();
    }),

    getBySlug: protectedProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input, ctx }) => {
        if (!checkRole(ctx.user?.role, "admin", "editor")) {
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
          basePrice: z.string().optional(),
          pricePerUnit: z.string().optional(),
          unit: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!checkRole(ctx.user?.role, "admin")) {
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
          basePrice: z.string().optional(),
          pricePerUnit: z.string().optional(),
          unit: z.string().optional(),
          isPublished: z.boolean().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!checkRole(ctx.user?.role, "admin", "editor")) {
          throw new Error("Unauthorized");
        }
        const { id, ...data } = input;
        return db.updateService(id, data as any);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!checkRole(ctx.user?.role, "admin")) {
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
      if (!checkRole(ctx.user?.role, "admin", "manager", "customer_service")) {
        throw new Error("Unauthorized");
      }
      return db.getAllBookings();
    }),

    getByStatus: protectedProcedure
      .input(z.object({ status: z.string() }))
      .query(async ({ input, ctx }) => {
        if (!checkRole(ctx.user?.role, "admin", "manager", "customer_service")) {
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
      .mutation(async ({ input }) => {
        return db.createBooking({
          ...input,
          status: "pending",
        });
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum(["pending", "quoted", "in_progress", "completed", "cancelled"]).optional(),
          name: z.string().optional(),
          phone: z.string().optional(),
          email: z.string().optional(),
          address: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!checkRole(ctx.user?.role, "admin", "manager", "customer_service")) {
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
      if (!checkRole(ctx.user?.role, "admin", "manager", "customer_service")) {
        throw new Error("Unauthorized");
      }
      return db.getAllContacts();
    }),

    markAsRead: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!checkRole(ctx.user?.role, "admin", "customer_service")) {
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
      if (!checkRole(ctx.user?.role, "admin", "editor")) {
        throw new Error("Unauthorized");
      }
      return db.getAllMedia();
    }),

    getByCategory: protectedProcedure
      .input(z.object({ category: z.string() }))
      .query(async ({ input, ctx }) => {
        if (!checkRole(ctx.user?.role, "admin", "editor")) {
          throw new Error("Unauthorized");
        }
        return db.getMediaByCategory(input.category);
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
        if (!checkRole(ctx.user?.role, "admin", "editor")) {
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
        if (!checkRole(ctx.user?.role, "admin", "editor")) {
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

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!checkRole(ctx.user?.role, "admin")) {
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
      if (!checkRole(ctx.user?.role, "admin")) {
        throw new Error("Unauthorized");
      }
      return db.getAllSettings();
    }),

    get: protectedProcedure
      .input(z.object({ key: z.string() }))
      .query(async ({ input, ctx }) => {
        if (!checkRole(ctx.user?.role, "admin")) {
          throw new Error("Unauthorized");
        }
        return db.getSetting(input.key);
      }),

    update: protectedProcedure
      .input(z.object({ key: z.string(), value: z.string() }))
      .mutation(async ({ input, ctx }) => {
        if (!checkRole(ctx.user?.role, "admin")) {
          throw new Error("Unauthorized");
        }
        return db.updateSetting(input.key, input.value);
      }),
  }),

  /**
   * Cases Management
   */
  cases: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      if (!checkRole(ctx.user?.role, "admin", "editor")) {
        throw new Error("Unauthorized");
      }
      return db.getAllCases();
    }),

    getBySlug: protectedProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input, ctx }) => {
        if (!checkRole(ctx.user?.role, "admin", "editor")) {
          throw new Error("Unauthorized");
        }
        return db.getCaseBySlug(input.slug);
      }),

    create: protectedProcedure
      .input(
        z.object({
          name: z.string(),
          slug: z.string(),
          location: z.string().optional(),
          description: z.string().optional(),
          beforeImage: z.string().optional(),
          afterImage: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!checkRole(ctx.user?.role, "admin")) {
          throw new Error("Unauthorized");
        }
        return db.createCase(input as any);
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          slug: z.string().optional(),
          location: z.string().optional(),
          description: z.string().optional(),
          beforeImage: z.string().optional(),
          afterImage: z.string().optional(),
          isPublished: z.boolean().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!checkRole(ctx.user?.role, "admin", "editor")) {
          throw new Error("Unauthorized");
        }
        const { id, ...data } = input;
        return db.updateCase(id, data as any);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!checkRole(ctx.user?.role, "admin")) {
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
      if (!checkRole(ctx.user?.role, "admin", "editor", "marketing")) {
        throw new Error("Unauthorized");
      }
      return db.getAllBlogs();
    }),

    getBySlug: protectedProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input, ctx }) => {
        if (!checkRole(ctx.user?.role, "admin", "editor", "marketing")) {
          throw new Error("Unauthorized");
        }
        return db.getBlogBySlug(input.slug);
      }),

    create: protectedProcedure
      .input(
        z.object({
          title: z.string(),
          slug: z.string(),
          excerpt: z.string().optional(),
          content: z.string().optional(),
          isPublished: z.boolean().default(false),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!checkRole(ctx.user?.role, "admin", "editor")) {
          throw new Error("Unauthorized");
        }
        return db.createBlog(input as any);
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          title: z.string().optional(),
          slug: z.string().optional(),
          excerpt: z.string().optional(),
          content: z.string().optional(),
          isPublished: z.boolean().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!checkRole(ctx.user?.role, "admin", "editor", "marketing")) {
          throw new Error("Unauthorized");
        }
        const { id, ...data } = input;
        return db.updateBlog(id, data as any);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!checkRole(ctx.user?.role, "admin")) {
          throw new Error("Unauthorized");
        }
        return db.deleteBlog(input.id);
      }),
  }),

  /**
   * FAQs Management
   */
  faqs: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      if (!checkRole(ctx.user?.role, "admin", "editor")) {
        throw new Error("Unauthorized");
      }
      return db.getAllFAQs();
    }),

    create: protectedProcedure
      .input(
        z.object({
          question: z.string(),
          answer: z.string(),
          category: z.string().optional(),
          order: z.number().default(0),
          isVisible: z.boolean().default(true),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!checkRole(ctx.user?.role, "admin", "editor")) {
          throw new Error("Unauthorized");
        }
        return db.createFAQ(input as any);
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          question: z.string().optional(),
          answer: z.string().optional(),
          category: z.string().optional(),
          order: z.number().optional(),
          isVisible: z.boolean().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!checkRole(ctx.user?.role, "admin", "editor")) {
          throw new Error("Unauthorized");
        }
        const { id, ...data } = input;
        return db.updateFAQ(id, data as any);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!checkRole(ctx.user?.role, "admin")) {
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
      if (!checkRole(ctx.user?.role, ctx.user?.email, "admin", "manager")) {
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
        if (!checkRole(ctx.user?.role, ctx.user?.email, "admin", "manager")) {
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
        if (!checkRole(ctx.user?.role, ctx.user?.email, "admin", "manager")) {
          throw new Error("Unauthorized");
        }
        const { id, ...data } = input;
        return db.updateMenu(id, data);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!checkRole(ctx.user?.role, ctx.user?.email, "admin", "manager")) {
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
      if (!checkRole(ctx.user?.role, "admin", "editor")) {
        throw new Error("Unauthorized");
      }
      return db.getAllSEO();
    }),

    getBySlug: protectedProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input, ctx }) => {
        if (!checkRole(ctx.user?.role, "admin", "editor")) {
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
        if (!checkRole(ctx.user?.role, "admin", "editor")) {
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
    updateRole: protectedProcedure
      .input(
        z.object({
          email: z.string().email(),
          role: z.enum(['admin', 'manager', 'customer_service', 'marketing', 'editor', 'user']),
        })
      )
      .mutation(async ({ input, ctx }) => {
        // 只允許 Admin 更新使用者角色
        if (!checkRole(ctx.user?.role, 'admin')) {
          throw new Error('Unauthorized');
        }

        const user = await db.getUserByEmail(input.email);
        if (!user) {
          throw new Error('User not found');
        }

        await db.updateUserRole(user.id, input.role);
        return { success: true, message: `User role updated to ${input.role}` };
      }),
  }),
  /**
   * Hero Management
   */
  hero: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      if (!checkRole(ctx.user?.role, ctx.user?.email, "admin", "editor")) {
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
        if (!checkRole(ctx.user?.role, ctx.user?.email, "admin", "editor")) {
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
        if (!checkRole(ctx.user?.role, ctx.user?.email, "admin", "editor")) {
          throw new Error("Unauthorized");
        }
        const { id, ...data } = input;
        return db.updateHero(id, data);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!checkRole(ctx.user?.role, ctx.user?.email, "admin")) {
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
      if (!checkRole(ctx.user?.role, ctx.user?.email, "admin", "editor")) {
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
        if (!checkRole(ctx.user?.role, ctx.user?.email, "admin", "editor")) {
          throw new Error("Unauthorized");
        }
        return db.createFooter(input);
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
        if (!checkRole(ctx.user?.role, ctx.user?.email, "admin", "editor")) {
          throw new Error("Unauthorized");
        }
        const { id, ...data } = input;
        return db.updateFooter(id, data);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!checkRole(ctx.user?.role, ctx.user?.email, "admin")) {
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
      if (!checkRole(ctx.user?.role, ctx.user?.email, "admin", "marketing")) {
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
        if (!checkRole(ctx.user?.role, ctx.user?.email, "admin", "marketing")) {
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
        if (!checkRole(ctx.user?.role, ctx.user?.email, "admin", "marketing")) {
          throw new Error("Unauthorized");
        }
        const { id, ...data } = input;
        return db.updateReview(id, data as any);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!checkRole(ctx.user?.role, ctx.user?.email, "admin")) {
          throw new Error("Unauthorized");
        }
        return db.deleteReview(input.id);
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
