"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Building2, ShieldCheck, Activity, Database, Clock, KeyRound, Lock, User, CheckCircle2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

export default function AdminSettingsPage() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Profile & Password Form state
  const [adminName, setAdminName] = useState("");
  const [adminUsername, setAdminUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const [resStats, resMe] = await Promise.all([
          fetch(`/api/v1/admin/stats?_t=${Date.now()}`, { cache: "no-store" }),
          fetch(`/api/v1/auth/me?_t=${Date.now()}`, { cache: "no-store" }),
        ]);
        const [dataStats, dataMe] = await Promise.all([resStats.json(), resMe.json()]);

        if (dataStats.success) setStats(dataStats.data);
        if (dataMe.success && dataMe.data) {
          setAdminName(dataMe.data.name || "Administrator Sekolah");
          setAdminUsername(dataMe.data.username || "admin");
        }
      } catch {
        toast.error("Gagal memuat pengaturan.");
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!adminName.trim() || !adminUsername.trim()) {
      toast.error("Nama dan username tidak boleh kosong.");
      return;
    }

    if (newPassword) {
      if (!currentPassword) {
        toast.error("Masukkan password saat ini untuk keamanan.");
        return;
      }
      if (newPassword.length < 6) {
        toast.error("Password baru minimal 6 karakter.");
        return;
      }
      if (newPassword !== confirmPassword) {
        toast.error("Konfirmasi password baru tidak cocok.");
        return;
      }
    }

    setIsSavingPassword(true);
    try {
      const res = await fetch("/api/v1/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: adminName.trim(),
          username: adminUsername.trim(),
          currentPassword: currentPassword || undefined,
          newPassword: newPassword || undefined,
          confirmPassword: confirmPassword || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "Akun & Password berhasil diperbarui!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        // Reload audit logs
        const resStats = await fetch(`/api/v1/admin/stats?_t=${Date.now()}`, { cache: "no-store" });
        const dataStats = await resStats.json();
        if (dataStats.success) setStats(dataStats.data);
      } else {
        toast.error(data.error?.message || "Gagal memperbarui password.");
      }
    } catch {
      toast.error("Terjadi kesalahan sistem saat memperbarui password.");
    } finally {
      setIsSavingPassword(false);
    }
  };

  if (isLoading || !stats) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-xs text-muted-foreground font-semibold">Memuat pengaturan sekolah...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="border-b border-[#E0F2C2] pb-5">
        <h1 className="text-2xl font-black tracking-tight text-slate-900">
          Pengaturan Sekolah & Akun Admin
        </h1>
        <p className="text-xs font-semibold text-slate-500 mt-0.5">
          Ubah password login admin, kelola profil, informasi sekolah, dan riwayat audit aktivitas
        </p>
      </div>

      {/* Account & Password Settings Card */}
      <Card className="p-6 shadow-md border-2 border-[#D8EEB6] rounded-[28px] bg-white space-y-5">
        <div className="flex items-center gap-3 border-b border-[#E0F2C2] pb-4">
          <div className="h-11 w-11 rounded-2xl bg-[#F4FBEB] text-[#7AB82A] border border-[#D8EEB6] flex items-center justify-center shadow-sm">
            <KeyRound className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900">
              Ubah Password & Profil Administrator
            </h3>
            <p className="text-xs font-semibold text-slate-500">
              Kelola username dan password yang digunakan untuk masuk ke panel admin
            </p>
          </div>
        </div>

        <form onSubmit={handleUpdatePassword} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-black uppercase tracking-wider text-[#4B7914] mb-1.5">
                Nama Administrator <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  required
                  placeholder="Contoh: Administrator Sekolah"
                  className="pl-10 h-11 text-xs rounded-xl border-2 border-[#D5EFA9] focus-visible:ring-[#7AB82A]"
                />
              </div>
            </div>

            <div>
              <label className="block font-black uppercase tracking-wider text-[#4B7914] mb-1.5">
                Username Login <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  required
                  placeholder="Contoh: admin"
                  className="pl-10 h-11 text-xs font-mono rounded-xl border-2 border-[#D5EFA9] focus-visible:ring-[#7AB82A]"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-[#E0F2C2] pt-4 mt-2">
            <h4 className="font-black text-xs text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Lock className="h-4 w-4 text-[#7AB82A]" />
              <span>Ganti Password (Kosongkan bila tidak ingin mengubah password)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-black uppercase tracking-wider text-[#4B7914] mb-1.5">
                  Password Saat Ini
                </label>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Masukkan password lama"
                  className="h-11 text-xs rounded-xl border-2 border-[#D5EFA9] focus-visible:ring-[#7AB82A]"
                />
              </div>

              <div>
                <label className="block font-black uppercase tracking-wider text-[#4B7914] mb-1.5">
                  Password Baru
                </label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="h-11 text-xs rounded-xl border-2 border-[#D5EFA9] focus-visible:ring-[#7AB82A]"
                />
              </div>

              <div>
                <label className="block font-black uppercase tracking-wider text-[#4B7914] mb-1.5">
                  Ulangi Password Baru
                </label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ketik ulang password baru"
                  className="h-11 text-xs rounded-xl border-2 border-[#D5EFA9] focus-visible:ring-[#7AB82A]"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end pt-2">
            <Button
              type="submit"
              isLoading={isSavingPassword}
              className="font-black bg-[#7AB82A] hover:bg-[#6AA421] text-white rounded-xl shadow-md h-11 px-6 text-xs gap-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Simpan Perubahan Akun & Password</span>
            </Button>
          </div>
        </form>
      </Card>

      {/* School Information Card */}
      <Card className="p-6 shadow-md border-2 border-[#D8EEB6] rounded-[28px] bg-white space-y-4">
        <div className="flex items-center gap-3 border-b border-[#E0F2C2] pb-3">
          <div className="h-10 w-10 rounded-2xl bg-[#F4FBEB] text-[#7AB82A] border border-[#D8EEB6] flex items-center justify-center">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900">
              {stats.school?.name || "Quiz White Bee School of Life"}
            </h3>
            <p className="text-xs font-semibold text-slate-500 font-mono">
              NPSN: {stats.school?.npsn || "10293847"} • Tahun Ajaran 2026/2027
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
          <div>
            <label className="block font-black uppercase tracking-wider text-[#4B7914] mb-1">Zona Waktu Sistem Ujian</label>
            <Input value={stats.school?.timezone || "Asia/Jakarta (WIB - UTC+7)"} disabled className="h-10 bg-[#F4FBEB] text-slate-700 text-xs font-mono rounded-xl border-[#D5EFA9]" />
          </div>
          <div>
            <label className="block font-black uppercase tracking-wider text-[#4B7914] mb-1">Alamat Sekolah</label>
            <Input value={stats.school?.address || "Jl. Pendidikan No. 45, Jakarta"} disabled className="h-10 bg-[#F4FBEB] text-slate-700 text-xs rounded-xl border-[#D5EFA9]" />
          </div>
          <div>
            <label className="block font-black uppercase tracking-wider text-[#4B7914] mb-1">Metode Autentikasi Murid</label>
            <Input value="Kode Ujian 8-Karakter + Verifikasi Nama & Kelas" disabled className="h-10 bg-[#F4FBEB] text-slate-700 text-xs rounded-xl border-[#D5EFA9]" />
          </div>
          <div>
            <label className="block font-black uppercase tracking-wider text-[#4B7914] mb-1">Status Enkripsi Data</label>
            <Input value="Aktif (Bcrypt + JWT Signature + Server Sync)" disabled className="h-10 bg-[#F4FBEB] text-emerald-800 font-black text-xs rounded-xl border-[#D5EFA9]" />
          </div>
        </div>
      </Card>

      {/* Audit Log Activity History (FR-001) */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-foreground flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          <span>Audit Log Aktivitas Penting</span>
        </h2>

        <Card className="shadow-sm border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/60 text-muted-foreground uppercase font-semibold border-b border-border">
                <tr>
                  <th className="py-2.5 px-4">Waktu</th>
                  <th className="py-2.5 px-4">Pengguna</th>
                  <th className="py-2.5 px-4">Aksi</th>
                  <th className="py-2.5 px-4">Rincian Aktivitas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {stats.recentLogs?.map((log: any) => (
                  <tr key={log.id} className="hover:bg-muted/30">
                    <td className="py-2.5 px-4 text-muted-foreground whitespace-nowrap">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-foreground">
                      {log.user?.name || "Administrator"}
                    </td>
                    <td className="py-2.5 px-4">
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {log.action}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-4 text-muted-foreground font-mono text-[11px] max-w-sm truncate">
                      {log.details || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
