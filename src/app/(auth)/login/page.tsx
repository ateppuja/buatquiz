"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogIn, Shield, BookOpen, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameOrEmail || !password) {
      toast.error("Masukkan username/email dan password.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usernameOrEmail, password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.error?.message || "Login gagal.");
        setIsLoading(false);
        return;
      }

      toast.success(`Selamat datang, ${data.data.user.name}`);

      if (data.data.user.role === "ADMIN") {
        router.push("/admin/dashboard");
      } else {
        router.push("/teacher/dashboard");
      }
      router.refresh();
    } catch {
      toast.error("Terjadi kesalahan pada server saat login.");
      setIsLoading(false);
    }
  };

  const handleQuickFill = (u: string, p: string) => {
    setUsernameOrEmail(u);
    setPassword(p);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-gradient-to-b from-[#EAF6FE] via-[#F4FAFF] to-[#FFFFFF] text-slate-800">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-2 hover:scale-102 transition-transform">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2EB85C] text-white shadow-lg shadow-emerald-500/20 text-2xl font-bold">
              🐝
            </div>
            <div className="text-left">
              <span className="text-xl font-black tracking-tight text-slate-900 block">
                Quiz White Bee
              </span>
              <span className="text-xs font-bold text-emerald-800">School of Life</span>
            </div>
          </Link>
        </div>

        <Card className="shadow-2xl border-2 border-emerald-100 rounded-3xl bg-white/95 backdrop-blur">
          <CardHeader className="space-y-1 text-center pb-2 pt-6">
            <CardTitle className="text-2xl font-black text-slate-900">Portal Guru & Admin</CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Masuk untuk mengelola ujian, bank soal, dan laporan penilaian
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pb-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-emerald-800 mb-1">
                  Username atau Email
                </label>
                <Input
                  type="text"
                  placeholder="admin atau budi"
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  required
                  className="h-11 rounded-xl border-emerald-200 focus-visible:ring-emerald-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-emerald-800 mb-1">
                  Kata Sandi
                </label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 rounded-xl border-emerald-200 focus-visible:ring-emerald-500"
                />
              </div>

              <Button
                type="submit"
                size="lg"
                isLoading={isLoading}
                className="w-full font-black rounded-xl gap-2 bg-[#2EB85C] hover:bg-[#279B4D] text-white shadow-md shadow-emerald-600/30"
              >
                <LogIn className="h-4 w-4" />
                <span>Masuk ke Dashboard</span>
              </Button>
            </form>

            {/* Quick Demo Credentials Fill Buttons */}
            <div className="mt-6 border-t border-emerald-100 pt-4">
              <p className="text-xs font-bold text-slate-500 text-center mb-2.5">
                Pilih Akun Demo untuk Pengujian Cepat:
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickFill("admin", "admin123")}
                  className="flex items-center justify-center gap-1.5 p-2 rounded-xl border border-amber-200 bg-amber-50 text-amber-900 text-xs font-bold hover:bg-amber-100 transition-colors shadow-xs"
                >
                  <Shield className="h-3.5 w-3.5 text-amber-600" />
                  <span>Admin Sekolah</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill("budi", "guru123")}
                  className="flex items-center justify-center gap-1.5 p-2 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-900 text-xs font-bold hover:bg-emerald-100 transition-colors shadow-xs"
                >
                  <BookOpen className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Pak Budi (Guru)</span>
                </button>
              </div>
            </div>

            <div className="mt-4 text-center">
              <Link href="/join" className="text-xs text-[#2EB85C] font-bold hover:underline inline-flex items-center gap-1">
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Masuk sebagai Murid (Gunakan Kode Ujian)</span>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
