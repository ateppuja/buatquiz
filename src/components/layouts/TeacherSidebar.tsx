"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileCheck2,
  PlusCircle,
  FolderKanban,
  BarChart3,
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
    <aside className="w-64 border-r border-border bg-card flex flex-col shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="p-4 border-b border-border/60">
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-blue-500/10 text-blue-700 dark:text-blue-400 text-xs font-semibold">
          <BookOpen className="h-4 w-4" />
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
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className={cn("h-4 w-4", isActive ? "text-primary-foreground" : "text-muted-foreground")} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
