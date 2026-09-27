"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layouts/Navbar";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KeyRound, ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";
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
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#EBF7D9] via-[#F6FCED] to-[#FFFFFF] text-slate-800">
      <Navbar />

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <Card className="w-full max-w-md shadow-2xl border-2 border-[#D8EEB6] rounded-[32px] bg-white/95 backdrop-blur">
          <CardHeader className="text-center pb-2 pt-6">
            <div className="mx-auto flex h-18 w-18 items-center justify-center rounded-2xl bg-white p-1.5 border border-[#E0F2C2] mb-3 shadow-md">
              <img
                src="/whitebee-logo.png"
                alt="White Bee Logo"
                className="h-full w-full object-contain"
              />
            </div>
            <CardTitle className="text-2xl font-black text-slate-900">Masuk Ujian Online</CardTitle>
            <CardDescription className="text-xs text-slate-500 font-semibold max-w-xs mx-auto">
              Masukkan 8 digit kode ujian yang diberikan oleh guru mata pelajaran White Bee School of Life
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-4 pb-6 space-y-4">
            <form onSubmit={handleLookup} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-[#4B7914] mb-1.5 text-center">
                  KODE AKSES UJIAN
                </label>
                <Input
                  type="text"
                  placeholder="Contoh: MTK9A2BC"
                  value={examCode}
                  onChange={(e) => setExamCode(e.target.value.toUpperCase())}
                  maxLength={10}
                  className="h-14 text-center text-2xl font-mono font-black tracking-widest uppercase rounded-2xl border-2 border-[#D5EFA9] focus-visible:ring-[#7AB82A] text-slate-900"
                  autoFocus
                />
              </div>

              <Button
                type="submit"
                size="lg"
                isLoading={isLoading}
                className="w-full h-12 font-black rounded-2xl gap-2 bg-[#7AB82A] hover:bg-[#6AA421] text-white shadow-lg shadow-[#7AB82A]/30 text-base active:scale-98 transition-all"
              >
                <span>Mulai Ujian</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>

            <div className="mt-4 rounded-2xl bg-[#F4FBEB] p-3.5 border border-[#D8EEB6] flex items-start gap-2.5 text-xs text-[#4B7914]">
              <Sparkles className="h-4 w-4 text-[#7AB82A] shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Kode Contoh Ujian Aktif:</p>
                <p className="mt-0.5 font-medium">
                  Klik untuk mencoba:{" "}
                  <button
                    type="button"
                    onClick={() => setExamCode("MTK9A2BC")}
                    className="font-mono font-black underline text-[#578A1A] hover:text-slate-900"
                  >
                    MTK9A2BC
                  </button>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
