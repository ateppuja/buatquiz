"use client";

import { LogOut, User, Building2, Shield, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface DashboardHeaderProps {
  user: {
    name: string;
    email: string;
    role: string;
    schoolName?: string;
  };
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/v1/auth/logout", { method: "POST" });
      toast.success("Berhasil keluar.");
      router.push("/login");
      router.refresh();
    } catch {
      toast.error("Gagal logout");
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-card px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Building2 className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-foreground">{user.schoolName || "Quiz White Bee School of Life"}</h2>
          <p className="text-xs text-muted-foreground">Tahun Ajaran 2026/2027</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5 rounded-lg border border-border bg-background px-3 py-1.5 shadow-sm">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
            {user.name.charAt(0)}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold leading-none text-foreground">{user.name}</p>
            <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
              {user.role === "ADMIN" ? (
                <>
                  <Shield className="h-3 w-3 text-amber-500" />
                  <span>Administrator</span>
                </>
              ) : (
                <>
                  <BookOpen className="h-3 w-3 text-blue-500" />
                  <span>Guru Pengampu</span>
                </>
              )}
            </p>
          </div>
        </div>

        <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-destructive gap-1.5">
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Keluar</span>
        </Button>
      </div>
    </header>
  );
}
