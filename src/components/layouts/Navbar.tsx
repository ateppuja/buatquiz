"use client";

import Link from "next/link";
import Image from "next/image";
import { LogIn, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#D8EEB6] bg-white/95 backdrop-blur-md shadow-xs">
      <div className="container mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3 transition-transform hover:scale-[1.02]">
          <div className="relative h-12 w-12 shrink-0 rounded-2xl overflow-hidden bg-white p-1 shadow-sm border border-[#E0F2C2]">
            <img
              src="/whitebee-logo.png"
              alt="White Bee School of Life"
              className="h-full w-full object-contain"
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base sm:text-lg font-black tracking-tight text-slate-900">
                White<span className="text-[#7AB82A]">Bee</span>
              </span>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#578A1A] px-2.5 py-0.5 rounded-full bg-[#EBF7D9] border border-[#D5EFA9]">
                School of Life
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-semibold hidden sm:block">
              Platform Ujian & Kuis Online Cerdas
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/join">
            <Button className="font-extrabold gap-1.5 rounded-2xl bg-[#7AB82A] hover:bg-[#6AA421] text-white shadow-md text-xs sm:text-sm h-10 sm:h-11 px-4 sm:px-5 active:scale-95 transition-all">
              <span>Masuk Ujian</span>
              <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
          </Link>
          <Link href="/login">
            <Button
              variant="outline"
              className="gap-1.5 rounded-2xl border-[#D5EFA9] bg-[#F7FCEF] hover:bg-white text-slate-700 text-xs sm:text-sm h-10 sm:h-11 px-3.5 sm:px-4 font-bold shadow-xs active:scale-95 transition-all"
            >
              <LogIn className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#7AB82A]" />
              <span className="hidden sm:inline">Portal Guru & Admin</span>
              <span className="sm:hidden">Login</span>
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
