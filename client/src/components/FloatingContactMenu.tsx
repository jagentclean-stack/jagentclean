import { trpc } from "@/lib/trpc";
import { Mail, MessageCircle, Phone } from "lucide-react";

const FALLBACKS = {
  lineUrl: "https://lin.ee/ynvoHjh",
  facebookUrl: "https://www.facebook.com/Jagentclean",
  phone: "06-3584567",
  email: "jagentclean@gmail.com",
};

export default function FloatingContactMenu() {
  const { data: settings } = trpc.cms.publicContent.siteSettings.useQuery();
  const lineUrl = settings?.lineUrl || FALLBACKS.lineUrl;
  const facebookUrl = settings?.facebookUrl || FALLBACKS.facebookUrl;
  const phone = settings?.companyPhone || FALLBACKS.phone;
  const email = settings?.companyEmail || FALLBACKS.email;
  const phoneHref = `tel:${phone.replace(/[^\d+]/g, "")}`;

  const links = [
    { label: "加入 LINE", href: lineUrl, icon: <img src="/manus-storage/line-logo_3ac33c37.png" alt="" className="h-6 w-6 object-contain" />, tone: "bg-[#00B900] hover:bg-[#00A000]" },
    { label: "Facebook", href: facebookUrl, icon: <img src="/manus-storage/facebook-logo_ee508d3d.png" alt="" className="h-6 w-6 object-contain" />, tone: "bg-[#1877F2] hover:bg-[#1266d7]" },
    { label: phone, href: phoneHref, icon: <Phone className="h-5 w-5" aria-hidden="true" />, tone: "bg-primary hover:bg-primary/90" },
    { label: "電子郵件", href: `mailto:${email}`, icon: <Mail className="h-5 w-5" aria-hidden="true" />, tone: "bg-slate-600 hover:bg-slate-700" },
  ];

  return (
    <nav aria-label="快速聯絡方式" className="fixed bottom-6 right-4 z-40 flex flex-col items-end gap-3 sm:right-6">
      {links.map((link) => (
        <a
          key={link.label}
          href={link.href}
          target={link.href.startsWith("http") ? "_blank" : undefined}
          rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
          className="group flex items-center gap-2"
        >
          <span className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">{link.label}</span>
          <span className={`flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg transition-transform duration-200 group-hover:scale-105 ${link.tone}`}>{link.icon}</span>
        </a>
      ))}
      <span className="sr-only"><MessageCircle /> 快速聯絡</span>
    </nav>
  );
}
