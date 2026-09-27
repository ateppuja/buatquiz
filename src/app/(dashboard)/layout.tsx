"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { DashboardHeader } from "@/components/layouts/DashboardHeader";
import { AdminSidebar } from "@/components/layouts/AdminSidebar";
import { TeacherSidebar } from "@/components/layouts/TeacherSidebar";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/v1/auth/me");
        const data = await res.json();

        if (!res.ok || !data.success) {
          router.push("/login");
          return;
        }

        setUser(data.data);

        // Role check against pathname
        if (pathname.startsWith("/admin") && data.data.role !== "ADMIN") {
          router.push("/teacher/dashboard");
        }
      } catch {
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    }

    checkAuth();
  }, [pathname, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-xs text-muted-foreground">Memeriksa sesi pengguna...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50 dark:bg-slate-950">
      <DashboardHeader user={user} />
      <div className="flex-1 flex">
        {user.role === "ADMIN" ? <AdminSidebar /> : <TeacherSidebar />}
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
