"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  PlusCircle,
  Search,
  Copy,
  Users,
  BarChart3,
  Edit,
  PowerOff,
  FileSpreadsheet,
  Calendar,
  Clock,
  Layers,
  CheckCircle,
  CopyPlus,
  Trash2,
  Loader2,
  Sparkles,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

export default function TeacherExamsPage() {
  const router = useRouter();
  const [exams, setExams] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const loadExams = async () => {
    try {
      const res = await fetch(`/api/v1/teacher/exams?_t=${Date.now()}`, { cache: "no-store" });
      const data = await res.json();
      if (data.success) {
        setExams(data.data);
      }
    } catch {
      toast.error("Gagal memuat daftar ujian.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadExams();
  }, []);

  const handleDuplicateExam = async (examId: string, title: string) => {
    setActionLoadingId(examId);
    try {
      const res = await fetch(`/api/v1/teacher/exams/${examId}/duplicate`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Ujian "${title}" berhasil disalin/dibuat lagi!`);
        await loadExams();
        // Redirect to newly cloned draft exam for quick edit
        if (data.data?.id) {
          router.push(`/teacher/exams/${data.data.id}/edit`);
        }
      } else {
        toast.error(data.error?.message || "Gagal menduplikasi ujian.");
      }
    } catch {
      toast.error("Terjadi kesalahan saat menduplikasi ujian.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteExam = async (examId: string, title: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus ujian "${title}"? Semua butir soal dan data pengerjaan terkait akan dihapus secara permanen.`)) {
      return;
    }

    setActionLoadingId(examId);
    try {
      const res = await fetch(`/api/v1/teacher/exams/${examId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success(`Ujian "${title}" berhasil dihapus.`);
        setExams((prev) => prev.filter((e) => e.id !== examId));
        await loadExams();
      } else {
        toast.error(data.error?.message || "Gagal menghapus ujian.");
      }
    } catch {
      toast.error("Terjadi kesalahan saat menghapus ujian.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCloseExam = async (examId: string, title: string) => {
    if (!confirm(`Apakah Anda yakin ingin menutup ujian "${title}"? Sesi pengerjaan yang sedang berjalan akan diakhiri.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/v1/teacher/exams/${examId}/close`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        toast.success(`Ujian "${title}" berhasil ditutup.`);
        loadExams();
      } else {
        toast.error(data.error?.message || "Gagal menutup ujian.");
      }
    } catch {
      toast.error("Terjadi kesalahan saat menutup ujian.");
    }
  };

  const copyExamCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Kode ujian ${code} disalin ke clipboard!`);
  };

  const copyExamLink = (code: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/exam/${code}/identity`;
    navigator.clipboard.writeText(url);
    toast.success("Tautan ujian berhasil disalin ke clipboard!");
  };

  const filteredExams = exams.filter((e) => {
    if (filterStatus !== "ALL" && e.status !== filterStatus) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchTitle = e.title.toLowerCase().includes(query);
      const matchCode = e.examCode?.toLowerCase().includes(query);
      const matchSubject = e.subject?.name.toLowerCase().includes(query);
      return matchTitle || matchCode || matchSubject;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Daftar Ujian Saya</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Kelola seluruh ujian aktif, draft, maupun riwayat ujian yang telah selesai
          </p>
        </div>

        <Link href="/teacher/exams/create">
          <Button className="font-bold gap-2 shadow-sm">
            <PlusCircle className="h-4 w-4" />
            <span>Buat Ujian Baru</span>
          </Button>
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari judul atau kode ujian..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {["ALL", "PUBLISHED", "DRAFT", "CLOSED"].map((st) => (
            <Button
              key={st}
              variant={filterStatus === st ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus(st)}
              className="text-xs font-semibold shrink-0"
            >
              {st === "ALL" && "Semua"}
              {st === "PUBLISHED" && "Aktif"}
              {st === "DRAFT" && "Draft"}
              {st === "CLOSED" && "Selesai"}
            </Button>
          ))}
        </div>
      </div>

      {/* Table / Cards */}
      {filteredExams.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-sm text-muted-foreground">Tidak ada ujian yang cocok dengan filter pencarian.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredExams.map((exam) => {
            const isPublished = exam.status === "PUBLISHED";
            const isClosed = exam.status === "CLOSED";
            const isDraft = exam.status === "DRAFT";
            const isBusy = actionLoadingId === exam.id;

            return (
              <Card key={exam.id} className="p-5 shadow-sm border-border hover:shadow transition-shadow">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Metadata */}
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
                            onClick={() => copyExamCode(exam.examCode)}
                            className="hover:text-primary/70 ml-1 cursor-pointer"
                            title="Salin Kode"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-foreground">
                      {exam.title}
                    </h3>

                    <div className="flex flex-wrap gap-y-1 gap-x-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Layers className="h-3.5 w-3.5" />
                        <span>Kelas: {exam.examClasses?.map((ec: any) => ec.class.name).join(", ") || "-"}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{exam.durationMinutes} Menit</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{formatDate(exam.startAt)} s/d {formatDate(exam.endAt)}</span>
                      </span>
                      <span>{exam._count?.questions || 0} Soal</span>
                      <span>{exam._count?.attempts || 0} Sesi Peserta</span>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex flex-wrap items-center gap-2 border-t lg:border-t-0 pt-3 lg:pt-0">
                    {/* Monitoring (if published) */}
                    {isPublished && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyExamLink(exam.examCode)}
                          className="gap-1 text-xs font-semibold"
                          title="Salin Link Pengerjaan Murid"
                        >
                          <Copy className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Salin Link</span>
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleCloseExam(exam.id, exam.title)}
                          className="gap-1 text-xs font-semibold"
                          title="Tutup Ujian Sekarang"
                        >
                          <PowerOff className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Tutup</span>
                        </Button>
                        <Link href={`/teacher/exams/${exam.id}/monitor`}>
                          <Button variant="outline" size="sm" className="gap-1 text-xs font-semibold">
                            <Users className="h-3.5 w-3.5" />
                            <span>Monitoring</span>
                          </Button>
                        </Link>
                      </>
                    )}

                    {/* Hasil & Nilai (for published / closed) */}
                    {!isDraft && (
                      <>
                        <Link href={`/teacher/exams/${exam.id}/results`}>
                          <Button size="sm" className="gap-1 text-xs font-semibold">
                            <BarChart3 className="h-3.5 w-3.5" />
                            <span>Hasil & Nilai</span>
                          </Button>
                        </Link>
                        <a href={`/api/v1/teacher/exams/${exam.id}/export`} download>
                          <Button variant="outline" size="sm" className="gap-1 text-xs text-emerald-700 dark:text-emerald-400 border-emerald-300">
                            <FileSpreadsheet className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Unduh Excel</span>
                          </Button>
                        </a>
                      </>
                    )}

                    {/* Edit Exam Button (Available for ALL statuses) */}
                    <Link href={`/teacher/exams/${exam.id}/edit`}>
                      <Button variant="outline" size="sm" className="gap-1.5 text-xs font-semibold text-blue-600 border-blue-200 hover:bg-blue-50">
                        <Edit className="h-3.5 w-3.5" />
                        <span>Edit Ujian</span>
                      </Button>
                    </Link>

                    {/* Duplicate / Buat Ujian Lagi Button (Available for ALL statuses) */}
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isBusy}
                      onClick={() => handleDuplicateExam(exam.id, exam.title)}
                      className="gap-1.5 text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-300"
                      title="Duplikat ujian ini beserta seluruh butir soal untuk membuat ujian baru"
                    >
                      {isBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CopyPlus className="h-3.5 w-3.5" />}
                      <span>Buat Lagi (Duplikat)</span>
                    </Button>

                    {/* Delete Exam Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={isBusy}
                      onClick={() => handleDeleteExam(exam.id, exam.title)}
                      className="gap-1 text-xs text-muted-foreground hover:text-destructive hover:bg-red-50 p-2"
                      title="Hapus Ujian"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
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
