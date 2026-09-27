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

      // Navigate to identity verification
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
    <div className="min-h-screen flex flex-col bg-[#F3F9FD] text-slate-800 font-sans selection:bg-[#34A853] selection:text-white">
      <Navbar />

      {/* SECTION 1: TOP SKY HERO (Fresh Sky Blue with Question Tree Aesthetic) */}
      <section className="relative pt-12 pb-24 md:pt-16 md:pb-32 px-4 sm:px-6 overflow-hidden">
        {/* Soft Background Sky Gradient & Clouds */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#E7F4FC] via-[#F1F8FD] to-[#FFFFFF] -z-10" />

        {/* Ambient decorative floating clouds */}
        <div className="absolute top-10 left-[8%] w-28 h-12 bg-white/70 rounded-full blur-[1px] -z-10 pointer-events-none" />
        <div className="absolute top-20 right-[12%] w-36 h-14 bg-white/80 rounded-full blur-[1px] -z-10 pointer-events-none" />
        <div className="absolute top-48 left-[20%] w-24 h-10 bg-white/60 rounded-full blur-[1px] -z-10 pointer-events-none" />

        <div className="container mx-auto max-w-5xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* Left Column: Heading & Exam Code Access Pill */}
            <div className="lg:col-span-7 text-center lg:text-left space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-white/90 px-4 py-1.5 text-xs font-bold text-emerald-800 shadow-sm backdrop-blur">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Quiz White Bee • School of Life</span>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-black uppercase tracking-widest text-[#2E7D32]">
                  DO YOU KNOW?
                </p>
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 leading-[1.12]">
                  Ujian Digital Sekolah Jadi{" "}
                  <span className="text-[#2EB85C] underline decoration-[#F59E0B] decoration-wavy decoration-2">
                    Menyenangkan
                  </span>{" "}
                  & Bebas Ribet
                </h1>
              </div>

              <p className="text-base sm:text-lg text-slate-600 max-w-xl mx-auto lg:mx-0 font-medium leading-relaxed">
                Murid cukup memasukkan <strong>Kode Ujian</strong>, Nama, dan Kelas tanpa perlu mendaftar akun. Dilengkapi autosave real-time, timer terpusat, dan penilaian otomatis.
              </p>

              {/* Exam Code Input Box Card (Inspired by clean pill design) */}
              <div className="pt-2 max-w-md mx-auto lg:mx-0">
                <form
                  onSubmit={handleJoinExam}
                  className="flex flex-col sm:flex-row gap-2.5 rounded-3xl bg-white p-2.5 shadow-xl border-2 border-emerald-100 ring-4 ring-emerald-500/10"
                >
                  <div className="relative flex-1">
                    <Input
                      type="text"
                      placeholder="Ketik 8 Digit Kode Ujian..."
                      value={examCode}
                      onChange={(e) => setExamCode(e.target.value.toUpperCase())}
                      maxLength={10}
                      className="h-13 border-0 bg-transparent text-center sm:text-left text-base font-mono font-black tracking-widest uppercase placeholder:normal-case placeholder:tracking-normal placeholder:font-normal focus-visible:ring-0 text-emerald-950"
                    />
                  </div>
                  <Button
                    type="submit"
                    size="lg"
                    isLoading={isLoading}
                    className="h-13 px-7 rounded-2xl font-black text-sm gap-2 bg-[#2EB85C] hover:bg-[#279B4D] text-white shadow-lg shadow-emerald-600/30 transition-all hover:scale-102 active:scale-98"
                  >
                    <span>Mulai Ujian</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </form>

                {/* Quick Demo Code helper */}
                <div className="mt-3.5 flex flex-wrap items-center justify-center lg:justify-start gap-2 text-xs text-slate-600">
                  <span className="flex items-center gap-1 font-semibold text-emerald-800">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    Kode Ujian Aktif:
                  </span>
                  <button
                    type="button"
                    onClick={() => handleUseDemoCode("MTK9A2BC")}
                    className="font-mono font-black text-xs px-2.5 py-1 rounded-lg bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50 shadow-xs transition-colors"
                  >
                    MTK9A2BC (Matematika)
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Nature Illustration & Question Mark Tree Badge */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-sm">
                
                {/* Visual Tree & Nature Island Card */}
                <div className="rounded-3xl bg-gradient-to-b from-white to-[#EBF7EE] p-6 shadow-2xl border border-emerald-100/80 text-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-100/50 rounded-full blur-2xl -z-0" />

                  {/* Cute Question Tree Motif */}
                  <div className="w-24 h-24 mx-auto rounded-full bg-emerald-100 flex items-center justify-center text-4xl shadow-inner mb-4 relative z-10">
                    🌳
                    <span className="absolute -top-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-[#F59E0B] text-white font-black text-sm shadow">
                      ?
                    </span>
                  </div>

                  <h3 className="text-lg font-black text-slate-900 mb-1">
                    Quiz White Bee School of Life
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">
                    Pendidikan holistik, ramah anak, dan berbasis teknologi cerdas
                  </p>

                  {/* Highlights Grid */}
                  <div className="grid grid-cols-2 gap-2.5 text-left pt-2 border-t border-emerald-100">
                    <div className="bg-white p-3 rounded-2xl border border-emerald-50 shadow-xs">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Akses Murid</p>
                      <p className="text-xs font-extrabold text-emerald-700 mt-0.5">Tanpa Password</p>
                    </div>
                    <div className="bg-white p-3 rounded-2xl border border-emerald-50 shadow-xs">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Hasil Nilai</p>
                      <p className="text-xs font-extrabold text-emerald-700 mt-0.5">Otomatis & Akurat</p>
                    </div>
                  </div>
                </div>

                {/* Floating Little Bee Badge */}
                <div className="absolute -bottom-4 -left-4 bg-white px-4 py-2 rounded-2xl shadow-xl border border-emerald-100 flex items-center gap-2.5 text-xs font-bold text-slate-800">
                  <div className="h-8 w-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center text-lg">
                    🐝
                  </div>
                  <div>
                    <p className="leading-none text-[11px] text-slate-500">Karakter & Cerdas</p>
                    <p className="leading-tight text-xs text-emerald-800 font-extrabold">White Bee Learning</p>
                  </div>
                </div>

                {/* Floating Safety Badge */}
                <div className="absolute -top-4 -right-4 bg-white px-3.5 py-1.5 rounded-full shadow-lg border border-emerald-100 flex items-center gap-1.5 text-[11px] font-bold text-emerald-700">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Timer & Enkripsi Aktif</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* SECTION 2: ORGANIC GREEN CANOPY (The Lush Infographics Section from Image) */}
      <section className="relative bg-[#2EB85C] text-white pt-16 pb-24 px-4 sm:px-6">
        
        {/* Wavy Cloud Canopy Top Divider */}
        <div className="absolute -top-8 left-0 right-0 h-10 overflow-hidden pointer-events-none">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-full text-[#2EB85C] fill-current">
            <path d="M0,0 C150,90 350,-40 500,60 C650,140 900,-20 1200,40 L1200,120 L0,120 Z" />
          </svg>
        </div>

        <div className="container mx-auto max-w-6xl relative z-10">
          
          {/* Section Heading */}
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="inline-block px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-wider backdrop-blur-xs">
              Fitur Unggulan Sistem
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              Mengapa Ujian di Quiz White Bee Begitu Mudah?
            </h2>
            <p className="text-emerald-100 text-sm sm:text-base font-medium">
              Dirancang dengan perpaduan kesederhanaan akses siswa dan fleksibilitas penuh untuk para guru pengampu.
            </p>
          </div>

          {/* 4 Big Infographic Cards (Duplicating Image's Clean Style) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Card 1: Cloud & Student Faces (0 Akun Murid) */}
            <div className="rounded-3xl bg-white/10 hover:bg-white/15 border border-white/20 p-6 backdrop-blur transition-all duration-300 flex flex-col justify-between space-y-4 hover:-translate-y-1">
              <div className="space-y-3">
                {/* Organic Circular Icon Bubble */}
                <div className="h-16 w-16 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center text-3xl shadow-inner">
                  ☁️
                </div>
                <div>
                  <span className="text-3xl sm:text-4xl font-black text-white block">
                    0 Akun
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">
                    Akses Instan Murid
                  </span>
                </div>
                <p className="text-xs text-emerald-100 leading-relaxed font-normal">
                  Siswa cukup memasukkan Nama Lengkap dan memilih Kelas. Tidak ada kerumitan lupa password atau pendaftaran akun.
                </p>
              </div>

              <div className="pt-3 border-t border-white/15 flex items-center gap-1.5 text-[11px] font-bold text-white">
                <Check className="h-3.5 w-3.5 text-amber-300" />
                <span>Verifikasi Identitas Sekolah</span>
              </div>
            </div>

            {/* Card 2: Smart Device / Kettle Motif (Autosave & Timer Server) */}
            <div className="rounded-3xl bg-white/10 hover:bg-white/15 border border-white/20 p-6 backdrop-blur transition-all duration-300 flex flex-col justify-between space-y-4 hover:-translate-y-1">
              <div className="space-y-3">
                {/* Orange/Amber kettle badge */}
                <div className="h-16 w-16 rounded-2xl bg-[#F59E0B] text-white flex items-center justify-center text-3xl shadow-lg shadow-amber-600/30">
                  ⏱️
                </div>
                <div>
                  <span className="text-3xl sm:text-4xl font-black text-white block">
                    100%
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">
                    Autosave Tiap Detik
                  </span>
                </div>
                <p className="text-xs text-emerald-100 leading-relaxed font-normal">
                  Jawaban siswa tersinkronisasi otomatis ke server. Saat jaringan terputus atau halaman ter-reload, progres tetap aman.
                </p>
              </div>

              <div className="pt-3 border-t border-white/15 flex items-center gap-1.5 text-[11px] font-bold text-white">
                <Check className="h-3.5 w-3.5 text-amber-300" />
                <span>Timer Akurat Berbasis Server</span>
              </div>
            </div>

            {/* Card 3: Magic Wand / Smart Text Parser (Input Teks Jadi Soal) */}
            <div className="rounded-3xl bg-white/10 hover:bg-white/15 border border-white/20 p-6 backdrop-blur transition-all duration-300 flex flex-col justify-between space-y-4 hover:-translate-y-1">
              <div className="space-y-3">
                <div className="h-16 w-16 rounded-2xl bg-white text-emerald-700 flex items-center justify-center text-3xl shadow-lg">
                  ✨
                </div>
                <div>
                  <span className="text-3xl sm:text-4xl font-black text-white block">
                    1-Klik
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">
                    Tempel Teks Jadi Soal
                  </span>
                </div>
                <p className="text-xs text-emerald-100 leading-relaxed font-normal">
                  Guru dapat langsung mengetik atau menempelkan teks dari Word / WA. Sistem otomatis mengenali PG, Benar/Salah, dan Esai.
                </p>
              </div>

              <div className="pt-3 border-t border-white/15 flex items-center gap-1.5 text-[11px] font-bold text-white">
                <Check className="h-3.5 w-3.5 text-amber-300" />
                <span>Import Word & Excel Didukung</span>
              </div>
            </div>

            {/* Card 4: Little Bird on Branch (Multi-Attempt & Rekap Nilai) */}
            <div className="rounded-3xl bg-white/10 hover:bg-white/15 border border-white/20 p-6 backdrop-blur transition-all duration-300 flex flex-col justify-between space-y-4 hover:-translate-y-1">
              <div className="space-y-3">
                <div className="h-16 w-16 rounded-2xl bg-[#F59E0B] text-white flex items-center justify-center text-3xl shadow-lg shadow-amber-600/30">
                  📊
                </div>
                <div>
                  <span className="text-3xl sm:text-4xl font-black text-white block">
                    2-Sheet
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">
                    Laporan Nilai Excel
                  </span>
                </div>
                <p className="text-xs text-emerald-100 leading-relaxed font-normal">
                  Ekspor rekapitulasi nilai dan rincian jawaban per butir soal ke format Excel yang rapi dan siap cetak untuk rapor sekolah.
                </p>
              </div>

              <div className="pt-3 border-t border-white/15 flex items-center gap-1.5 text-[11px] font-bold text-white">
                <Check className="h-3.5 w-3.5 text-amber-300" />
                <span>Metode Nilai Tertinggi / Terakhir</span>
              </div>
            </div>

          </div>

          {/* Bottom Call to Action inside Green Canvas */}
          <div className="mt-16 rounded-3xl bg-white text-slate-900 p-8 sm:p-10 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                Siap Mengadakan Ujian Hari Ini?
              </h3>
              <p className="text-sm text-slate-600 font-medium">
                Masuk ke portal guru untuk membuat bank soal dan menerbitkan kode ujian kelas Anda.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
              <Link href="/login">
                <Button size="lg" className="rounded-2xl font-black bg-[#2EB85C] hover:bg-[#279B4D] text-white shadow-md">
                  <span>Masuk Portal Guru & Admin</span>
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
              <Link href="/join">
                <Button size="lg" variant="outline" className="rounded-2xl font-bold border-slate-300">
                  <span>Halaman Peserta Ujian</span>
                </Button>
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* FOOTER */}
      <footer className="mt-auto py-10 bg-[#1E7E34] text-white/90 text-xs border-t border-white/10">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-white text-emerald-700 flex items-center justify-center font-black text-sm">
              🐝
            </div>
            <div>
              <p className="font-extrabold text-sm text-white">Quiz White Bee School of Life</p>
              <p className="text-[11px] text-emerald-200">Sistem Ujian Online Terintegrasi & Ramah Pendidikan</p>
            </div>
          </div>

          <p className="text-emerald-200 text-xs">
            © {new Date().getFullYear()} Quiz White Bee School of Life. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
