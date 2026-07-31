import { protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";

// Type assertion helper for role checking
type AllowedRoles = "admin" | "manager" | "customer_service" | "marketing" | "editor" | "user";

const checkRole = (userRole: string | undefined, ...allowedRoles: AllowedRoles[]): boolean => {
  return allowedRoles.includes(userRole as AllowedRoles);
};

/**
 * CMS Dashboard Router
 * 處理所有後台管理功能
 */
export const cmsRouter = router({
  /**
   * Dashboard 統計資訊
   */
  dashboard: protectedProcedure.query(async ({ ctx }) => {
    // 只允許管理員存取
    if (!checkRole(ctx.user?.role, "admin", "manager")) {
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
});

export type CMSRouter = typeof cmsRouter;
