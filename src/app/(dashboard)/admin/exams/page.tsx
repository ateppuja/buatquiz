"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  FileSpreadsheet,
  Search,
  PowerOff,
  Users,
  BarChart3,
  Calendar,
  Clock,
  Layers,
  Copy,
  AlertTriangle,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

export default function AdminAllExamsPage() {
  const [exams, setExams] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const loadExams = async () => {
    try {
      const res = await fetch("/api/v1/admin/exams");
      const data = await res.json();
      if (data.success) setExams(data.data);
    } catch {
      toast.error("Gagal memuat seluruh ujian sekolah.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadExams();
  }, []);

  const handleEmergencyClose = async (examId: string, title: string) => {
    if (
      !confirm(
        `🚨 PERINGATAN DARURAT:\nApakah Anda yakin ingin melakukan PENUTUPAN DARURAT pada ujian "${title}"?\nSeluruh sesi pengerjaan murid yang sedang aktif akan dihentikan seketika.`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/v1/teacher/exams/${examId}/close`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        toast.success(`Ujian "${title}" berhasil ditutup darurat oleh administrator.`);
        loadExams();
      } else {
        toast.error(data.error?.message || "Gagal menutup ujian.");
      }
    } catch {
      toast.error("Terjadi kesalahan.");
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Kode ujian ${code} disalin ke clipboard!`);
  };

  const filteredExams = exams.filter((e) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      e.title.toLowerCase().includes(q) ||
      e.examCode?.toLowerCase().includes(q) ||
      e.teacher?.name.toLowerCase().includes(q) ||
      e.subject?.name.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Monitoring Seluruh Ujian Sekolah
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Pantau seluruh aktivitas ujian dari semua guru, sesi peserta aktif, dan kontrol darurat
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari judul, guru, atau kode ujian..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 text-xs"
          />
        </div>
      </div>

      {/* Exams Feed */}
      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <p className="text-xs text-muted-foreground">Memuat seluruh ujian...</p>
        </div>
      ) : filteredExams.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground text-sm">
          Tidak ada data ujian yang cocok.
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredExams.map((exam) => {
            const isPublished = exam.status === "PUBLISHED";
            const isClosed = exam.status === "CLOSED";
            const isDraft = exam.status === "DRAFT";

            return (
              <Card key={exam.id} className="p-5 shadow-sm border-border hover:shadow transition-shadow">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Info */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {isPublished && <Badge variant="success" className="text-xs">Aktif</Badge>}
                      {isClosed && <Badge variant="secondary" className="text-xs">Selesai</Badge>}
                      {isDraft && <Badge variant="outline" className="text-xs">Draft</Badge>}
                      <span className="text-xs font-bold text-muted-foreground px-2 py-0.5 rounded bg-muted">
                        {exam.subject?.name}
                      </span>
                      {exam.examCode && (
                        <div className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2.5 py-0.5 rounded text-xs font-mono font-bold">
                          <span>Kode: {exam.examCode}</span>
                          <button
                            type="button"
                            onClick={() => copyCode(exam.examCode)}
                            className="hover:text-primary/70 ml-1"
                            title="Salin Kode"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-foreground">{exam.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      Guru Pembuat: <strong>{exam.teacher?.name}</strong> • Kelas:{" "}
                      {exam.examClasses?.map((ec: any) => ec.class.name).join(", ") || "-"}
                    </p>

                    <div className="flex flex-wrap gap-y-1 gap-x-4 text-xs text-muted-foreground pt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{exam.durationMinutes} Menit</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{formatDate(exam.startAt)} s/d {formatDate(exam.endAt)}</span>
                      </span>
                      <span>{exam._count?.questions || 0} Soal</span>
                      <span>{exam._count?.attempts || 0} Percobaan Siswa</span>
                    </div>
                  </div>

                  {/* Right Action */}
                  <div className="flex items-center gap-2 border-t lg:border-t-0 pt-3 lg:pt-0">
                    {isPublished && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleEmergencyClose(exam.id, exam.title)}
                        className="gap-1 text-xs font-bold shadow"
                        title="Tutup Ujian Darurat"
                      >
                        <PowerOff className="h-3.5 w-3.5" />
                        <span>Tutup Darurat</span>
                      </Button>
                    )}
                    <Link href={`/teacher/exams/${exam.id}/monitor`}>
                      <Button variant="outline" size="sm" className="gap-1 text-xs font-semibold">
                        <Users className="h-3.5 w-3.5" />
                        <span>Monitoring</span>
                      </Button>
                    </Link>
                    <Link href={`/teacher/exams/${exam.id}/results`}>
                      <Button size="sm" className="gap-1 text-xs font-semibold">
                        <BarChart3 className="h-3.5 w-3.5" />
                        <span>Rekap Nilai</span>
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
