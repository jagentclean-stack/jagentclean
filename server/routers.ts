import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import nodemailer from "nodemailer";
import { cmsRouter } from "./cms";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Email contact form
  contact: router({
    sendEmail: publicProcedure
      .input(
        z.object({
          name: z.string().min(1, "Name is required"),
          email: z.string().email("Invalid email"),
          subject: z.string().min(1, "Subject is required"),
          message: z.string().min(1, "Message is required"),
        })
      )
      .mutation(async ({ input }) => {
        try {
          // Create transporter using Gmail
          const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASSWORD,
            },
          });

          // Send email
          await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: "jagentclean@gmail.com",
            replyTo: input.email,
            subject: `潔特務清潔聯繫表單：${input.subject}`,
            html: `
              <h2>新的聯繫表單提交</h2>
              <p><strong>姓名：</strong>${input.name}</p>
              <p><strong>電子郵件：</strong>${input.email}</p>
              <p><strong>主旨：</strong>${input.subject}</p>
              <p><strong>訊息：</strong></p>
              <p>${input.message.replace(/\n/g, "<br>")}</p>
            `,
          });

          return { success: true, message: "Email sent successfully" };
        } catch (error) {
          console.error("Email sending error:", error);
          throw new Error("Failed to send email");
        }
      }),
  }),

  // CMS Dashboard
  cms: cmsRouter,
});

export type AppRouter = typeof appRouter;

// Note: Admin setup should be done through database directly or via cms.users.updateRole
