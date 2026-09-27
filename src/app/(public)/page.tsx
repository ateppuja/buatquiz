"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layouts/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Timer,
  FileCheck,
  CheckCircle2,
  Users,
  Award,
  BookOpen,
  HelpCircle,
  Clock,
  Laptop,
  Check,
  HeartHandshake,
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

      router.push(`/exam/${cleanCode}/identity`);
    } catch {
      toast.error("Gagal memeriksa kode ujian.");
      setIsLoading(false);
    }
  };

  const handleUseDemoCode = (code: string) => {
    setExamCode(code);
    toast.info(`Kode ujian ${code} dimasukkan! Klik Mulai Ujian.`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F7FBEF] text-slate-800 font-sans selection:bg-[#7AB82A] selection:text-white">
      <Navbar />

      {/* SECTION 1: TOP SKY HERO (Fresh White Bee Nature Aesthetic) */}
      <section className="relative pt-10 pb-20 md:pt-14 md:pb-28 px-4 sm:px-6 overflow-hidden">
        {/* Soft Background Sky & Meadow Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#EBF7D9] via-[#F6FCED] to-[#FFFFFF] -z-10" />

        {/* Ambient decorative floating elements */}
        <div className="absolute top-10 left-[8%] w-32 h-14 bg-white/60 rounded-full blur-[1px] -z-10 pointer-events-none" />
        <div className="absolute top-20 right-[12%] w-40 h-16 bg-white/70 rounded-full blur-[1px] -z-10 pointer-events-none" />
        <div className="absolute top-48 left-[20%] w-24 h-10 bg-[#7AB82A]/10 rounded-full blur-xl -z-10 pointer-events-none" />

        <div className="container mx-auto max-w-5xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* Left Column: Heading & Exam Code Access Pill */}
            <div className="lg:col-span-7 text-center lg:text-left space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#CDEB9B] bg-white/95 px-4 py-1.5 text-xs font-bold text-[#4B7914] shadow-sm backdrop-blur">
                <span className="flex h-2 w-2 rounded-full bg-[#7AB82A] animate-pulse" />
                <span>White Bee • School of Life</span>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-black uppercase tracking-widest text-[#578A1A]">
                  PLATFORM UJIAN & KUIS CERIA
                </p>
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 leading-[1.14]">
                  Ujian Sekolah Jadi{" "}
                  <span className="text-[#7AB82A] underline decoration-[#F59E0B] decoration-wavy decoration-2">
                    Menyenangkan
                  </span>{" "}
                  & Bebas Ribet
                </h1>
              </div>

              <p className="text-base sm:text-lg text-slate-600 max-w-xl mx-auto lg:mx-0 font-semibold leading-relaxed">
                Murid cukup memasukkan <strong>Kode Ujian</strong>, Nama, dan Kelas tanpa perlu mendaftar akun. Dilengkapi autosave real-time, timer ceria, dan penilaian otomatis.
              </p>

              {/* Exam Code Input Box Card */}
              <div className="pt-2 max-w-md mx-auto lg:mx-0">
                <form
                  onSubmit={handleJoinExam}
                  className="flex flex-col sm:flex-row gap-2.5 rounded-3xl bg-white p-2.5 shadow-xl border-2 border-[#D8EEB6] ring-4 ring-[#7AB82A]/15"
                >
                  <div className="relative flex-1">
                    <Input
                      type="text"
                      placeholder="Ketik 8 Digit Kode Ujian..."
                      value={examCode}
                      onChange={(e) => setExamCode(e.target.value.toUpperCase())}
                      maxLength={10}
                      className="h-13 border-0 bg-transparent text-center sm:text-left text-base font-mono font-black tracking-widest uppercase placeholder:normal-case placeholder:tracking-normal placeholder:font-normal focus-visible:ring-0 text-slate-900"
                    />
                  </div>
                  <Button
                    type="submit"
                    size="lg"
                    isLoading={isLoading}
                    className="h-13 px-7 rounded-2xl font-black text-sm gap-2 bg-[#7AB82A] hover:bg-[#6AA421] text-white shadow-lg shadow-[#7AB82A]/30 transition-all hover:scale-[1.02] active:scale-98"
                  >
                    <span>Mulai Ujian</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </form>

                {/* Quick Demo Code helper */}
                <div className="mt-3.5 flex flex-wrap items-center justify-center lg:justify-start gap-2 text-xs text-slate-600">
                  <span className="flex items-center gap-1 font-bold text-[#4B7914]">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#7AB82A]" />
                    Kode Ujian Contoh:
                  </span>
                  <button
                    type="button"
                    onClick={() => handleUseDemoCode("MTK9A2BC")}
                    className="font-mono font-black text-xs px-2.5 py-1 rounded-xl bg-white border border-[#D5EFA9] text-[#578A1A] hover:bg-[#F4FBEB] shadow-xs transition-colors"
                  >
                    MTK9A2BC (Matematika)
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Official White Bee Brand Card */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-sm">
                
                {/* Official Logo Card */}
                <div className="rounded-[36px] bg-gradient-to-b from-white to-[#F4FBEB] p-7 shadow-2xl border-2 border-[#D8EEB6] text-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-36 h-36 bg-[#EBF7D9] rounded-full blur-2xl -z-0" />

                  {/* Logo Container */}
                  <div className="w-36 h-36 mx-auto rounded-3xl bg-white flex items-center justify-center p-2 shadow-lg border border-[#E0F2C2] mb-4 relative z-10">
                    <img
                      src="/whitebee-logo.png"
                      alt="White Bee Logo"
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <h3 className="text-xl font-black text-slate-900 mb-1">
                    White<span className="text-[#7AB82A]">Bee</span> School of Life
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold mb-4">
                    Pendidikan holistik, ramah anak, dan berbasis teknologi cerdas
                  </p>

                  {/* Highlights Grid */}
                  <div className="grid grid-cols-2 gap-2.5 text-left pt-3 border-t border-[#E0F2C2]">
                    <div className="bg-white p-3 rounded-2xl border border-[#E0F2C2] shadow-xs">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Akses Murid</p>
                      <p className="text-xs font-black text-[#578A1A] mt-0.5">Tanpa Password</p>
                    </div>
                    <div className="bg-white p-3 rounded-2xl border border-[#E0F2C2] shadow-xs">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Hasil Nilai</p>
                      <p className="text-xs font-black text-[#578A1A] mt-0.5">Otomatis & Akurat</p>
                    </div>
                  </div>
                </div>

                {/* Floating Safety Badge */}
                <div className="absolute -top-3 -right-3 bg-white px-3.5 py-1.5 rounded-full shadow-lg border border-[#D5EFA9] flex items-center gap-1.5 text-[11px] font-extrabold text-[#4B7914]">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#7AB82A]" />
                  <span>Timer & Autosave Aktif</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* SECTION 2: WHITE BEE GREEN CANOPY */}
      <section className="relative bg-[#7AB82A] text-white pt-16 pb-24 px-4 sm:px-6">
        {/* Wavy Cloud Canopy Top Divider */}
        <div className="absolute -top-8 left-0 right-0 h-10 overflow-hidden pointer-events-none">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-full text-[#7AB82A] fill-current">
            <path d="M0,0 C150,90 350,-40 500,60 C650,140 900,-20 1200,40 L1200,120 L0,120 Z" />
          </svg>
        </div>

        <div className="container mx-auto max-w-6xl relative z-10">
          
          {/* Section Heading */}
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="inline-block px-3 py-1 rounded-full bg-white/20 text-white text-xs font-black uppercase tracking-wider backdrop-blur-xs">
              Fitur Unggulan Sistem
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              Mengapa Ujian di White Bee Begitu Mudah?
            </h2>
            <p className="text-white/90 text-sm sm:text-base font-semibold">
              Dirancang dengan perpaduan kesederhanaan akses siswa dan fleksibilitas penuh untuk para guru pengampu.
            </p>
          </div>

          {/* 4 Big Infographic Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Card 1: 0 Akun Murid */}
            <div className="rounded-3xl bg-white/15 hover:bg-white/20 border border-white/25 p-6 backdrop-blur transition-all duration-300 flex flex-col justify-between space-y-4 hover:-translate-y-1 shadow-lg">
              <div className="space-y-3">
                <div className="h-14 w-14 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center text-2xl shadow-inner">
                  ☁️
                </div>
                <div>
                  <span className="text-3xl sm:text-4xl font-black text-white block">
                    0 Akun
                  </span>
                  <h4 className="text-base font-bold text-white/95 mt-1">
                    Bebas Lupa Password
                  </h4>
                </div>
                <p className="text-xs text-white/80 leading-relaxed font-medium">
                  Siswa tidak perlu repot registrasi, menghafal email atau password rumit. Cukup ketik kode ujian, nama, dan pilih kelas.
                </p>
              </div>
            </div>

            {/* Card 2: 1-Klik Tempel Teks */}
            <div className="rounded-3xl bg-white/15 hover:bg-white/20 border border-white/25 p-6 backdrop-blur transition-all duration-300 flex flex-col justify-between space-y-4 hover:-translate-y-1 shadow-lg">
              <div className="space-y-3">
                <div className="h-14 w-14 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center text-2xl shadow-inner">
                  ✨
                </div>
                <div>
                  <span className="text-3xl sm:text-4xl font-black text-white block">
                    1-Klik
                  </span>
                  <h4 className="text-base font-bold text-white/95 mt-1">
                    Tempel Teks Jadi Soal
                  </h4>
                </div>
                <p className="text-xs text-white/80 leading-relaxed font-medium">
                  Guru dapat langsung menempelkan teks dari WhatsApp atau dokumen, otomatis terkonversi rapi menjadi Pilihan Ganda, Benar/Salah, dan Esai.
                </p>
              </div>
            </div>

            {/* Card 3: 100% Real-time Autosave */}
            <div className="rounded-3xl bg-white/15 hover:bg-white/20 border border-white/25 p-6 backdrop-blur transition-all duration-300 flex flex-col justify-between space-y-4 hover:-translate-y-1 shadow-lg">
              <div className="space-y-3">
                <div className="h-14 w-14 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center text-2xl shadow-inner">
                  ⚡
                </div>
                <div>
                  <span className="text-3xl sm:text-4xl font-black text-white block">
                    100%
                  </span>
                  <h4 className="text-base font-bold text-white/95 mt-1">
                    Autosave Real-Time
                  </h4>
                </div>
                <p className="text-xs text-white/80 leading-relaxed font-medium">
                  Setiap jawaban siswa tersimpan detik itu juga ke Supabase Database. Ujian tetap aman meskipun gawai tertutup atau kuota putus.
                </p>
              </div>
            </div>

            {/* Card 4: Kelas Kustom & Mapel Guru */}
            <div className="rounded-3xl bg-white/15 hover:bg-white/20 border border-white/25 p-6 backdrop-blur transition-all duration-300 flex flex-col justify-between space-y-4 hover:-translate-y-1 shadow-lg">
              <div className="space-y-3">
                <div className="h-14 w-14 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center text-2xl shadow-inner">
                  🏫
                </div>
                <div>
                  <span className="text-3xl sm:text-4xl font-black text-white block">
                    Kustom
                  </span>
                  <h4 className="text-base font-bold text-white/95 mt-1">
                    Kelas & Mapel Guru
                  </h4>
                </div>
                <p className="text-xs text-white/80 leading-relaxed font-medium">
                  Mendukung fleksibilitas jenjang PAUD, TK, SD, SMP, SMA dengan kelas kustom dan mata pelajaran yang dikelola langsung oleh guru.
                </p>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#D8EEB6] bg-white py-12 px-4 sm:px-6">
        <div className="container mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl overflow-hidden bg-white p-0.5 border border-[#E0F2C2]">
              <img src="/whitebee-logo.png" alt="Logo" className="h-full w-full object-contain" />
            </div>
            <div>
              <p className="font-extrabold text-sm text-slate-900">
                White<span className="text-[#7AB82A]">Bee</span> School of Life
              </p>
              <p className="text-xs text-slate-500 font-medium">
                © 2026 Quiz White Bee School of Life. All rights reserved.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-bold text-slate-600">
            <Link href="/join" className="hover:text-[#7AB82A] transition-colors">
              Masuk Ujian
            </Link>
            <Link href="/login" className="hover:text-[#7AB82A] transition-colors">
              Portal Guru & Admin
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
