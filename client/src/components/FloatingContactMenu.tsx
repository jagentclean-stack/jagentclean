import { useState } from "react";
import { MessageCircle, Phone, Mail, Send } from "lucide-react";

interface ContactLink {
  icon: string;
  label: string;
  url: string;
  bgColor: string;
}

const contactLinks: ContactLink[] = [
  {
    icon: "/manus-storage/line-logo_3ac33c37.png",
    label: "加入 LINE",
    url: "https://lin.ee/ynvoHjh",
    bgColor: "bg-green-500",
  },
  {
    icon: "/manus-storage/facebook-logo_ee508d3d.png",
    label: "Facebook",
    url: "https://www.facebook.com/jagentcleaning",
    bgColor: "bg-blue-600",
  },
  {
    icon: "phone",
    label: "電話",
    url: "tel:+886-2-xxxx-xxxx",
    bgColor: "bg-red-500",
  },
  {
    icon: "mail",
    label: "信箱",
    url: "mailto:info@jagentcleaning.com",
    bgColor: "bg-gray-500",
  },
];

export default function FloatingContactMenu() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed right-6 bottom-6 z-40">
      {/* Menu Items */}
      <div
        className={`absolute right-0 bottom-20 flex flex-col gap-4 transition-all duration-300 ${
          isOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
      >
        {contactLinks.map((link, index) => (
          <a
            key={index}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-3 group`}
            title={link.label}
          >
            {/* Label - 滑鼠懸停時顯示 */}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gray-800 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap">
              {link.label}
            </div>

            {/* Icon Button */}
            <div
              className={`w-14 h-14 ${link.bgColor} rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 cursor-pointer flex-shrink-0`}
            >
              {link.icon === "phone" ? (
                <Phone className="w-6 h-6 text-white" />
              ) : link.icon === "mail" ? (
                <Mail className="w-6 h-6 text-white" />
              ) : (
                <img
                  src={link.icon}
                  alt={link.label}
                  className="w-8 h-8 object-contain"
                />
              )}
            </div>
          </a>
        ))}
      </div>

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center ${
          isOpen
            ? "bg-gray-500 hover:bg-gray-600"
            : "bg-blue-500 hover:bg-blue-600"
        }`}
        title="聯繫我們"
      >
        {isOpen ? (
          <Send className="w-6 h-6 text-white transform rotate-45" />
        ) : (
          <MessageCircle className="w-6 h-6 text-white" />
        )}
      </button>
    </div>
  );
}
