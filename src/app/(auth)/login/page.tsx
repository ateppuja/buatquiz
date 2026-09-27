"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GraduationCap, LogIn, Shield, BookOpen, ArrowLeft, KeyRound } from "lucide-react";
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
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-slate-50 dark:bg-slate-950">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-4 hover:opacity-80 transition-opacity">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
              <GraduationCap className="h-6 w-6" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">ExamCode School</span>
          </Link>
        </div>

        <Card className="shadow-xl border-slate-200 dark:border-slate-800">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold">Portal Guru & Admin</CardTitle>
            <CardDescription>
              Masuk untuk mengelola ujian, bank soal, dan hasil penilaian sekolah
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Username atau Email
                </label>
                <Input
                  type="text"
                  placeholder="admin atau guru@sekolah.sch.id"
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  required
                  className="h-11"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Kata Sandi
                </label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11"
                />
              </div>

              <Button type="submit" size="lg" isLoading={isLoading} className="w-full font-semibold gap-2">
                <LogIn className="h-4 w-4" />
                <span>Masuk ke Dashboard</span>
              </Button>
            </form>

            {/* Quick Demo Credentials Fill Buttons */}
            <div className="mt-6 border-t border-border pt-4">
              <p className="text-xs font-semibold text-muted-foreground text-center mb-2.5">
                Akun Demo untuk Pengujian:
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickFill("admin", "admin123")}
                  className="flex items-center justify-center gap-1.5 p-2 rounded-lg border border-amber-200 bg-amber-50/60 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 text-xs font-semibold hover:bg-amber-100 transition-colors"
                >
                  <Shield className="h-3.5 w-3.5" />
                  <span>Admin Sekolah</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill("budi", "guru123")}
                  className="flex items-center justify-center gap-1.5 p-2 rounded-lg border border-blue-200 bg-blue-50/60 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 text-xs font-semibold hover:bg-blue-100 transition-colors"
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  <span>Pak Budi (Guru)</span>
                </button>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Link href="/join" className="text-xs text-primary font-medium hover:underline inline-flex items-center gap-1">
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
