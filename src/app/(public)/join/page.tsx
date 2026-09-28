"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layouts/Navbar";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function JoinPage() {
  const [examCode, setExamCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLookup = async (e: React.FormEvent) => {
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
      className="min-h-screen flex flex-col bg-cover bg-center bg-no-repeat relative text-slate-800"
      style={{ backgroundImage: "url('/bg-hero.jpg')" }}
    >
      {/* Soft Nature Overlay for High Readability & Contrast */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#EBF7D9]/85 via-[#F6FCED]/88 to-[#FFFFFF]/92 backdrop-blur-[1.5px] -z-0 pointer-events-none" />

      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />

        <div className="flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
          <Card className="w-full max-w-lg shadow-2xl border-2 border-[#D8EEB6]/90 rounded-[36px] bg-white/95 backdrop-blur-xl p-2 sm:p-4 text-center">
            <CardHeader className="text-center pb-2 pt-4">
              <div className="mx-auto flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center rounded-3xl bg-white p-2 border-2 border-[#E0F2C2] mb-3 shadow-lg">
                <img
                  src="/whitebee-logo.png"
                  alt="White Bee Logo"
                  className="h-full w-full object-contain"
                />
              </div>
              <CardTitle className="text-2xl sm:text-3xl font-black text-slate-900">
                White<span className="text-[#7AB82A]">Bee</span> School of Life
              </CardTitle>

              {/* Prayer message banner */}
              <div className="mt-3 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-2xl bg-[#F4FBEB] border-2 border-[#D5EFA9] text-xs sm:text-sm font-black text-[#4B7914]">
                <span>🤲</span>
                <span>Berdoa terlebih dahulu sebelum mengerjakan Kuis</span>
              </div>
            </CardHeader>

            <CardContent className="pt-4 pb-6 space-y-4">
              <form onSubmit={handleLookup} className="space-y-3">
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
                  className="w-full h-13 font-black rounded-2xl gap-2 bg-[#7AB82A] hover:bg-[#6AA421] text-white shadow-xl shadow-[#7AB82A]/30 text-base active:scale-98 transition-all"
                >
                  <span>Mulai Ujian</span>
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
