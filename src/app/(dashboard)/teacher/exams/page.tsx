"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
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
  Folder,
  FolderOpen,
  ArrowUpDown,
  BookOpen,
  Filter,
  Check,
  LayoutGrid,
  ListFilter,
  ChevronRight,
  RotateCcw,
  Printer,
} from "lucide-react";
import { formatDate, cn } from "@/lib/utils";
import { toast } from "sonner";

export default function TeacherExamsPage() {
  const router = useRouter();
  const [exams, setExams] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"LATEST_DATE" | "OLDEST_DATE" | "TITLE_ASC" | "TITLE_DESC" | "MOST_ATTEMPTS">("LATEST_DATE");
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
    if (
      !confirm(
        `Apakah Anda yakin ingin menghapus ujian "${title}"? Semua butir soal dan data pengerjaan terkait akan dihapus secara permanen.`
      )
    ) {
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
    if (
      !confirm(
        `Apakah Anda yakin ingin menutup ujian "${title}"? Sesi pengerjaan yang sedang berjalan akan diakhiri.`
      )
    ) {
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

  // Compute Subject Folders List with count of exams
  const subjectFolders = useMemo(() => {
    const map = new Map<string, { id: string; name: string; code: string; count: number }>();
    exams.forEach((e) => {
      if (e.subject) {
        const existing = map.get(e.subject.id);
        if (existing) {
          existing.count += 1;
        } else {
          map.set(e.subject.id, {
            id: e.subject.id,
            name: e.subject.name,
            code: e.subject.code || "",
            count: 1,
          });
        }
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [exams]);

  // Filter & Sort Exams
  const filteredExams = useMemo(() => {
    return exams
      .filter((e) => {
        // Filter by Subject Folder
        if (
          selectedSubjectId !== "ALL" &&
          e.subjectId !== selectedSubjectId &&
          e.subject?.id !== selectedSubjectId
        ) {
          return false;
        }

        // Filter by Status
        if (filterStatus !== "ALL" && e.status !== filterStatus) return false;

        // Search Query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = e.title?.toLowerCase().includes(q);
          const matchCode = e.examCode?.toLowerCase().includes(q);
          const matchSubject = e.subject?.name?.toLowerCase().includes(q);
          const matchClass = e.examClasses?.some((ec: any) =>
            ec.class?.name?.toLowerCase().includes(q)
          );
          return matchTitle || matchCode || matchSubject || matchClass;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "LATEST_DATE") {
          const timeA = new Date(a.startAt || a.createdAt).getTime();
          const timeB = new Date(b.startAt || b.createdAt).getTime();
          return timeB - timeA; // Newest first
        }
        if (sortBy === "OLDEST_DATE") {
          const timeA = new Date(a.startAt || a.createdAt).getTime();
          const timeB = new Date(b.startAt || b.createdAt).getTime();
          return timeA - timeB; // Oldest first
        }
        if (sortBy === "TITLE_ASC") {
          return (a.title || "").localeCompare(b.title || "");
        }
        if (sortBy === "TITLE_DESC") {
          return (b.title || "").localeCompare(a.title || "");
        }
        if (sortBy === "MOST_ATTEMPTS") {
          return (b._count?.attempts || 0) - (a._count?.attempts || 0);
        }
        return 0;
      });
  }, [exams, selectedSubjectId, filterStatus, searchQuery, sortBy]);

  const activeSubjectName =
    selectedSubjectId === "ALL"
      ? "Semua Mata Pelajaran"
      : subjectFolders.find((s) => s.id === selectedSubjectId)?.name || "Mata Pelajaran";

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E0F2C2] pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Daftar Ujian Saya</h1>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">
            Kelola seluruh ujian aktif, draft, dan rekap nilai per mata pelajaran
          </p>
        </div>

        <Link href="/teacher/exams/create">
          <Button className="font-black gap-2 shadow-md bg-[#7AB82A] hover:bg-[#689f22] text-white rounded-xl h-11 px-5">
            <PlusCircle className="h-4 w-4 stroke-[2.5]" />
            <span>Buat Ujian Baru</span>
          </Button>
        </Link>
      </div>

      {/* 📁 Folder Mata Pelajaran Ribbon */}
      <div className="space-y-2 bg-gradient-to-r from-[#F7FCF0] via-[#FFFFFF] to-[#F7FCF0] p-4 rounded-2xl border-2 border-[#D8EEB6] shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Folder className="h-4 w-4 text-[#7AB82A]" />
            <span className="text-xs font-black uppercase tracking-wider text-[#4B7914]">
              Folder / Kategori Mata Pelajaran ({subjectFolders.length} Mapel)
            </span>
          </div>

          {selectedSubjectId !== "ALL" && (
            <button
              type="button"
              onClick={() => setSelectedSubjectId("ALL")}
              className="text-[11px] font-bold text-slate-500 hover:text-[#4B7914] flex items-center gap-1 cursor-pointer transition-colors"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Tampilkan Semua</span>
            </button>
          )}
        </div>

        {/* Scrollable Folder Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
          {/* "Semua" Folder Tab */}
          <button
            type="button"
            onClick={() => setSelectedSubjectId("ALL")}
            className={cn(
              "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer border shadow-2xs",
              selectedSubjectId === "ALL"
                ? "bg-[#7AB82A] text-white border-[#7AB82A] shadow-sm ring-2 ring-[#D5EFA9]"
                : "bg-white text-slate-700 border-slate-200 hover:border-[#7AB82A] hover:bg-[#F2FADF]"
            )}
          >
            {selectedSubjectId === "ALL" ? (
              <FolderOpen className="h-4 w-4 shrink-0" />
            ) : (
              <Folder className="h-4 w-4 shrink-0 text-[#7AB82A]" />
            )}
            <span>Semua Mapel</span>
            <span
              className={cn(
                "text-[10px] px-2 py-0.5 rounded-full font-bold",
                selectedSubjectId === "ALL"
                  ? "bg-white/25 text-white"
                  : "bg-slate-100 text-slate-600"
              )}
            >
              {exams.length}
            </span>
          </button>

          {/* Individual Subject Folder Tabs */}
          {subjectFolders.map((subj) => {
            const isActive = selectedSubjectId === subj.id;
            return (
              <button
                key={subj.id}
                type="button"
                onClick={() => setSelectedSubjectId(subj.id)}
                className={cn(
                  "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer border shadow-2xs",
                  isActive
                    ? "bg-[#7AB82A] text-white border-[#7AB82A] shadow-sm ring-2 ring-[#D5EFA9]"
                    : "bg-white text-slate-700 border-slate-200 hover:border-[#7AB82A] hover:bg-[#F2FADF]"
                )}
              >
                {isActive ? (
                  <FolderOpen className="h-4 w-4 shrink-0" />
                ) : (
                  <BookOpen className="h-4 w-4 shrink-0 text-[#7AB82A]" />
                )}
                <span>{subj.name}</span>
                <span
                  className={cn(
                    "text-[10px] px-2 py-0.5 rounded-full font-bold",
                    isActive
                      ? "bg-white/25 text-white"
                      : "bg-[#EBF7D9] text-[#4B7914]"
                  )}
                >
                  {subj.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 🔍 Filter & Sort Toolbar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Cari judul ujian, kode akses, kelas, atau mapel..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 text-xs rounded-xl border-slate-200 focus-visible:ring-[#7AB82A] font-medium bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Sort By Dropdown (Tanggal Terbaru Default) */}
          <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-slate-200 text-xs shadow-2xs">
            <ArrowUpDown className="h-3.5 w-3.5 text-[#7AB82A]" />
            <span className="font-bold text-slate-500 text-[11px]">Urutkan:</span>
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="bg-transparent font-bold text-slate-800 text-xs focus:outline-none cursor-pointer py-1 pr-1"
            >
              <option value="LATEST_DATE">📅 Tanggal Ujian (Terbaru)</option>
              <option value="OLDEST_DATE">⏳ Tanggal Ujian (Terlama)</option>
              <option value="TITLE_ASC">🔤 Judul Ujian (A - Z)</option>
              <option value="TITLE_DESC">🔤 Judul Ujian (Z - A)</option>
              <option value="MOST_ATTEMPTS">👥 Peserta Terbanyak</option>
            </select>
          </div>

          {/* Status Filter Buttons */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {[
              { key: "ALL", label: "Semua" },
              { key: "PUBLISHED", label: "Aktif" },
              { key: "DRAFT", label: "Draft" },
              { key: "CLOSED", label: "Selesai" },
            ].map((st) => (
              <button
                key={st.key}
                type="button"
                onClick={() => setFilterStatus(st.key)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                  filterStatus === st.key
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Active Folder Header indicator */}
      {selectedSubjectId !== "ALL" && (
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#F4FBEB] border border-[#D5EFA9] text-xs">
          <div className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4 text-[#7AB82A]" />
            <span className="font-black text-slate-900">
              Folder: <span className="text-[#4B7914]">{activeSubjectName}</span>
            </span>
            <span className="text-slate-400">•</span>
            <span className="font-semibold text-slate-600">
              Menampilkan {filteredExams.length} ujian
            </span>
          </div>

          <button
            type="button"
            onClick={() => setSelectedSubjectId("ALL")}
            className="text-[11px] font-black text-[#4B7914] hover:underline cursor-pointer"
          >
            Tampilkan Semua Mapel ↗
          </button>
        </div>
      )}

      {/* Table / Cards List */}
      {isLoading ? (
        <div className="flex items-center justify-center p-16">
          <Loader2 className="h-6 w-6 animate-spin text-[#7AB82A]" />
          <span className="ml-2 text-xs font-bold text-slate-500">Memuat daftar ujian...</span>
        </div>
      ) : filteredExams.length === 0 ? (
        <Card className="p-12 text-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50">
          <Folder className="h-10 w-10 text-slate-300 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-slate-800">Tidak ada ujian ditemukan</h4>
          <p className="text-xs text-slate-500 mt-1">
            {searchQuery
              ? `Tidak ada ujian yang cocok dengan kata kunci "${searchQuery}".`
              : selectedSubjectId !== "ALL"
              ? `Belum ada ujian dalam folder mata pelajaran ${activeSubjectName}.`
              : "Belum ada ujian yang dibuat."}
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            {(selectedSubjectId !== "ALL" || filterStatus !== "ALL" || searchQuery) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedSubjectId("ALL");
                  setFilterStatus("ALL");
                  setSearchQuery("");
                }}
                className="text-xs font-bold"
              >
                Reset Semua Filter
              </Button>
            )}
            <Link href="/teacher/exams/create">
              <Button size="sm" className="bg-[#7AB82A] hover:bg-[#689f22] text-white text-xs font-bold">
                + Buat Ujian Baru
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredExams.map((exam) => {
            const isPublished = exam.status === "PUBLISHED";
            const isClosed = exam.status === "CLOSED";
            const isDraft = exam.status === "DRAFT";
            const isBusy = actionLoadingId === exam.id;

            return (
              <Card
                key={exam.id}
                className="p-5 shadow-xs border-2 border-[#E5F2D2] hover:border-[#7AB82A] rounded-2xl bg-white hover:shadow-md transition-all space-y-4"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Metadata */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {isPublished && (
                        <Badge variant="success" className="text-xs font-black shadow-2xs">
                          Aktif
                        </Badge>
                      )}
                      {isClosed && (
                        <Badge variant="secondary" className="text-xs font-bold">
                          Selesai
                        </Badge>
                      )}
                      {isDraft && (
                        <Badge variant="outline" className="text-xs font-bold">
                          Draft
                        </Badge>
                      )}

                      <button
                        type="button"
                        onClick={() => exam.subject?.id && setSelectedSubjectId(exam.subject.id)}
                        className="text-xs font-black text-[#4B7914] px-2.5 py-0.5 rounded-lg bg-[#EBF7D9] border border-[#D5EFA9] hover:bg-[#7AB82A] hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                        title="Klik untuk menyaring folder mapel ini"
                      >
                        <BookOpen className="h-3 w-3" />
                        <span>{exam.subject?.name || "Tanpa Mapel"}</span>
                      </button>

                      {exam.examCode && (
                        <div className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold">
                          <span>Kode: {exam.examCode}</span>
                          <button
                            type="button"
                            onClick={() => copyExamCode(exam.examCode)}
                            className="hover:text-emerald-950 ml-1 cursor-pointer"
                            title="Salin Kode Ujian"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    <h3 className="text-base font-black text-slate-900 leading-snug">
                      {exam.title}
                    </h3>

                    <div className="flex flex-wrap gap-y-1.5 gap-x-4 text-xs text-slate-600 font-medium">
                      <span className="flex items-center gap-1.5">
                        <Layers className="h-3.5 w-3.5 text-[#7AB82A]" />
                        <span>
                          Kelas:{" "}
                          <strong>
                            {exam.examClasses?.map((ec: any) => ec.class.name).join(", ") || "-"}
                          </strong>
                        </span>
                      </span>

                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-[#7AB82A]" />
                        <span>{exam.durationMinutes} Menit</span>
                      </span>

                      <span className="flex items-center gap-1.5 font-bold text-slate-800 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
                        <Calendar className="h-3.5 w-3.5 text-[#7AB82A]" />
                        <span>
                          {formatDate(exam.startAt)} s/d {formatDate(exam.endAt)}
                        </span>
                      </span>

                      <span className="bg-[#F4FBEB] text-[#4B7914] px-2 py-0.5 rounded font-bold">
                        {exam._count?.questions || 0} Butir Soal
                      </span>

                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">
                        {exam._count?.attempts || 0} Sesi Peserta
                      </span>
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
                          className="gap-1 text-xs font-bold border-slate-300 hover:bg-slate-100"
                          title="Salin Link Pengerjaan Murid"
                        >
                          <Copy className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Salin Link</span>
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleCloseExam(exam.id, exam.title)}
                          className="gap-1 text-xs font-bold"
                          title="Tutup Ujian Sekarang"
                        >
                          <PowerOff className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Tutup</span>
                        </Button>
                        <Link href={`/teacher/exams/${exam.id}/monitor`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1 text-xs font-bold border-slate-300"
                          >
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
                          <Button
                            size="sm"
                            className="gap-1 text-xs font-bold bg-[#7AB82A] hover:bg-[#689f22] text-white shadow-2xs"
                          >
                            <BarChart3 className="h-3.5 w-3.5" />
                            <span>Hasil & Nilai</span>
                          </Button>
                        </Link>
                        <a href={`/api/v1/teacher/exams/${exam.id}/export`} download>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-400 border-emerald-300 bg-emerald-50/50 hover:bg-emerald-100"
                          >
                            <FileSpreadsheet className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Unduh Excel</span>
                          </Button>
                        </a>
                      </>
                    )}

                    {/* Print / PDF Exam Paper Button */}
                    <Link href={`/teacher/exams/${exam.id}/print`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 text-xs font-bold text-slate-700 border-slate-300 hover:bg-slate-100 bg-white"
                        title="Cetak Naskah Soal Ujian atau Simpan ke PDF"
                      >
                        <Printer className="h-3.5 w-3.5 text-slate-600" />
                        <span>Cetak / PDF</span>
                      </Button>
                    </Link>

                    {/* Edit Exam Button (Available for ALL statuses) */}
                    <Link href={`/teacher/exams/${exam.id}/edit`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 text-xs font-bold text-blue-600 border-blue-200 hover:bg-blue-50"
                      >
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
                      className="gap-1.5 text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-300"
                      title="Duplikat ujian ini beserta seluruh butir soal untuk membuat ujian baru"
                    >
                      {isBusy ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <CopyPlus className="h-3.5 w-3.5" />
                      )}
                      <span>Buat Lagi</span>
                    </Button>

                    {/* Delete Exam Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={isBusy}
                      onClick={() => handleDeleteExam(exam.id, exam.title)}
                      className="gap-1 text-xs text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-2 rounded-lg"
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
