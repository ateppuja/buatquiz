"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogIn, ArrowLeft } from "lucide-react";
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
        toast.error(data.error?.message || "Login gagal. Periksa username dan password Anda.");
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

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-gradient-to-b from-[#EBF7D9] via-[#F6FCED] to-[#FFFFFF] text-slate-800">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-3 mb-2 hover:scale-[1.02] transition-transform">
            <div className="h-14 w-14 rounded-2xl overflow-hidden bg-white p-1 shadow-md border border-[#E0F2C2]">
              <img
                src="/whitebee-logo.png"
                alt="White Bee Logo"
                className="h-full w-full object-contain"
              />
            </div>
            <div className="text-left">
              <span className="text-xl font-black tracking-tight text-slate-900 block">
                White<span className="text-[#7AB82A]">Bee</span>
              </span>
              <span className="text-xs font-extrabold text-[#578A1A]">School of Life</span>
            </div>
          </Link>
        </div>

        <Card className="shadow-2xl border-2 border-[#D8EEB6] rounded-[32px] bg-white/95 backdrop-blur">
          <CardHeader className="space-y-1 text-center pb-2 pt-6">
            <CardTitle className="text-2xl font-black text-slate-900">Portal Guru & Admin</CardTitle>
            <CardDescription className="text-xs text-slate-500 font-semibold">
              Masuk untuk mengelola ujian, bank soal, dan laporan penilaian
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pb-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-[#4B7914] mb-1">
                  Username atau Email
                </label>
                <Input
                  type="text"
                  placeholder="Masukkan username atau email"
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  required
                  className="h-12 rounded-2xl border-2 border-[#D5EFA9] focus-visible:ring-[#7AB82A]"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-[#4B7914] mb-1">
                  Password
                </label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 rounded-2xl border-2 border-[#D5EFA9] focus-visible:ring-[#7AB82A]"
                />
              </div>

              <Button
                type="submit"
                size="lg"
                isLoading={isLoading}
                className="w-full h-12 font-black rounded-2xl gap-2 bg-[#7AB82A] hover:bg-[#6AA421] text-white shadow-lg shadow-[#7AB82A]/30 text-base active:scale-98 transition-all"
              >
                <LogIn className="h-4 w-4" />
                <span>Masuk Sekarang</span>
              </Button>
            </form>

            <div className="pt-2 text-center border-t border-[#E0F2C2] mt-4">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#7AB82A] transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Kembali ke Halaman Masuk Ujian Murid</span>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
