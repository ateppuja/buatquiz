"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  GraduationCap,
  Layers,
  FileSpreadsheet,
  Clock,
  ShieldCheck,
  ArrowRight,
  Activity,
  PlusCircle,
  Upload,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch("/api/v1/admin/stats");
        const data = await res.json();
        if (data.success) {
          setStats(data.data);
        }
      } catch {
        toast.error("Gagal memuat statistik sekolah.");
      } finally {
        setIsLoading(false);
      }
    }
    loadStats();
  }, []);

  if (isLoading || !stats) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-xs text-muted-foreground">Memuat statistik administrator...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Administrator Portal</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Pusat Kendali Administrasi Sekolah
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Kelola data guru, murid, kelas, mata pelajaran, serta pantau seluruh ujian sekolah
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/admin/students">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs font-semibold">
              <Upload className="h-3.5 w-3.5" />
              <span>Import Siswa</span>
            </Button>
          </Link>
          <Link href="/admin/teachers">
            <Button size="sm" className="gap-1.5 text-xs font-bold shadow">
              <PlusCircle className="h-3.5 w-3.5" />
              <span>Tambah Guru</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="p-4 shadow-sm border-border bg-card">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase block">Total Guru</span>
          <p className="text-2xl font-black text-foreground mt-1">{stats.totalTeachers}</p>
        </Card>
        <Card className="p-4 shadow-sm border-border bg-card">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase block">Total Murid</span>
          <p className="text-2xl font-black text-foreground mt-1">{stats.totalStudents}</p>
        </Card>
        <Card className="p-4 shadow-sm border-border bg-card">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase block">Daftar Kelas</span>
          <p className="text-2xl font-black text-foreground mt-1">{stats.totalClasses}</p>
        </Card>
        <Card className="p-4 shadow-sm border-border bg-card">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase block">Total Ujian</span>
          <p className="text-2xl font-black text-foreground mt-1">{stats.totalExams}</p>
        </Card>
        <Card className="p-4 shadow-sm border-border bg-card">
          <span className="text-[11px] font-semibold text-emerald-600 uppercase block">Ujian Aktif</span>
          <p className="text-2xl font-black text-emerald-600 mt-1">{stats.activeExams}</p>
        </Card>
        <Card className="p-4 shadow-sm border-border bg-card">
          <span className="text-[11px] font-semibold text-primary uppercase block">Sesi Selesai</span>
          <p className="text-2xl font-black text-primary mt-1">{stats.totalAttempts}</p>
        </Card>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Link href="/admin/teachers">
          <Card className="p-5 shadow-sm border-border hover:border-primary hover:shadow transition-all group">
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center">
                <Users className="h-5 w-5" />
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <h3 className="text-base font-bold text-foreground mb-1">Manajemen Akun Guru</h3>
            <p className="text-xs text-muted-foreground">
              Buat akun guru, atur hak akses, mata pelajaran yang diampu, dan kelas mengajar.
            </p>
          </Card>
        </Link>

        <Link href="/admin/students">
          <Card className="p-5 shadow-sm border-border hover:border-primary hover:shadow transition-all group">
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
                <GraduationCap className="h-5 w-5" />
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <h3 className="text-base font-bold text-foreground mb-1">Data Murid & Import Excel</h3>
            <p className="text-xs text-muted-foreground">
              Kelola nomor induk siswa (NIS), nama lengkap, kelas, serta import massal data murid.
            </p>
          </Card>
        </Link>

        <Link href="/admin/exams">
          <Card className="p-5 shadow-sm border-border hover:border-primary hover:shadow transition-all group">
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 flex items-center justify-center">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <h3 className="text-base font-bold text-foreground mb-1">Monitoring Seluruh Ujian</h3>
            <p className="text-xs text-muted-foreground">
              Pantau jadwal ujian sekolah, status pengerjaan siswa, serta fitur penutupan darurat.
            </p>
          </Card>
        </Link>
      </div>

      {/* Recent Audit Logs (FR-001 / Section 3) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <span>Audit Log Aktivitas Penting Sekolah</span>
          </h2>
          <Link href="/admin/settings" className="text-xs text-primary font-semibold hover:underline">
            Lihat Log Lengkap
          </Link>
        </div>

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
                {stats.recentLogs?.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-muted-foreground">
                      Belum ada aktivitas tercatat.
                    </td>
                  </tr>
                ) : (
                  stats.recentLogs?.map((log: any) => (
                    <tr key={log.id} className="hover:bg-muted/30">
                      <td className="py-2.5 px-4 text-muted-foreground whitespace-nowrap">
                        {formatDate(log.createdAt)}
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-foreground">
                        {log.user?.name || "Sistem"}
                      </td>
                      <td className="py-2.5 px-4">
                        <Badge variant="outline" className="text-[10px] font-mono">
                          {log.action}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-4 text-muted-foreground max-w-xs truncate">
                        {log.details || "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
