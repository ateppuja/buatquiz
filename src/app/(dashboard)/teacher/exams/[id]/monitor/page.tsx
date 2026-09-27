"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  Users,
  RotateCcw,
  Search,
  RefreshCw,
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  AlertTriangle,
} from "lucide-react";
import { formatTimeRemaining } from "@/lib/utils";
import { toast } from "sonner";

export default function ExamMonitorPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params?.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");

  // Reset Attempt Quota Modal state
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [resetReason, setResetReason] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  const fetchParticipants = useCallback(async (silent: boolean = false) => {
    if (!silent) setIsLoading(true);
    try {
      const res = await fetch(`/api/v1/teacher/exams/${examId}/participants`);
      const resData = await res.json();
      if (resData.success) {
        setData(resData.data);
      } else {
        toast.error(resData.error?.message || "Gagal memuat data monitoring.");
      }
    } catch {
      toast.error("Gagal memuat peserta ujian.");
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [examId]);

  useEffect(() => {
    fetchParticipants();

    // Auto-refresh every 10 seconds
    const interval = setInterval(() => {
      fetchParticipants(true);
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchParticipants]);

  const handleResetAttempt = async () => {
    if (!selectedStudent || !resetReason.trim()) {
      toast.error("Alasan reset kuota wajib diisi.");
      return;
    }

    setIsResetting(true);
    try {
      const res = await fetch(`/api/v1/teacher/exams/${examId}/participants/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedStudent.studentId,
          reason: resetReason.trim(),
        }),
      });

      const resData = await res.json();
      if (resData.success) {
        toast.success(resData.message);
        setSelectedStudent(null);
        setResetReason("");
        fetchParticipants(false);
      } else {
        toast.error(resData.error?.message || "Gagal mereset kuota.");
      }
    } catch {
      toast.error("Terjadi kesalahan saat mereset kuota murid.");
    } finally {
      setIsResetting(false);
    }
  };

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-xs text-muted-foreground">Memuat live monitoring ujian...</p>
      </div>
    );
  }

  const participants = data.participants || [];

  const filteredParticipants = participants.filter((p: any) => {
    if (filterStatus !== "ALL" && p.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.className.toLowerCase().includes(q);
    }
    return true;
  });

  const countInProgress = participants.filter((p: any) => p.status === "IN_PROGRESS").length;
  const countSubmitted = participants.filter((p: any) => p.status === "SUBMITTED").length;
  const countNotStarted = participants.filter((p: any) => p.status === "NOT_STARTED").length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/teacher/exams" className="text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1">
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Daftar Ujian</span>
            </Link>
            <span className="text-muted-foreground">•</span>
            <Badge variant="outline" className="text-xs font-mono">{data.exam.examCode}</Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Live Monitoring Peserta</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{data.exam.title}</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchParticipants(false)}
            className="gap-1.5 text-xs font-semibold"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Perbarui Data</span>
          </Button>
          <Link href={`/teacher/exams/${examId}/results`}>
            <Button size="sm" className="font-semibold text-xs">
              Lihat Rekap Nilai
            </Button>
          </Link>
        </div>
      </div>

      {/* Real-time Summary Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 shadow-sm border-border bg-card">
          <span className="text-xs font-semibold text-muted-foreground uppercase">Total Berhak</span>
          <p className="text-2xl font-extrabold text-foreground mt-1">{data.totalEligible} Murid</p>
        </Card>
        <Card className="p-4 shadow-sm border-border bg-card">
          <span className="text-xs font-semibold text-blue-600 uppercase">Sedang Mengerjakan</span>
          <p className="text-2xl font-extrabold text-blue-600 mt-1">{countInProgress} Murid</p>
        </Card>
        <Card className="p-4 shadow-sm border-border bg-card">
          <span className="text-xs font-semibold text-emerald-600 uppercase">Sudah Selesai</span>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1">{countSubmitted} Murid</p>
        </Card>
        <Card className="p-4 shadow-sm border-border bg-card">
          <span className="text-xs font-semibold text-muted-foreground uppercase">Belum Memulai</span>
          <p className="text-2xl font-extrabold text-slate-600 dark:text-slate-400 mt-1">{countNotStarted} Murid</p>
        </Card>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama atau kelas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {[
            { id: "ALL", label: "Semua" },
            { id: "IN_PROGRESS", label: "Sedang Mengerjakan" },
            { id: "SUBMITTED", label: "Selesai" },
            { id: "NOT_STARTED", label: "Belum Mulai" },
          ].map((f) => (
            <Button
              key={f.id}
              variant={filterStatus === f.id ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus(f.id)}
              className="text-xs font-semibold shrink-0"
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Live Participant Table */}
      <Card className="shadow-sm border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/60 text-muted-foreground uppercase tracking-wider font-semibold border-b border-border">
              <tr>
                <th className="py-3 px-4">No</th>
                <th className="py-3 px-4">Nama Murid</th>
                <th className="py-3 px-4">Kelas</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Percobaan</th>
                <th className="py-3 px-4">Nilai Sementara</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredParticipants.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted-foreground">
                    Tidak ada data peserta yang cocok.
                  </td>
                </tr>
              ) : (
                filteredParticipants.map((p: any, idx: number) => (
                  <tr key={p.studentId} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 font-medium text-muted-foreground">{idx + 1}</td>
                    <td className="py-3 px-4 font-semibold text-foreground">{p.name}</td>
                    <td className="py-3 px-4 font-medium">{p.className}</td>
                    <td className="py-3 px-4">
                      {p.status === "IN_PROGRESS" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 animate-pulse">
                          <span className="h-2 w-2 rounded-full bg-blue-600" />
                          <span>Mengerjakan</span>
                        </span>
                      )}
                      {p.status === "SUBMITTED" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Selesai</span>
                        </span>
                      )}
                      {p.status === "WAITING_GRADING" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300">
                          <Clock className="h-3 w-3" />
                          <span>Menunggu Koreksi</span>
                        </span>
                      )}
                      {p.status === "EXPIRED" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                          <span>Waktu Habis</span>
                        </span>
                      )}
                      {p.status === "NOT_STARTED" && (
                        <span className="text-muted-foreground font-medium">Belum Mulai</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-medium">
                      {p.totalAttempts} / {p.maxAttempts}x
                    </td>
                    <td className="py-3 px-4 font-bold text-foreground">
                      {p.finalScore !== null ? `${p.finalScore}` : "-"}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {p.totalAttempts > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedStudent(p)}
                          className="h-8 text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/40 gap-1"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          <span>Reset Kuota</span>
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Reset Attempt Quota Modal (FR-011) */}
      <Dialog open={Boolean(selectedStudent)} onOpenChange={() => setSelectedStudent(null)}>
        <DialogHeader>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 mb-3 mx-auto">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <DialogTitle className="text-center text-lg font-bold">
            Reset Kuota Percobaan Murid
          </DialogTitle>
          <DialogDescription className="text-center text-xs">
            Aksi ini akan menghapus riwayat sesi percobaan murid agar dapat mengulang ujian dari awal.
          </DialogDescription>
        </DialogHeader>

        {selectedStudent && (
          <div className="space-y-4 my-2 text-xs">
            <div className="rounded-xl bg-slate-50 dark:bg-slate-900 p-3 border border-border">
              <p><strong>Nama:</strong> {selectedStudent.name}</p>
              <p><strong>Kelas:</strong> {selectedStudent.className}</p>
              <p><strong>Percobaan Digunakan:</strong> {selectedStudent.totalAttempts}x</p>
            </div>

            <div>
              <label className="block font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Alasan Reset (Wajib dicatat pada Audit Log) <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="Contoh: Terjadi mati listrik / kendala jaringan saat pengerjaan"
                value={resetReason}
                onChange={(e) => setResetReason(e.target.value)}
                className="h-10 text-xs"
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setSelectedStudent(null)}>
            Batal
          </Button>
          <Button
            onClick={handleResetAttempt}
            isLoading={isResetting}
            className="font-bold bg-amber-600 hover:bg-amber-700 text-white"
          >
            Reset Kuota Sekarang
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
