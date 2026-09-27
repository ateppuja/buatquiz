"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layouts/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  GraduationCap,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Timer,
  FileCheck,
  CheckCircle2,
  Users,
  Award,
} from "lucide-react";
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

      // Navigate to identity verification
      router.push(`/exam/${cleanCode}/identity`);
    } catch {
      toast.error("Gagal memeriksa kode ujian.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 sm:py-24 lg:py-32">
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] dark:bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)]" />

        <div className="container mx-auto max-w-5xl px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary mb-6 shadow-sm">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Platform Ujian Online Sekolah Terintegrasi</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 max-w-4xl mx-auto leading-[1.15]">
            Ujian Digital Sekolah Jadi Mudah dengan{" "}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Kode Akses Instan
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Murid cukup memasukkan kode ujian, nama, dan kelas tanpa perlu membuat akun. Dilengkapi timer server, autosave real-time, dan penilaian otomatis.
          </p>

          {/* Exam Code Input Box */}
          <div className="mt-10 max-w-md mx-auto">
            <form
              onSubmit={handleJoinExam}
              className="flex flex-col sm:flex-row gap-2 rounded-2xl bg-white dark:bg-slate-900 p-2.5 shadow-xl border border-slate-200 dark:border-slate-800"
            >
              <div className="relative flex-1">
                <Input
                  type="text"
                  placeholder="Masukkan 8 Digit Kode Ujian..."
                  value={examCode}
                  onChange={(e) => setExamCode(e.target.value.toUpperCase())}
                  maxLength={10}
                  className="h-12 border-0 bg-transparent text-center sm:text-left text-base font-mono font-bold tracking-widest uppercase placeholder:normal-case placeholder:tracking-normal placeholder:font-normal focus-visible:ring-0"
                />
              </div>
              <Button type="submit" size="lg" isLoading={isLoading} className="h-12 px-6 font-semibold gap-2">
                <span>Mulai</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>

            <div className="mt-3 flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Coba contoh kode aktif: <strong className="text-primary font-mono">MTK9A2BC</strong></span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="py-16 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
              Dirancang Khusus untuk Kebutuhan Guru & Sekolah
            </h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Pengalaman ujian lancar, terstruktur, dan akurat di semua perangkat
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-6 bg-slate-50/50 dark:bg-slate-950/50">
              <div className="h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center mb-4">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">Import Word & Excel</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Guru dapat mengunggah puluhan soal dari dokumen Word (.docx) atau template Excel (.xlsx) sekali klik dengan verifikasi instan.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-6 bg-slate-50/50 dark:bg-slate-950/50">
              <div className="h-12 w-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 flex items-center justify-center mb-4">
                <Timer className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">Autosave & Timer Server</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Jawaban murid tersimpan otomatis di setiap detik. Reload halaman atau kendala jaringan tidak membuat progres hilang.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-6 bg-slate-50/50 dark:bg-slate-950/50">
              <div className="h-12 w-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 flex items-center justify-center mb-4">
                <FileCheck className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">Multi-Attempt & Rekap Nilai</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Mendukung hingga 10 percobaan ujian dengan metode nilai tertinggi, terakhir, atau rata-rata serta ekspor laporan Excel 2-sheet.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 text-center text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800">
        <div className="container mx-auto px-4">
          <p>© 2026 ExamCode School. Platform Ujian Online Terintegrasi Sekolah.</p>
        </div>
      </footer>
    </div>
  );
}
