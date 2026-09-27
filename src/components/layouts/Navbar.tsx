"use client";

import Link from "next/link";
import { GraduationCap, LogIn, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-foreground">ExamCode</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-primary ml-1.5 px-1.5 py-0.5 rounded bg-primary/10">
              School
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <Link href="/join">
            <Button variant="default" className="font-semibold gap-2 shadow-sm">
              <span>Masuk Ujian</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" className="gap-2">
              <LogIn className="h-4 w-4" />
              <span className="hidden sm:inline">Portal Guru & Admin</span>
              <span className="sm:hidden">Masuk</span>
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
