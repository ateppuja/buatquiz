"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileCheck2,
  PlusCircle,
  FolderKanban,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";

const teacherNavItems = [
  { href: "/teacher/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/teacher/exams", label: "Daftar Ujian", icon: FileCheck2 },
  { href: "/teacher/exams/create", label: "Buat Ujian Baru", icon: PlusCircle },
  { href: "/teacher/questions", label: "Bank Soal", icon: FolderKanban },
  { href: "/teacher/subjects", label: "Mata Pelajaran", icon: BookOpen },
];

export function TeacherSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-[#E0F2C2] bg-white flex flex-col shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="p-4 border-b border-[#E0F2C2]/70">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#EBF7D9] text-[#4F7E16] text-xs font-bold border border-[#D5EFA9]">
          <BookOpen className="h-4 w-4 text-[#7AB82A]" />
          <span>Panel Guru Pengampu</span>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {teacherNavItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href === "/teacher/exams" && pathname.startsWith("/teacher/exams") && pathname !== "/teacher/exams/create");
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
