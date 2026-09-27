"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Building2, ShieldCheck, Activity, Database, Clock } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

export default function AdminSettingsPage() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/v1/admin/stats");
        const data = await res.json();
        if (data.success) setStats(data.data);
      } catch {
        toast.error("Gagal memuat pengaturan.");
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, []);

  if (isLoading || !stats) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-xs text-muted-foreground">Memuat pengaturan sekolah...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="border-b border-border pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Pengaturan Sekolah & Audit Log
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Informasi sekolah, konfigurasi zona waktu ujian, serta riwayat audit aktivitas sistem
        </p>
      </div>

      {/* School Information Card */}
      <Card className="p-5 shadow-sm border-border space-y-4">
        <div className="flex items-center gap-3 border-b border-border pb-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">
              {stats.school?.name || "Quiz White Bee School of Life"}
            </h3>
            <p className="text-xs text-muted-foreground font-mono">
              NPSN: {stats.school?.npsn || "10293847"} • Tahun Ajaran 2026/2027
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-muted-foreground mb-1">Zona Waktu Sistem Ujian</label>
            <Input value={stats.school?.timezone || "Asia/Jakarta (WIB - UTC+7)"} disabled className="h-9 bg-muted/50 text-xs font-mono" />
          </div>
          <div>
            <label className="block font-semibold text-muted-foreground mb-1">Alamat Sekolah</label>
            <Input value={stats.school?.address || "Jl. Pendidikan No. 45, Jakarta"} disabled className="h-9 bg-muted/50 text-xs" />
          </div>
          <div>
            <label className="block font-semibold text-muted-foreground mb-1">Metode Autentikasi Murid</label>
            <Input value="Kode Ujian 8-Karakter + Verifikasi Nama & Kelas" disabled className="h-9 bg-muted/50 text-xs" />
          </div>
          <div>
            <label className="block font-semibold text-muted-foreground mb-1">Status Enkripsi Data</label>
            <Input value="Aktif (Bcrypt + JWT Signature + Server Sync)" disabled className="h-9 bg-muted/50 text-xs text-emerald-600 font-bold" />
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
