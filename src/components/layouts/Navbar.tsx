"use client";

import Link from "next/link";
import { LogIn, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-emerald-100 bg-[#EAF6FE]/90 backdrop-blur-md">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 transition-transform hover:scale-102">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#2EB85C] text-white shadow-md shadow-emerald-500/20 text-xl font-bold">
            🐝
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base sm:text-lg font-black tracking-tight text-slate-900">
                Quiz White Bee
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 px-2 py-0.5 rounded-full bg-emerald-100 border border-emerald-200">
                School of Life
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium hidden sm:block">Sistem Ujian Online Sekolah</p>
          </div>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/join">
            <Button className="font-extrabold gap-1.5 rounded-xl bg-[#2EB85C] hover:bg-[#279B4D] text-white shadow-sm text-xs sm:text-sm h-9 sm:h-10 px-3.5 sm:px-4">
              <span>Masuk Ujian</span>
              <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" className="gap-1.5 rounded-xl border-emerald-200 bg-white/80 hover:bg-white text-slate-700 text-xs sm:text-sm h-9 sm:h-10 px-3 sm:px-4 font-bold shadow-xs">
              <LogIn className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-700" />
              <span className="hidden sm:inline">Portal Guru & Admin</span>
              <span className="sm:hidden">Login</span>
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
