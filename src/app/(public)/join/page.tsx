"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layouts/Navbar";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KeyRound, ArrowRight, Sparkles } from "lucide-react";
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
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl border-slate-200 dark:border-slate-800">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-3">
              <KeyRound className="h-6 w-6" />
            </div>
            <CardTitle className="text-2xl font-bold">Masuk Ujian Online</CardTitle>
            <CardDescription>
              Masukkan 8 digit kode ujian yang diberikan oleh guru mata pelajaran Anda.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleLookup} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Kode Ujian
                </label>
                <Input
                  type="text"
                  placeholder="Contoh: MTK9A2BC"
                  value={examCode}
                  onChange={(e) => setExamCode(e.target.value.toUpperCase())}
                  maxLength={10}
                  className="h-12 text-center text-lg font-mono font-bold tracking-widest uppercase"
                  autoFocus
                />
              </div>

              <Button type="submit" size="lg" isLoading={isLoading} className="w-full font-semibold gap-2">
                <span>Lanjutkan</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>

            <div className="mt-6 rounded-lg bg-blue-50 dark:bg-blue-950/40 p-3 border border-blue-100 dark:border-blue-900/50 flex items-start gap-2.5">
              <Sparkles className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-800 dark:text-blue-300">
                Ujian contoh yang aktif saat ini dapat diakses dengan kode: <strong className="font-mono">MTK9A2BC</strong>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
