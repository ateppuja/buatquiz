"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Layers,
  BookOpen,
  FileSpreadsheet,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

const adminNavItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/teachers", label: "Kelola Guru", icon: Users },
  { href: "/admin/students", label: "Kelola Murid", icon: GraduationCap },
  { href: "/admin/classes", label: "Daftar Kelas", icon: Layers },
  { href: "/admin/exams", label: "Seluruh Ujian", icon: FileSpreadsheet },
  { href: "/admin/settings", label: "Pengaturan & Audit", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-[#E0F2C2] bg-white flex flex-col shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="p-4 border-b border-[#E0F2C2]/70">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200">
          <ShieldCheck className="h-4 w-4 text-amber-600" />
          <span>Panel Administrator</span>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {adminNavItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/admin/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-bold transition-all",
                isActive
                  ? "bg-[#7AB82A] text-white shadow-sm"
                  : "text-slate-600 hover:bg-[#F4FBEB] hover:text-[#578A1A]"
              )}
            >
              <Icon className={cn("h-4 w-4", isActive ? "text-white" : "text-slate-500")} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
