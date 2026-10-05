"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  BarChart3,
  Download,
  CheckCircle2,
  Clock,
  ArrowLeft,
  FileSpreadsheet,
  Award,
  Edit,
  Save,
  Sparkles,
  Users,
  Search,
  Check,
  X,
  HelpCircle,
  Trophy,
  Printer,
  SlidersHorizontal,
  PowerOff,
  Share2,
  Mail,
  Eye,
  TrendingUp,
  AlertTriangle,
  FileText,
  Layers,
  ArrowUpDown,
  BookOpen,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { toast } from "sonner";

export default function ExamResultsPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params?.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"SUMMARY" | "PARTICIPANTS" | "QUESTIONS" | "ESSAY_GRADING">("SUMMARY");

  // Filter & Sorting
  const [searchQuery, setSearchQuery] = useState("");
  const [attemptFilter, setAttemptFilter] = useState<"BEST" | "LATEST">("BEST");
  const [sortBy, setSortBy] = useState<"SCORE_DESC" | "SCORE_ASC" | "NAME_ASC" | "NAME_DESC">("SCORE_DESC");

  // Actions
  const [isPublishing, setIsPublishing] = useState(false);
  const [isClosingExam, setIsClosingExam] = useState(false);

  // Grade Modal State
  const [gradingAnswer, setGradingAnswer] = useState<any>(null);
  const [gradingStudent, setGradingStudent] = useState<any>(null);
  const [awardedPoints, setAwardedPoints] = useState<number | string>("");
  const [feedback, setFeedback] = useState("");
  const [isSavingGrade, setIsSavingGrade] = useState(false);

  // Question Cell Detail Modal
  const [selectedCellDetail, setSelectedCellDetail] = useState<{
    student: any;
    question: any;
    answer: any;
  } | null>(null);

  // Leaderboard Modal
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);

  const fetchResults = async () => {
    try {
      const res = await fetch(`/api/v1/teacher/exams/${examId}/results?_t=${Date.now()}`);
      const resData = await res.json();
      if (resData.success) {
        setData(resData.data);
      } else {
        toast.error(resData.error?.message || "Gagal memuat hasil ujian.");
      }
    } catch {
      toast.error("Gagal memuat data hasil.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [examId]);

  const handlePublishResults = async () => {
    if (!confirm("Publikasikan hasil ujian ini sekarang? Murid akan dapat melihat nilai mereka.")) return;
    setIsPublishing(true);
    try {
      const res = await fetch(`/api/v1/teacher/exams/${examId}/publish-results`, { method: "POST" });
      const resData = await res.json();
      if (resData.success) {
        toast.success(resData.message || "Nilai berhasil dipublikasikan!");
        fetchResults();
      } else {
        toast.error(resData.error?.message || "Gagal memublikasikan nilai.");
      }
    } catch {
      toast.error("Terjadi kesalahan.");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleCloseExam = async () => {
    if (!confirm("Akhiri dan tutup ujian ini sekarang? Sesi pengerjaan yang sedang berjalan akan dihentikan.")) return;
    setIsClosingExam(true);
    try {
      const res = await fetch(`/api/v1/teacher/exams/${examId}/close`, { method: "POST" });
      const resData = await res.json();
      if (resData.success) {
        toast.success("Ujian berhasil ditutup.");
        fetchResults();
      } else {
        toast.error(resData.error?.message || "Gagal menutup ujian.");
      }
    } catch {
      toast.error("Terjadi kesalahan.");
    } finally {
      setIsClosingExam(false);
    }
  };

  const openGradingModal = (student: any, answer: any) => {
    setGradingStudent(student);
    setGradingAnswer(answer);
    setAwardedPoints(answer.awardedPoints !== null && answer.awardedPoints !== undefined ? answer.awardedPoints : "");
    setFeedback(answer.feedback || "");
  };

  const handleSaveGrade = async () => {
    if (awardedPoints === "" || isNaN(Number(awardedPoints))) {
      toast.error("Masukkan poin nilai yang valid.");
      return;
    }

    setIsSavingGrade(true);
    try {
      const res = await fetch(`/api/v1/teacher/answers/${gradingAnswer.id}/grade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          awardedPoints: parseFloat(String(awardedPoints)),
          feedback: feedback.trim(),
        }),
      });

      const resData = await res.json();
      if (resData.success) {
        toast.success("Nilai esai berhasil disimpan!");
        setGradingAnswer(null);
        setSelectedCellDetail(null);
        fetchResults();
      } else {
        toast.error(resData.error?.message || "Gagal menyimpan nilai esai.");
      }
    } catch {
      toast.error("Terjadi kesalahan saat menyimpan nilai.");
    } finally {
      setIsSavingGrade(false);
    }
  };

  const { exam, questions = [], stats = {}, participants = [] } = data || {};

  // Per-Question Statistics (Accuracy & Option Distribution)
  const questionStats = useMemo<any[]>(() => {
    if (!questions.length || !participants.length) return [];

    return questions.map((q: any, qIdx: number) => {
      let correctCount = 0;
      let totalAnswered = 0;
      const optionCounts: Record<string, number> = {};

      participants.forEach((p: any) => {
        // Select attempt based on attemptFilter
        const att =
          attemptFilter === "BEST"
            ? p.attempts?.reduce((prev: any, curr: any) =>
                (curr.finalScore ?? 0) > (prev?.finalScore ?? -1) ? curr : prev
              , p.attempts[0])
            : p.attempts?.[p.attempts.length - 1];

        const ans = att?.answers?.find((a: any) => a.questionId === q.id);
        if (ans) {
          totalAnswered++;
          if (ans.isCorrect === true) {
            correctCount++;
          }
          if (ans.selectedOptionId) {
            optionCounts[ans.selectedOptionId] = (optionCounts[ans.selectedOptionId] || 0) + 1;
          }
        }
      });

      const accuracy = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;

      return {
        questionId: q.id,
        orderNumber: qIdx + 1,
        questionText: q.questionText,
        type: q.type,
        points: q.points,
        options: q.options || [],
        correctCount,
        totalAnswered,
        accuracy,
        optionCounts,
      };
    });
  }, [questions, participants, attemptFilter]);

  // Overall Accuracy calculation
  const overallAccuracy = useMemo(() => {
    if (!questionStats.length) return stats.averageScore || 0;
    const sum = questionStats.reduce((acc: number, qs: any) => acc + qs.accuracy, 0);
    return Math.round(sum / questionStats.length);
  }, [questionStats, stats]);

  // Processed and Sorted Participants
  const processedParticipants = useMemo<any[]>(() => {
    return participants
      .filter((p: any) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          p.name?.toLowerCase().includes(q) ||
          p.className?.toLowerCase().includes(q) ||
          p.nis?.toLowerCase().includes(q)
        );
      })
      .map((p: any) => {
        const bestAttempt = p.attempts?.reduce((prev: any, curr: any) =>
          (curr.finalScore ?? 0) > (prev?.finalScore ?? -1) ? curr : prev
        , p.attempts[0]);

        const latestAttempt = p.attempts?.[p.attempts.length - 1];
        const selectedAttempt = attemptFilter === "BEST" ? bestAttempt : latestAttempt;

        return {
          ...p,
          selectedAttempt,
          effectiveScore: selectedAttempt?.finalScore ?? p.finalScore ?? 0,
          earnedPoints: selectedAttempt?.earnedPoints ?? 0,
          maxPoints: selectedAttempt?.maxPoints ?? 100,
        };
      })
      .sort((a: any, b: any) => {
        if (sortBy === "SCORE_DESC") return (b.effectiveScore ?? 0) - (a.effectiveScore ?? 0);
        if (sortBy === "SCORE_ASC") return (a.effectiveScore ?? 0) - (b.effectiveScore ?? 0);
        if (sortBy === "NAME_ASC") return (a.name || "").localeCompare(b.name || "");
        if (sortBy === "NAME_DESC") return (b.name || "").localeCompare(a.name || "");
        return 0;
      });
  }, [participants, searchQuery, attemptFilter, sortBy]);

  // Essay Answers waiting for grading
  const pendingEssays = useMemo<any[]>(() => {
    const list: any[] = [];
    participants.forEach((p: any) => {
      p.attempts?.forEach((att: any) => {
        att.answers?.forEach((ans: any) => {
          if (ans.questionType === "ESSAY") {
            list.push({
              student: p,
              attempt: att,
              answer: ans,
              isGraded: ans.awardedPoints !== null && ans.awardedPoints !== undefined,
            });
          }
        });
      });
    });
    return list;
  }, [participants]);

  if (isLoading || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#7AB82A] border-t-transparent" />
        <p className="text-xs font-bold text-slate-500">Memuat rekap hasil dan matriks penilaian...</p>
      </div>
    );
  }

  const isExamActive = exam.status === "PUBLISHED";

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* 🧭 TOP HEADER (Wayground Style) */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-[#E0F2C2] pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/teacher/exams"
              className="text-xs font-bold text-slate-500 hover:text-[#4B7914] flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Daftar Ujian</span>
            </Link>
            <span className="text-slate-300">•</span>
            <Badge variant="outline" className="text-xs font-bold text-[#4B7914] bg-[#F4FBEB] border-[#D5EFA9]">
              {exam.subjectName}
            </Badge>
            <Badge variant="outline" className="text-xs font-mono font-bold">
              Kode: {exam.examCode}
            </Badge>
          </div>

          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              <span>{exam.title}</span>
              <Link href={`/teacher/exams/${examId}/edit`} title="Sunting Judul / Soal Ujian">
                <Edit className="h-4 w-4 text-slate-400 hover:text-[#7AB82A] cursor-pointer" />
              </Link>
            </h1>

            {isExamActive ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
                <span>Berlangsung</span>
              </span>
            ) : exam.status === "CLOSED" ? (
              <Badge variant="secondary" className="text-xs font-bold">
                Selesai
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs font-bold">
                Draft
              </Badge>
            )}
          </div>
        </div>

        {/* Top Action Buttons (Wayground Style) */}
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/teacher/exams/${examId}/edit`}>
            <Button variant="outline" size="sm" className="text-xs font-bold border-slate-300">
              Sunting Pertanyaan
            </Button>
          </Link>

          <Link href={`/teacher/exams/${examId}/edit`}>
            <Button variant="outline" size="sm" className="text-xs font-bold border-slate-300">
              Sunting Pengaturan
            </Button>
          </Link>

          <Button
            type="button"
            size="sm"
            onClick={() => setShowLeaderboardModal(true)}
            className="text-xs font-black gap-1.5 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white shadow-sm border-0"
          >
            <Trophy className="h-3.5 w-3.5" />
            <span>Lihat Papan Peringkat Langsung</span>
          </Button>

          {isExamActive && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              isLoading={isClosingExam}
              onClick={handleCloseExam}
              className="text-xs font-black gap-1.5 shadow-sm bg-rose-600 hover:bg-rose-700"
            >
              <PowerOff className="h-3.5 w-3.5" />
              <span>Akhiri</span>
            </Button>
          )}

          <Link href={`/teacher/exams/${examId}/print`}>
            <Button
              variant="outline"
              size="sm"
              className="text-xs font-bold border-slate-300 text-slate-700"
              title="Cetak Naskah Soal Ujian (PDF)"
            >
              <Printer className="h-3.5 w-3.5" />
            </Button>
          </Link>

          <a href={`/api/v1/teacher/exams/${examId}/export`} download>
            <Button
              variant="outline"
              size="sm"
              className="text-xs font-bold border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
              title="Unduh Rekap Nilai Excel (.xlsx)"
            >
              <FileSpreadsheet className="h-4 w-4" />
            </Button>
          </a>
        </div>
      </div>

      {/* 📊 SUMMARY METRICS CARDS (Wayground Style) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Akurasi Rata-rata */}
        <Card className="p-4 shadow-xs border-2 border-[#D8EEB6] rounded-2xl bg-white space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Akurasi Nilai</span>
            <TrendingUp className="h-4 w-4 text-[#7AB82A]" />
          </div>
          <p className="text-3xl font-black text-slate-900 tracking-tight">
            {stats.averageScore}%
          </p>
          <p className="text-[11px] font-semibold text-slate-500">
            Tertinggi: <strong>{stats.highestScore}</strong> • Terendah: <strong>{stats.lowestScore}</strong>
          </p>
        </Card>

        {/* Tingkat Penyelesaian */}
        <Card className="p-4 shadow-xs border-2 border-[#D8EEB6] rounded-2xl bg-white space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Penyelesaian</span>
            <Users className="h-4 w-4 text-blue-500" />
          </div>
          <p className="text-3xl font-black text-blue-600 tracking-tight">
            {stats.totalParticipants} <span className="text-sm font-bold text-slate-600">Murid</span>
          </p>
          <p className="text-[11px] font-semibold text-slate-500">
            Seluruh peserta terdata
          </p>
        </Card>

        {/* Total Pertanyaan */}
        <Card className="p-4 shadow-xs border-2 border-[#D8EEB6] rounded-2xl bg-white space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pertanyaan</span>
            <BookOpen className="h-4 w-4 text-purple-500" />
          </div>
          <p className="text-3xl font-black text-purple-600 tracking-tight">
            {questions.length} <span className="text-sm font-bold text-slate-600">Soal</span>
          </p>
          <p className="text-[11px] font-semibold text-slate-500">
            Durasi: <strong>{exam.durationMinutes} Menit</strong>
          </p>
        </Card>

        {/* Menunggu Koreksi Esai / Waktu */}
        <Card className="p-4 shadow-xs border-2 border-[#D8EEB6] rounded-2xl bg-white space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Koreksi Esai</span>
            <Edit className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-3xl font-black text-amber-600 tracking-tight">
            {stats.pendingGradingCount}{" "}
            <span className="text-sm font-bold text-slate-600">Peserta</span>
          </p>
          <p className="text-[11px] font-semibold text-slate-500">
            {stats.pendingGradingCount > 0 ? "Perlu penilaian guru" : "Semua telah dinilai"}
          </p>
        </Card>
      </div>

      {/* 📑 TABS NAVIGATION (Wayground Style: Ringkasan, Peserta, Pertanyaan, Koreksi Esai) */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1 overflow-x-auto">
        {[
          { key: "SUMMARY", label: "Ringkasan (Matriks)", icon: BarChart3 },
          { key: "PARTICIPANTS", label: `Peserta (${participants.length})`, icon: Users },
          { key: "QUESTIONS", label: `Pertanyaan (${questions.length})`, icon: HelpCircle },
          {
            key: "ESSAY_GRADING",
            label: `Koreksi Esai ${stats.pendingGradingCount > 0 ? `(${stats.pendingGradingCount})` : ""}`,
            icon: Edit,
          },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as any)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 border",
                isActive
                  ? "bg-[#7AB82A] text-white border-[#7AB82A] shadow-sm ring-2 ring-[#D5EFA9]"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-[#F2FADF] hover:border-[#7AB82A]"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 🎛️ TAB 1: RINGKASAN (MATRIKS JAWABAN PERSIS SEPERTI WAYGROUND) */}
      {activeTab === "SUMMARY" && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex flex-wrap items-center gap-3 text-xs">
              {/* Percobaan Selector */}
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-500">Menampilkan:</span>
                <select
                  value={attemptFilter}
                  onChange={(e: any) => setAttemptFilter(e.target.value)}
                  className="bg-slate-100 font-black text-slate-800 rounded-lg px-2.5 py-1 text-xs border border-slate-300 focus:outline-none cursor-pointer"
                >
                  <option value="BEST">Terbaik (Highest)</option>
                  <option value="LATEST">Terbaru (Latest)</option>
                </select>
                <span className="text-slate-500">percobaan</span>
              </div>

              {/* Urutkan Selector */}
              <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
                <span className="font-bold text-slate-500">Urutkan dari:</span>
                <select
                  value={sortBy}
                  onChange={(e: any) => setSortBy(e.target.value)}
                  className="bg-slate-100 font-black text-slate-800 rounded-lg px-2.5 py-1 text-xs border border-slate-300 focus:outline-none cursor-pointer"
                >
                  <option value="SCORE_DESC">Nilai Tertinggi (↓)</option>
                  <option value="SCORE_ASC">Nilai Terendah (↑)</option>
                  <option value="NAME_ASC">Nama Siswa (A - Z)</option>
                  <option value="NAME_DESC">Nama Siswa (Z - A)</option>
                </select>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input
                placeholder="Cari nama murid..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-8 text-xs rounded-xl bg-slate-50 border-slate-200"
              />
            </div>
          </div>

          {/* 📊 THE WAYGROUND ANSWER MATRIX TABLE */}
          {processedParticipants.length === 0 ? (
            <Card className="p-12 text-center rounded-2xl border-dashed border-slate-200 bg-slate-50">
              <p className="text-xs font-bold text-slate-500">Belum ada peserta yang mengerjakan ujian ini.</p>
            </Card>
          ) : (
            <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black uppercase text-slate-700">
                      {/* Sticky Student Column */}
                      <th className="p-3.5 min-w-[200px] sticky left-0 bg-slate-50 z-10 border-r border-slate-200">
                        Peserta
                      </th>

                      {/* Poin Column */}
                      <th className="p-3.5 min-w-[110px] text-center border-r border-slate-200">
                        <div>Poin</div>
                        <div className="text-[10px] font-semibold text-slate-500 lowercase">
                          skor / nilai
                        </div>
                      </th>

                      {/* Question Header Columns with Accuracy Badge (Wayground Style) */}
                      {questionStats.map((qs: any) => {
                        const isHigh = qs.accuracy >= 80;
                        const isMid = qs.accuracy >= 50 && qs.accuracy < 80;
                        const badgeColor = isHigh
                          ? "bg-emerald-600 text-white"
                          : isMid
                          ? "bg-amber-500 text-white"
                          : "bg-rose-600 text-white";

                        return (
                          <th
                            key={qs.questionId}
                            className="p-2.5 min-w-[72px] text-center border-r border-slate-200 last:border-r-0"
                            title={`Soal #${qs.orderNumber}: ${qs.questionText} (Ketepatan: ${qs.accuracy}%)`}
                          >
                            <div className="font-black text-slate-800">Q{qs.orderNumber}</div>
                            <span className={cn("inline-block px-1.5 py-0.5 rounded text-[10px] font-black mt-0.5", badgeColor)}>
                              {qs.accuracy}%
                            </span>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-200">
                    {processedParticipants.map((p: any) => {
                      const att = p.selectedAttempt;
                      return (
                        <tr key={p.studentId} className="hover:bg-slate-50/80 transition-colors">
                          {/* Sticky Student Name & Class */}
                          <td className="p-3 sticky left-0 bg-white hover:bg-slate-50 z-10 border-r border-slate-200">
                            <div className="font-bold text-slate-900 leading-snug">
                              {p.name}
                            </div>
                            <div className="text-[10px] text-slate-500 font-semibold mt-0.5">
                              Kelas {p.className} {p.nis ? `(${p.nis})` : ""}
                            </div>
                          </td>

                          {/* Poin / Score */}
                          <td className="p-3 text-center border-r border-slate-200 font-bold">
                            <div className="text-slate-900 font-black text-sm">
                              {p.effectiveScore}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              ({p.earnedPoints}/{p.maxPoints} pt)
                            </div>
                          </td>

                          {/* Question Answer Cells (Green / Red / Yellow) */}
                          {questions.map((q: any, qIdx: number) => {
                            const ans = att?.answers?.find((a: any) => a.questionId === q.id);
                            const isEssay = q.type === "ESSAY";
                            const isCorrect = ans?.isCorrect === true;
                            const isIncorrect = ans?.isCorrect === false;
                            const isPendingEssay = isEssay && (ans?.awardedPoints === null || ans?.awardedPoints === undefined);

                            return (
                              <td
                                key={q.id}
                                onClick={() =>
                                  setSelectedCellDetail({
                                    student: p,
                                    question: q,
                                    answer: ans,
                                  })
                                }
                                className={cn(
                                  "p-2 text-center border-r border-slate-200 last:border-r-0 cursor-pointer transition-all font-bold select-none",
                                  isCorrect && "bg-[#E6F8E8] text-emerald-700 hover:bg-emerald-200",
                                  isIncorrect && "bg-[#FDE8E8] text-rose-700 hover:bg-rose-200",
                                  isPendingEssay && "bg-amber-100 text-amber-800 hover:bg-amber-200",
                                  !ans && "bg-slate-50 text-slate-400 hover:bg-slate-100"
                                )}
                                title={`Klik untuk melihat detail jawaban murid untuk Soal #${qIdx + 1}`}
                              >
                                <div className="flex items-center justify-center min-h-[32px]">
                                  {isCorrect ? (
                                    <Check className="h-4 w-4 stroke-[3]" />
                                  ) : isIncorrect ? (
                                    <X className="h-4 w-4 stroke-[3]" />
                                  ) : isPendingEssay ? (
                                    <span className="text-[10px] font-black uppercase px-1 bg-amber-200 rounded">
                                      ? Esai
                                    </span>
                                  ) : (
                                    <span className="text-slate-300">-</span>
                                  )}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 👥 TAB 2: DAFTAR PESERTA & RINCIAN PERCOBAAN */}
      {activeTab === "PARTICIPANTS" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-3.5 rounded-2xl border border-slate-200">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input
                placeholder="Cari nama murid atau kelas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>

            <div className="text-xs font-bold text-slate-600">
              Metode Nilai Akhir: <Badge variant="outline">{exam.gradingMethod}</Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {processedParticipants.map((p: any) => (
              <Card key={p.studentId} className="p-5 shadow-xs border-2 border-slate-200 rounded-2xl bg-white space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-[#EBF7D9] text-[#4B7914] flex items-center justify-center font-black text-sm">
                      {p.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{p.name}</h3>
                      <p className="text-xs text-slate-500 font-medium">
                        Kelas {p.className} • {p.totalAttempts}x Percobaan • NIS: {p.nis || "-"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Nilai Akhir
                      </span>
                      <span className="text-2xl font-black text-[#4B7914]">
                        {p.finalScore !== null ? p.finalScore : 0}
                      </span>
                    </div>

                    {p.gradingStatus === "GRADED" ? (
                      <Badge variant="success" className="text-xs">Selesai Dinilai</Badge>
                    ) : (
                      <Badge variant="warning" className="text-xs">Menunggu Koreksi</Badge>
                    )}
                  </div>
                </div>

                {/* Percobaan List */}
                <div className="space-y-3">
                  {p.attempts?.map((att: any) => (
                    <div key={att.id} className="rounded-xl bg-slate-50 p-4 border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800">
                          Percobaan #{att.attemptNumber} — Nilai: <strong>{att.finalScore ?? 0}</strong> ({att.earnedPoints}/{att.maxPoints} Poin)
                        </span>
                        <span className="text-slate-500 text-[11px]">
                          Selesai: {att.submittedAt ? new Date(att.submittedAt).toLocaleTimeString("id-ID") : "-"}
                        </span>
                      </div>

                      {/* Answers Breakdown */}
                      <div className="space-y-2 pt-1">
                        {att.answers?.map((ans: any, aIdx: number) => {
                          const isEssay = ans.questionType === "ESSAY";
                          const isGraded = ans.awardedPoints !== null && ans.awardedPoints !== undefined;

                          return (
                            <div
                              key={ans.id}
                              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg bg-white border border-slate-200 text-xs"
                            >
                              <div className="flex-1">
                                <span className="font-bold text-slate-900 mr-2">
                                  #{aIdx + 1} ({isEssay ? "Esai" : "Pilihan"}):
                                </span>
                                <span className="text-slate-600 line-clamp-1">{ans.questionText}</span>
                                <div className="mt-1">
                                  {isEssay ? (
                                    <p className="text-slate-800 italic bg-slate-50 p-1.5 rounded border border-slate-100">
                                      &ldquo;{ans.answerText || "(Tidak dijawab)"}&rdquo;
                                    </p>
                                  ) : (
                                    <p className="text-slate-700">
                                      Pilihan Murid: <strong>{ans.selectedOptionText || "-"}</strong>{" "}
                                      {ans.isCorrect ? (
                                        <span className="text-emerald-600 font-bold">✓ Benar</span>
                                      ) : (
                                        <span className="text-rose-600 font-bold">✕ Salah</span>
                                      )}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                                <span className="font-bold text-slate-800">
                                  {isGraded ? `${ans.awardedPoints} / ${ans.points} Poin` : `? / ${ans.points} Poin`}
                                </span>
                                {isEssay && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openGradingModal(p, ans)}
                                    className="h-7 text-[11px] gap-1 font-bold"
                                  >
                                    <Edit className="h-3 w-3" />
                                    <span>{isGraded ? "Koreksi Ulang" : "Beri Nilai"}</span>
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ❓ TAB 3: ANALISIS BUTIR PERTANYAAN */}
      {activeTab === "QUESTIONS" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {questionStats.map((qs: any) => {
              const isHigh = qs.accuracy >= 80;
              const isMid = qs.accuracy >= 50 && qs.accuracy < 80;

              return (
                <Card key={qs.questionId} className="p-5 rounded-2xl border-2 border-slate-200 bg-white space-y-4 shadow-xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#EBF7D9] text-[#4B7914] font-black text-xs">
                        #{qs.orderNumber}
                      </span>
                      <Badge variant="outline" className="text-xs font-bold">
                        {qs.type === "MULTIPLE_CHOICE" ? "Pilihan Ganda" : qs.type === "TRUE_FALSE" ? "Benar/Salah" : "Esai / Uraian"}
                      </Badge>
                      <span className="text-xs font-semibold text-slate-500">
                        Bobot: {qs.points} Poin
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-500">Tingkat Ketepatan Kelas:</span>
                      <span
                        className={cn(
                          "px-2.5 py-0.5 rounded-full text-xs font-black",
                          isHigh ? "bg-emerald-100 text-emerald-800" : isMid ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-800"
                        )}
                      >
                        {qs.accuracy}% ({qs.correctCount}/{qs.totalAnswered} Benar)
                      </span>
                    </div>
                  </div>

                  <p className="text-sm font-semibold text-slate-900 leading-relaxed">
                    {qs.questionText}
                  </p>

                  {/* Options breakdown */}
                  {qs.options.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                      {qs.options.map((opt: any, oIdx: number) => {
                        const optKey = opt.optionKey || String.fromCharCode(65 + oIdx);
                        const isCorrect = Boolean(opt.isCorrect);
                        const count = qs.optionCounts[opt.id] || 0;
                        const pct = qs.totalAnswered > 0 ? Math.round((count / qs.totalAnswered) * 100) : 0;

                        return (
                          <div
                            key={opt.id || oIdx}
                            className={cn(
                              "p-3 rounded-xl border flex items-center justify-between gap-2",
                              isCorrect
                                ? "bg-emerald-50/80 border-emerald-300 font-bold text-emerald-900"
                                : "bg-slate-50 border-slate-200 text-slate-700"
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-black">({optKey})</span>
                              <span>{opt.optionText}</span>
                              {isCorrect && (
                                <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.2 rounded font-black">
                                  KUNCI
                                </span>
                              )}
                            </div>
                            <span className="text-xs font-black shrink-0 text-slate-500">
                              {count} Siswa ({pct}%)
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* ✍️ TAB 4: KOREKSI ESAI TERPUSAT */}
      {activeTab === "ESSAY_GRADING" && (
        <div className="space-y-4">
          {pendingEssays.length === 0 ? (
            <Card className="p-12 text-center rounded-2xl border-dashed border-slate-200 bg-slate-50">
              <p className="text-xs font-bold text-slate-500">
                Ujian ini tidak memiliki butir soal esai / uraian yang perlu dikoreksi.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {pendingEssays.map((item: any, idx: number) => (
                <Card key={idx} className="p-5 rounded-2xl border-2 border-slate-200 bg-white space-y-3 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div>
                      <h4 className="text-sm font-black text-slate-900">{item.student.name}</h4>
                      <p className="text-xs text-slate-500">Kelas {item.student.className} • Percobaan #{item.attempt.attemptNumber}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      {item.isGraded ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                          Sudah Dinilai: {item.answer.awardedPoints} / {item.answer.points} Poin
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                          Menunggu Penilaian (Maks {item.answer.points} Poin)
                        </span>
                      )}

                      <Button
                        size="sm"
                        onClick={() => openGradingModal(item.student, item.answer)}
                        className="text-xs font-bold bg-[#7AB82A] hover:bg-[#689f22] text-white"
                      >
                        <Edit className="h-3.5 w-3.5 mr-1" />
                        <span>{item.isGraded ? "Edit Nilai" : "Beri Nilai"}</span>
                      </Button>
                    </div>
                  </div>

                  <div className="text-xs space-y-1.5">
                    <p className="font-bold text-slate-700">Pertanyaan Soal:</p>
                    <p className="text-slate-900 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      {item.answer.questionText}
                    </p>

                    <p className="font-bold text-slate-700 pt-1">Jawaban Murid:</p>
                    <p className="text-slate-900 bg-blue-50/50 p-3 rounded-xl border border-blue-200 whitespace-pre-line italic">
                      &ldquo;{item.answer.answerText || "(Murid tidak mengisi jawaban esai ini)"}&rdquo;
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 🔍 CELL DETAIL MODAL (When clicking question cell in Matrix) */}
      <Dialog open={Boolean(selectedCellDetail)} onOpenChange={() => setSelectedCellDetail(null)}>
        <DialogHeader>
          <DialogTitle>Detail Jawaban Butir Soal</DialogTitle>
          <DialogDescription>
            Peserta: <strong>{selectedCellDetail?.student.name}</strong> (Kelas {selectedCellDetail?.student.className})
          </DialogDescription>
        </DialogHeader>

        {selectedCellDetail && (
          <div className="space-y-4 my-2 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="font-bold text-slate-500 uppercase text-[10px] block">Pertanyaan Soal:</span>
              <p className="text-sm font-semibold text-slate-900">{selectedCellDetail.question.questionText}</p>
              {selectedCellDetail.question.questionImage && (
                <div className="mt-2 max-w-sm rounded-lg overflow-hidden border border-slate-200 bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedCellDetail.question.questionImage}
                    alt="Gambar Soal"
                    className="max-h-48 w-auto object-contain rounded-md"
                  />
                </div>
              )}
            </div>

            {selectedCellDetail.question.type === "ESSAY" ? (
              <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 space-y-1">
                <span className="font-bold text-blue-900 uppercase text-[10px] block">Jawaban Esai Siswa:</span>
                <p className="text-sm text-slate-900 whitespace-pre-line">
                  {selectedCellDetail.answer?.answerText || "(Tidak dijawab)"}
                </p>
                <div className="pt-2">
                  <Button
                    size="sm"
                    onClick={() => openGradingModal(selectedCellDetail.student, selectedCellDetail.answer)}
                    className="bg-[#7AB82A] text-white text-xs font-bold"
                  >
                    <Edit className="h-3.5 w-3.5 mr-1" />
                    <span>Koreksi & Beri Poin Nilai</span>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <span className="font-bold text-slate-700">Pilihan Jawaban:</span>
                <div className="space-y-1.5">
                  {selectedCellDetail.question.options?.map((opt: any, oIdx: number) => {
                    const optKey = opt.optionKey || String.fromCharCode(65 + oIdx);
                    const isSelected = selectedCellDetail.answer?.selectedOptionId === opt.id;
                    const isCorrect = Boolean(opt.isCorrect);

                    return (
                      <div
                        key={opt.id || oIdx}
                        className={cn(
                          "p-2.5 rounded-xl border flex items-center justify-between text-xs font-semibold",
                          isSelected && isCorrect && "bg-emerald-50 border-emerald-400 text-emerald-950 font-bold",
                          isSelected && !isCorrect && "bg-rose-50 border-rose-400 text-rose-950 font-bold",
                          !isSelected && isCorrect && "bg-emerald-50/40 border-emerald-200 text-emerald-800",
                          !isSelected && !isCorrect && "bg-white border-slate-200 text-slate-700"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-black">({optKey})</span>
                          <span>{opt.optionText}</span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {isSelected && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-slate-900 text-white">
                              Pilihan Murid
                            </span>
                          )}
                          {isCorrect && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-600 text-white">
                              ✓ Kunci Benar
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setSelectedCellDetail(null)}>
            Tutup
          </Button>
        </DialogFooter>
      </Dialog>

      {/* 🏆 LIVE LEADERBOARD MODAL */}
      <Dialog open={showLeaderboardModal} onOpenChange={setShowLeaderboardModal}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            <span>Papan Peringkat Peserta Ujian</span>
          </DialogTitle>
          <DialogDescription>
            Peringkat nilai pengerjaan seluruh peserta ({processedParticipants.length} Murid)
          </DialogDescription>
        </DialogHeader>

        <div className="my-3 space-y-2 max-h-[60vh] overflow-y-auto pr-1">
          {processedParticipants.map((p: any, idx: number) => {
            const isRank1 = idx === 0;
            const isRank2 = idx === 1;
            const isRank3 = idx === 2;

            return (
              <div
                key={p.studentId}
                className={cn(
                  "flex items-center justify-between p-3.5 rounded-xl border transition-all",
                  isRank1
                    ? "bg-amber-50 border-amber-300 shadow-xs"
                    : isRank2
                    ? "bg-slate-50 border-slate-300 shadow-xs"
                    : isRank3
                    ? "bg-orange-50 border-orange-300 shadow-xs"
                    : "bg-white border-slate-200"
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-black text-xs",
                      isRank1
                        ? "bg-amber-500 text-white shadow-xs"
                        : isRank2
                        ? "bg-slate-400 text-white"
                        : isRank3
                        ? "bg-orange-500 text-white"
                        : "bg-slate-100 text-slate-700"
                    )}
                  >
                    {idx + 1}
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900">{p.name}</h4>
                    <p className="text-[10px] text-slate-500 font-semibold">Kelas {p.className}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-base font-black text-[#4B7914]">{p.effectiveScore}</span>
                  <span className="text-[10px] text-slate-500 block font-semibold">
                    {p.earnedPoints}/{p.maxPoints} Poin
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setShowLeaderboardModal(false)}>
            Tutup
          </Button>
        </DialogFooter>
      </Dialog>

      {/* ✍️ GRADE ESSAY MODAL */}
      <Dialog open={Boolean(gradingAnswer)} onOpenChange={() => setGradingAnswer(null)}>
        <DialogHeader>
          <DialogTitle>Koreksi & Penilaian Jawaban Esai</DialogTitle>
          <DialogDescription>
            Peserta: <strong>{gradingStudent?.name}</strong> (Kelas {gradingStudent?.className})
          </DialogDescription>
        </DialogHeader>

        {gradingAnswer && (
          <div className="space-y-4 my-2 text-xs">
            <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200">
              <span className="font-bold text-slate-500 uppercase text-[10px] block mb-1">
                Pertanyaan Soal (Bobot Maksimal: {gradingAnswer.points} Poin):
              </span>
              <p className="text-sm font-semibold text-slate-900">{gradingAnswer.questionText}</p>
              {gradingAnswer.questionImage && (
                <div className="mt-2 max-w-sm rounded-lg overflow-hidden border border-slate-200 bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={gradingAnswer.questionImage}
                    alt="Gambar Soal"
                    className="max-h-48 w-auto object-contain rounded-md"
                  />
                </div>
              )}
            </div>

            <div className="rounded-xl bg-blue-50/70 p-3.5 border border-blue-200">
              <span className="font-bold text-blue-900 uppercase text-[10px] block mb-1">
                Jawaban Murid:
              </span>
              <p className="text-sm text-slate-900 whitespace-pre-line leading-relaxed italic">
                &ldquo;{gradingAnswer.answerText || "(Murid tidak mengisi jawaban esai ini)"}&rdquo;
              </p>
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                Poin Nilai yang Diberikan (0 s/d {gradingAnswer.points}) <span className="text-rose-500">*</span>
              </label>
              <Input
                type="number"
                min={0}
                max={gradingAnswer.points}
                step={0.5}
                value={awardedPoints}
                onChange={(e) => setAwardedPoints(e.target.value)}
                placeholder={`Maksimal ${gradingAnswer.points}`}
                className="h-10 text-sm font-bold rounded-xl"
                autoFocus
              />
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                Catatan / Umpan Balik untuk Murid (Opsional)
              </label>
              <Textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Tuliskan catatan evaluasi jawaban ini..."
                rows={2}
                className="text-xs rounded-xl"
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setGradingAnswer(null)}>
            Batal
          </Button>
          <Button onClick={handleSaveGrade} isLoading={isSavingGrade} className="font-bold bg-[#7AB82A] text-white">
            Simpan Nilai
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
