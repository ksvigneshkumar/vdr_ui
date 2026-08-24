"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaFileAlt, FaShieldAlt } from "react-icons/fa";

export default function RedactionSidebar() {
  const pathname = usePathname();

  // If in viewer/view mode, hide the sidebar so viewer has full canvas
  if (pathname?.includes("/viewer") || pathname?.includes("/view")) {
    return null;
  }

  const navItems = [
    {
      name: "Documents",
      href: "/redaction/documents",
      icon: <FaFileAlt className="w-4 h-4" />,
    },
    {
      name: "Redacted Files",
      href: "/redaction/redacted",
      icon: <FaShieldAlt className="w-4 h-4" />,
    }
  ];

  return (
    <nav className="w-full md:w-64 shrink-0 bg-white border-b md:border-b-0 md:border-r border-slate-200 flex flex-col md:h-full z-10 shadow-xs md:shadow-[2px_0_8px_-4px_rgba(0,0,0,0.05)]">
      <div className="hidden md:flex p-5 border-b border-slate-100 items-center">
        <h2 className="text-base font-bold text-slate-800">Redaction</h2>
      </div>
      <div className="flex-none md:flex-1 overflow-x-auto md:overflow-y-auto py-2 md:py-4 px-3 flex flex-row md:flex-col gap-1.5 md:gap-1 no-scrollbar">
        {navItems.map((item) => {
          const isActive = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-2.5 px-3.5 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-all whitespace-nowrap ${
                isActive
                  ? "bg-[var(--brand)] text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-50 hover:text-[var(--brand)]"
              }`}
            >
              <span className={isActive ? "text-white" : "text-slate-400"}>
                {item.icon}
              </span>
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

