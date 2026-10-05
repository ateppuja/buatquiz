"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogIn, ArrowLeft, Mail, Sparkles, UserPlus, User, CheckCircle2, ArrowRight, Loader2 } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { toast } from "sonner";

interface GoogleAccountItem {
  name: string;
  email: string;
  avatarColor?: string;
}

const DEFAULT_ACCOUNTS: GoogleAccountItem[] = [
  { name: "Atep Puja", email: "ateppuja1@gmail.com", avatarColor: "bg-amber-600" },
  { name: "atep puja", email: "ateppuja2@gmail.com", avatarColor: "bg-sky-600" },
];

function LoginForm() {
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Google Account Chooser Modal State
  const [isChooserOpen, setIsChooserOpen] = useState(false);
  const [savedAccounts, setSavedAccounts] = useState<GoogleAccountItem[]>(DEFAULT_ACCOUNTS);
  const [isAddingOtherAccount, setIsAddingOtherAccount] = useState(false);
  const [customGmail, setCustomGmail] = useState("");
  const [customName, setCustomName] = useState("");
  const [activeLoggingEmail, setActiveLoggingEmail] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();

  // Load stored accounts on client mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("whitebee_google_accounts");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSavedAccounts(parsed);
        }
      }
    } catch {
      // fallback to default
    }
  }, []);

  // Check URL errors
  useEffect(() => {
    const error = searchParams.get("error");
    if (error === "google_cancelled") {
      toast.info("Proses autentikasi Google dibatalkan.");
    } else if (error === "account_inactive") {
      toast.error("Akun guru Anda telah dinonaktifkan oleh administrator sekolah.");
    }
  }, [searchParams]);

  // Execute Direct Google Login for chosen account
  const executeGoogleLogin = async (email: string, name?: string) => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      toast.error("Alamat email Google tidak valid.");
      return;
    }

    setActiveLoggingEmail(cleanEmail);
    try {
      const res = await fetch("/api/v1/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cleanEmail,
          name: name ? name.trim() : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.error?.message || "Gagal masuk menggunakan akun Google.");
        setActiveLoggingEmail(null);
        return;
      }

      // Save to recent accounts list
      try {
        const userDisplayName = data.data?.user?.name || name || cleanEmail.split("@")[0];
        const existingIdx = savedAccounts.findIndex((a) => a.email.toLowerCase() === cleanEmail);
        let updatedList: GoogleAccountItem[];
        if (existingIdx >= 0) {
          updatedList = [...savedAccounts];
          updatedList[existingIdx] = { ...updatedList[existingIdx], name: userDisplayName };
        } else {
          updatedList = [
            ...savedAccounts,
            {
              name: userDisplayName,
              email: cleanEmail,
              avatarColor: "bg-[#7AB82A]",
            },
          ];
        }
        setSavedAccounts(updatedList);
        localStorage.setItem("whitebee_google_accounts", JSON.stringify(updatedList));
      } catch {}

      setIsChooserOpen(false);
      toast.success(
        data.data?.isNewUser
          ? `🎉 Akun Guru Baru berhasil dibuat! Selamat datang, ${data.data.user.name}`
          : `👋 Selamat datang kembali, ${data.data.user.name}`
      );

      if (data.data.user.role === "ADMIN") {
        router.push("/admin/dashboard");
      } else {
        router.push("/teacher/dashboard");
      }
      router.refresh();
    } catch {
      toast.error("Terjadi kesalahan pada server saat autentikasi Google.");
      setActiveLoggingEmail(null);
    }
  };

  // Handle standard username/password login
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
    <div
      className="min-h-screen flex flex-col justify-center items-center p-4 bg-cover bg-center bg-no-repeat relative text-slate-800"
      style={{ backgroundImage: "url('/bg-hero.jpg')" }}
    >
      {/* Soft Nature Overlay for High Readability & Contrast */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#EBF7D9]/85 via-[#F6FCED]/88 to-[#FFFFFF]/92 backdrop-blur-[1.5px] -z-0 pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
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

        <Card className="shadow-2xl border-2 border-[#D8EEB6]/90 rounded-[32px] bg-white/95 backdrop-blur-xl">
          <CardHeader className="space-y-1 text-center pb-2 pt-6">
            <CardTitle className="text-2xl font-black text-slate-900">Portal Guru & Admin</CardTitle>
            <CardDescription className="text-xs text-slate-500 font-semibold">
              Masuk atau buat akun guru baru untuk mengelola ujian & bank soal
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pb-6">
            {/* Quick Google Sign In / Registration Button */}
            <div className="p-3 bg-gradient-to-br from-[#F5FAED] to-[#EAF5D8] rounded-2xl border border-[#D1EBB0] space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center p-1 bg-[#7AB82A] text-white rounded-lg">
                  <Sparkles className="h-3.5 w-3.5" />
                </span>
                <span className="text-xs font-extrabold text-slate-800">
                  Guru Baru? Buat Akun Instan
                </span>
              </div>
              <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                Untuk guru baru atau guru yang sudah ada, masuk dengan 1-klik menggunakan akun <b>Google (Gmail)</b>.
              </p>
              
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddingOtherAccount(false);
                  setIsChooserOpen(true);
                }}
                className="w-full h-12 rounded-xl border-2 border-slate-200 hover:border-[#7AB82A] bg-white hover:bg-slate-50 text-slate-800 font-black shadow-sm flex items-center justify-center gap-3 transition-all active:scale-[0.99]"
              >
                {/* Google Multi-Color SVG Icon */}
                <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span className="text-sm">Masuk / Daftar dengan Akun Google</span>
              </Button>
            </div>

            {/* Divider */}
            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                atau gunakan akun terdaftar
              </span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

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

      {/* Official-Style Google Account Chooser Modal */}
      <Dialog open={isChooserOpen} onOpenChange={setIsChooserOpen}>
        <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <svg className="h-6 w-6 flex-shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span className="text-sm font-bold text-slate-600">Login dengan Google</span>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-1">
              Pilih akun
            </h2>
            <p className="text-xs text-slate-600 font-medium">
              Lanjutkan ke <span className="font-extrabold text-[#578A1A]">lms.whitebeezone.my.id</span>
            </p>
          </div>

          {/* Account Selection List */}
          {!isAddingOtherAccount ? (
            <div className="space-y-1 divide-y divide-slate-100 mb-6">
              {savedAccounts.map((acc, idx) => {
                const isLoggingThis = activeLoggingEmail === acc.email.toLowerCase();
                const initials = (acc.name || acc.email).substring(0, 2).toUpperCase();
                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={activeLoggingEmail !== null}
                    onClick={() => executeGoogleLogin(acc.email, acc.name)}
                    className="w-full flex items-center justify-between p-3.5 hover:bg-slate-50 active:bg-slate-100 rounded-2xl transition-all text-left group"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm flex-shrink-0 ${
                          acc.avatarColor || "bg-[#7AB82A]"
                        }`}
                      >
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-slate-900 group-hover:text-[#578A1A] transition-colors truncate">
                          {acc.name}
                        </div>
                        <div className="text-xs text-slate-500 font-medium truncate">
                          {acc.email}
                        </div>
                      </div>
                    </div>
                    {isLoggingThis ? (
                      <Loader2 className="h-5 w-5 animate-spin text-[#7AB82A] flex-shrink-0" />
                    ) : (
                      <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-[#7AB82A] group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                    )}
                  </button>
                );
              })}

              {/* Add other account button */}
              <button
                type="button"
                disabled={activeLoggingEmail !== null}
                onClick={() => setIsAddingOtherAccount(true)}
                className="w-full flex items-center gap-3.5 p-3.5 hover:bg-slate-50 active:bg-slate-100 rounded-2xl transition-all text-left group"
              >
                <div className="h-10 w-10 rounded-full border border-slate-300 flex items-center justify-center text-slate-500 group-hover:border-[#7AB82A] group-hover:text-[#7AB82A] transition-colors flex-shrink-0">
                  <UserPlus className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-800 group-hover:text-[#7AB82A] transition-colors">
                    Gunakan akun lain
                  </div>
                  <div className="text-xs text-slate-400">
                    Masuk atau daftar dengan akun Gmail baru
                  </div>
                </div>
              </button>
            </div>
          ) : (
            /* Form for adding a new Gmail account */
            <form
              onSubmit={(e) => {
                e.preventDefault();
                executeGoogleLogin(customGmail, customName);
              }}
              className="space-y-4 mb-6"
            >
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-700">
                  Alamat Email Gmail <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Input
                    type="email"
                    placeholder="contoh: guru.baru@gmail.com"
                    value={customGmail}
                    onChange={(e) => setCustomGmail(e.target.value)}
                    required
                    autoFocus
                    className="h-12 pl-10 rounded-2xl border-2 border-[#D5EFA9] focus-visible:ring-[#7AB82A] text-sm"
                  />
                  <Mail className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-700">
                  Nama Lengkap Guru (Opsional)
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Contoh: Siti Rahmawati, S.Pd."
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="h-12 pl-10 rounded-2xl border-2 border-slate-200 focus-visible:ring-[#7AB82A] text-sm"
                  />
                  <User className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsAddingOtherAccount(false)}
                  disabled={activeLoggingEmail !== null}
                  className="h-11 rounded-xl text-xs font-bold text-slate-500"
                >
                  Kembali ke Daftar
                </Button>
                <Button
                  type="submit"
                  isLoading={activeLoggingEmail !== null}
                  className="flex-1 h-11 rounded-xl bg-[#7AB82A] hover:bg-[#6AA421] text-white font-black text-sm shadow-md shadow-[#7AB82A]/30 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Lanjutkan Masuk</span>
                </Button>
              </div>
            </form>
          )}

          {/* Footer disclaimer */}
          <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-500 leading-relaxed text-center sm:text-left">
            Untuk melanjutkan, Google akan membagikan nama, alamat email, dan preferensi bahasa Anda kepada{" "}
            <b>lms.whitebeezone.my.id</b>.
            <div className="flex items-center justify-center sm:justify-start gap-3 mt-3 text-slate-400 font-semibold text-[10px]">
              <span className="hover:text-slate-600 cursor-pointer">Bantuan</span>
              <span>·</span>
              <span className="hover:text-slate-600 cursor-pointer">Privasi</span>
              <span>·</span>
              <span className="hover:text-slate-600 cursor-pointer">Persyaratan</span>
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#F6FCED]">
          <div className="text-center font-bold text-slate-600 animate-pulse">
            Memuat halaman login...
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}



