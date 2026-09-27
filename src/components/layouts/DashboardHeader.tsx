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
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-[#D8EEB6] bg-white px-4 sm:px-6 shadow-xs">
      <div className="flex items-center gap-3">
        <div className="relative h-10 w-10 shrink-0 rounded-xl overflow-hidden bg-white p-0.5 border border-[#E0F2C2] shadow-xs">
          <img
            src="/whitebee-logo.png"
            alt="White Bee Logo"
            className="h-full w-full object-contain"
          />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <h2 className="text-sm font-extrabold text-slate-900">
              White<span className="text-[#7AB82A]">Bee</span> School of Life
            </h2>
          </div>
          <p className="text-[11px] text-slate-500 font-semibold">Tahun Ajaran 2026/2027</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5 rounded-xl border border-[#E0F2C2] bg-[#F7FCEF] px-3 py-1.5 shadow-xs">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#7AB82A] text-white text-xs font-black shadow-xs">
            {user.name.charAt(0)}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-bold leading-none text-slate-900">{user.name}</p>
            <p className="text-[10px] text-slate-500 font-semibold flex items-center gap-1 mt-0.5">
              {user.role === "ADMIN" ? (
                <>
                  <Shield className="h-3 w-3 text-amber-500" />
                  <span className="text-amber-700 font-bold">Administrator</span>
                </>
              ) : (
                <>
                  <BookOpen className="h-3 w-3 text-[#7AB82A]" />
                  <span className="text-[#578A1A] font-bold">Guru Pengampu</span>
                </>
              )}
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl gap-1.5 font-bold"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Keluar</span>
        </Button>
      </div>
    </header>
  );
}
