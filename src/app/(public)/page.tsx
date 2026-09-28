"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layouts/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function LandingPage() {
  const [examCode, setExamCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleJoinExam = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = examCode.trim().toUpperCase();
    if (!cleanCode) {
      toast.error("Silakan masukkan kode ujian.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/student/exams/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: cleanCode }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.error?.message || "Kode ujian tidak ditemukan.");
        setIsLoading(false);
        return;
      }

      router.push(`/exam/${cleanCode}/identity`);
    } catch {
      toast.error("Gagal memeriksa kode ujian.");
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col bg-cover bg-center bg-no-repeat relative text-slate-800 font-sans selection:bg-[#7AB82A] selection:text-white"
      style={{ backgroundImage: "url('/bg-hero.jpg')" }}
    >
      {/* Soft Nature Overlay for High Readability & Contrast */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#EBF7D9]/85 via-[#F6FCED]/88 to-[#FFFFFF]/92 backdrop-blur-[1.5px] -z-0 pointer-events-none" />

      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />

        {/* CENTERED DIRECT QUIZ ACCESS WORKSPACE */}
        <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
          <div className="w-full max-w-lg">
            
            {/* Main Focused Card */}
            <div className="rounded-[36px] bg-white/95 backdrop-blur-xl p-6 sm:p-10 shadow-2xl border-2 border-[#D8EEB6]/90 text-center relative overflow-hidden">
            
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-[#EBF7D9] rounded-full blur-3xl -z-0 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-[#7AB82A]/10 rounded-full blur-3xl -z-0 pointer-events-none" />

            {/* Official Logo */}
            <div className="relative z-10">
              <div className="w-28 h-28 sm:w-32 sm:h-32 mx-auto rounded-3xl bg-white flex items-center justify-center p-2 shadow-lg border-2 border-[#E0F2C2] mb-4">
                <img
                  src="/whitebee-logo.png"
                  alt="White Bee Logo"
                  className="w-full h-full object-contain"
                />
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                White<span className="text-[#7AB82A]">Bee</span> School of Life
              </h1>
              
              {/* PRAYER MESSAGE BANNER (Berdoa terlebih dahulu sebelum mengerjakan Kuis) */}
              <div className="mt-4 mb-6 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-[#F4FBEB] border-2 border-[#D5EFA9] shadow-xs text-xs sm:text-sm font-black text-[#4B7914]">
                <span className="text-base">🤲</span>
                <span>Berdoa terlebih dahulu sebelum mengerjakan Kuis</span>
              </div>
            </div>

            {/* Exam Code Input Form */}
            <form onSubmit={handleJoinExam} className="space-y-3 relative z-10">
              <div className="rounded-2xl border-2 border-[#D8EEB6] bg-[#FAFDFA] p-2 focus-within:border-[#7AB82A] focus-within:ring-4 focus-within:ring-[#7AB82A]/20 transition-all shadow-inner">
                <Input
                  type="text"
                  placeholder="Ketik Kode Ujian..."
                  value={examCode}
                  onChange={(e) => setExamCode(e.target.value.toUpperCase())}
                  maxLength={10}
                  className="h-14 border-0 bg-transparent text-center text-xl sm:text-2xl font-mono font-black tracking-widest uppercase placeholder:normal-case placeholder:tracking-normal placeholder:font-bold placeholder:text-slate-400 focus-visible:ring-0 text-slate-900"
                  autoFocus
                />
              </div>

              <Button
                type="submit"
                size="lg"
                isLoading={isLoading}
                className="w-full h-13 rounded-2xl font-black text-base gap-2 bg-[#7AB82A] hover:bg-[#6AA421] text-white shadow-xl shadow-[#7AB82A]/30 active:scale-98 transition-all"
              >
                <span>Mulai Ujian</span>
                <ArrowRight className="h-5 w-5" />
              </Button>
            </form>

          </div>

          {/* Quick Footer Navigation */}
          <div className="mt-4 text-center">
            <Link
              href="/login"
              className="text-xs font-extrabold text-[#578A1A] hover:text-[#416812] hover:underline transition-colors"
            >
              Masuk sebagai Guru atau Admin Sekolah →
            </Link>
          </div>

        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="py-4 text-center text-xs font-semibold text-slate-500">
        © 2026 White Bee School of Life. All rights reserved.
      </footer>
      </div>
    </div>
  );
}
