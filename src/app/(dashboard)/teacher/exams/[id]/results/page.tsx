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
  Send,
  Copy,
  Trash2,
  RotateCcw,
  UserX,
  ExternalLink,
  MessageCircle,
  Eye,
  TrendingUp,
  AlertTriangle,
  FileText,
  Layers,
  ArrowUpDown,
  BookOpen,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { MathRenderer } from "@/components/ui/math-renderer";
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

  // Send Results to Parents Modal State
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendTargetMode, setSendTargetMode] = useState<"INDIVIDUAL" | "CLASS_BROADCAST">("INDIVIDUAL");
  const [selectedStudentForSend, setSelectedStudentForSend] = useState<any>(null);
  const [parentEmail, setParentEmail] = useState("");
  const [parentTelegram, setParentTelegram] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [customTeacherNote, setCustomTeacherNote] = useState("Alhamdulillah, teruslah bersemangat dalam menuntut ilmu dan tingkatkan prestasi belajarmu!");
  const [passingScore, setPassingScore] = useState<number>(75);

  // Edit Participant Modal State
  const [editingParticipant, setEditingParticipant] = useState<any>(null);
  const [editName, setEditName] = useState("");
  const [editNis, setEditNis] = useState("");
  const [editClassId, setEditClassId] = useState("");
  const [isSavingParticipant, setIsSavingParticipant] = useState(false);

  // Delete Participant Modal State
  const [deletingParticipant, setDeletingParticipant] = useState<any>(null);
  const [deleteMode, setDeleteMode] = useState<"exam_only" | "permanent">("exam_only");
  const [isDeletingParticipant, setIsDeletingParticipant] = useState(false);

  // Reset Attempt Modal State
  const [resettingParticipant, setResettingParticipant] = useState<any>(null);
  const [resetReason, setResetReason] = useState("Ujian ulang atas persetujuan guru pengampu");
  const [isResettingAttempt, setIsResettingAttempt] = useState(false);

  // Individual Student Result Download / View Modal State
  const [selectedStudentForDownload, setSelectedStudentForDownload] = useState<any>(null);
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  const openDownloadModal = (participant: any) => {
    setSelectedStudentForDownload(participant);
    setShowDownloadModal(true);
  };

  const handleDownloadTextReport = (participant: any) => {
    if (!participant || !data?.exam) return;
    const currentExam = data.exam;
    const att = participant.selectedAttempt || participant.attempts?.[0];
    let text = `=======================================================\n`;
    text += `         LEMBAR HASIL PENGERJAAN UJIAN SISWA\n`;
    text += `          ${currentExam.school?.name || "WhiteBee School of Life"}\n`;
    text += `=======================================================\n\n`;
    text += `Nama Ujian     : ${currentExam.title}\n`;
    text += `Mata Pelajaran : ${currentExam.subject?.name || "-"}\n`;
    text += `Guru Pengampu  : ${currentExam.teacher?.name || "-"}\n`;
    text += `Tanggal Ujian  : ${formatDate(currentExam.startDate || currentExam.createdAt)}\n\n`;
    text += `--- DATA PESERTA ---\n`;
    text += `Nama Siswa     : ${participant.name}\n`;
    text += `NIS            : ${participant.nis || "-"}\n`;
    text += `Kelas          : ${participant.className || "-"}\n`;
    text += `Nilai Akhir    : ${participant.effectiveScore ?? participant.finalScore ?? 0} / 100\n`;
    text += `Total Poin     : ${participant.earnedPoints ?? 0} dari ${participant.maxPoints ?? 100} poin\n`;
    text += `Status         : ${(participant.effectiveScore ?? participant.finalScore ?? 0) >= passingScore ? "LULUS" : "REMEDIAL (Di bawah KKM " + passingScore + ")"}\n\n`;
    text += `=======================================================\n`;
    text += `                 RINCIAN JAWABAN SOAL\n`;
    text += `=======================================================\n\n`;

    (currentExam.questions || []).forEach((q: any, idx: number) => {
      const ans = att?.answers?.find((a: any) => a.questionId === q.id);
      const isEssay = q.type === "ESSAY";
      text += `Soal #${idx + 1} [${q.type === "MULTIPLE_CHOICE" ? "Pilihan Ganda" : q.type === "TRUE_FALSE" ? "Benar/Salah" : "Esai"}] - Bobot: ${q.points} pt\n`;
      text += `Pertanyaan : ${q.questionText}\n`;
      if (isEssay) {
        text += `Jawaban Siswa   : ${ans?.answerText || "(Tidak dijawab)"}\n`;
        text += `Nilai Diberikan : ${ans?.awardedPoints ?? "Belum dinilai"} / ${q.points} pt\n`;
        if (ans?.feedback) text += `Catatan Guru    : ${ans.feedback}\n`;
      } else {
        const correctOpt = q.options?.find((o: any) => o.isCorrect);
        text += `Jawaban Siswa   : ${ans?.selectedOptionKey ? `${ans.selectedOptionKey}. ${ans.selectedOptionText || ""}` : "(Tidak dijawab)"} [${ans?.isCorrect ? "BENAR ✅" : "SALAH ❌"}]\n`;
        text += `Kunci Jawaban   : ${correctOpt?.optionKey || "-"}. ${correctOpt?.optionText || ""}\n`;
        text += `Poin Diperoleh  : ${ans?.isCorrect ? q.points : 0} / ${q.points} pt\n`;
      }
      text += `-------------------------------------------------------\n\n`;
    });

    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Hasil_Ujian_${participant.name.replace(/\s+/g, "_")}_${currentExam.title.replace(/\s+/g, "_")}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`Laporan hasil pengerjaan ${participant.name} berhasil diunduh!`);
  };

  const handlePrintStudentReport = () => {
    window.print();
  };


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

  const { exam, questions = [], stats = {}, participants = [], classes = [] } = data || {};

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

  const handleOpenSendModal = (student?: any, mode?: "INDIVIDUAL" | "CLASS_BROADCAST") => {
    if (student) {
      setSelectedStudentForSend(student);
      setSendTargetMode("INDIVIDUAL");
    } else {
      if (mode === "CLASS_BROADCAST") {
        setSendTargetMode("CLASS_BROADCAST");
      } else {
        setSendTargetMode("INDIVIDUAL");
        if (!selectedStudentForSend && processedParticipants.length > 0) {
          setSelectedStudentForSend(processedParticipants[0]);
        }
      }
    }
    setShowSendModal(true);
  };

  const currentSendStudent = useMemo(() => {
    if (!selectedStudentForSend) return processedParticipants[0] || null;
    return processedParticipants.find((p: any) => p.studentId === selectedStudentForSend.studentId) || selectedStudentForSend;
  }, [selectedStudentForSend, processedParticipants]);

  const generateStudentReportText = (student: any) => {
    if (!student || !exam) return "";
    const score = student.effectiveScore ?? student.finalScore ?? 0;
    const isPassed = score >= passingScore;
    const statusEmoji = isPassed ? "✅" : "⚠️";
    const statusText = isPassed ? "TUNTAS / MEMUASKAN" : "PERLU PENDAMPINGAN";
    const dateStr = new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    return `📋 *LAPORAN HASIL EVALUASI UJIAN SISWA*
━━━━━━━━━━━━━━━━━━━━━━
🏫 *Sekolah*: ${exam.schoolName || "Sekolah"}
📚 *Mata Pelajaran*: ${exam.subjectName}
📝 *Ujian*: ${exam.title}
👨‍🏫 *Guru Pengampu*: ${exam.teacherName || "-"}
📅 *Tanggal*: ${dateStr}

👤 *Data Murid*:
• *Nama*: ${student.name}
• *Kelas*: Kelas ${student.className}
• *NIS*: ${student.nis || "-"}

🎯 *Hasil Penilaian*:
• *Nilai Akhir*: *${score} / 100*
• *Poin Diperoleh*: ${student.earnedPoints ?? 0} dari ${student.maxPoints ?? 100} Poin
• *Jumlah Percobaan*: ${student.totalAttempts || 1}x
• *Status Kelulusan*: ${statusEmoji} *${statusText}* (KKM: ${passingScore})

💬 *Catatan Guru*:
"${customTeacherNote || "Terima kasih atas kerja keras Ananda dalam pengerjaan ujian ini."}"

━━━━━━━━━━━━━━━━━━━━━━
_Laporan resmi dari Sistem Evaluasi Terpadu ${exam.schoolName || "Sekolah"}._`;
  };

  const generateClassBroadcastText = () => {
    if (!exam || !processedParticipants.length) return "";
    const sorted = [...processedParticipants].sort((a, b) => (b.effectiveScore ?? 0) - (a.effectiveScore ?? 0));
    const dateStr = new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const studentListText = sorted
      .map((p, idx) => {
        const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `${idx + 1}.`;
        const score = p.effectiveScore ?? p.finalScore ?? 0;
        const isPass = score >= passingScore;
        return `${medal} ${p.name} (Kelas ${p.className}): *${score}* ${isPass ? "✅" : "⚠️"}`;
      })
      .join("\n");

    return `📊 *REKAPITULASI HASIL UJIAN KELAS*
━━━━━━━━━━━━━━━━━━━━━━
🏫 *Sekolah*: ${exam.schoolName || "Sekolah"}
📚 *Mata Pelajaran*: ${exam.subjectName}
📝 *Ujian*: ${exam.title}
👨‍🏫 *Guru Pengampu*: ${exam.teacherName || "-"}
📅 *Tanggal*: ${dateStr}

👥 *Total Peserta*: ${participants.length} Murid
📈 *Rata-rata Nilai Kelas*: *${stats.averageScore || 0}*
🏆 *Nilai Tertinggi*: *${stats.highestScore || 0}*
📉 *Nilai Terendah*: *${stats.lowestScore || 0}*

📋 *Daftar Nilai Siswa (Peringkat)*:
${studentListText}

━━━━━━━━━━━━━━━━━━━━━━
_Terima kasih atas perhatian dan dukungan penuh Bapak/Ibu Orang Tua/Wali Murid._`;
  };

  const handleSendTelegram = () => {
    const text = sendTargetMode === "INDIVIDUAL" ? generateStudentReportText(currentSendStudent) : generateClassBroadcastText();
    if (!text) return;

    const cleanUser = parentTelegram.trim().replace(/^@/, "");
    if (cleanUser) {
      const url = `https://t.me/${cleanUser}`;
      window.open(url, "_blank");
      navigator.clipboard.writeText(text);
      toast.success(`Membuka profil @${cleanUser} di Telegram. Teks laporan telah disalin untuk dikirimkan!`);
    } else {
      const url = `https://t.me/share/url?url=${encodeURIComponent(window.location.origin)}&text=${encodeURIComponent(text)}`;
      window.open(url, "_blank");
      toast.success("Membuka Telegram untuk membagikan laporan...");
    }
  };

  const handleSendEmail = () => {
    if (sendTargetMode === "INDIVIDUAL" && !currentSendStudent) return;
    const subject = sendTargetMode === "INDIVIDUAL"
      ? `[Laporan Hasil Ujian] ${currentSendStudent.name} - ${exam.title} (${exam.subjectName})`
      : `[Rekapitulasi Hasil Ujian] ${exam.title} - ${exam.subjectName}`;
    const text = sendTargetMode === "INDIVIDUAL" ? generateStudentReportText(currentSendStudent) : generateClassBroadcastText();

    const mailto = `mailto:${encodeURIComponent(parentEmail.trim())}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
    window.location.href = mailto;
    toast.success("Membuka aplikasi email...");
  };

  const handleSendWhatsApp = () => {
    const text = sendTargetMode === "INDIVIDUAL" ? generateStudentReportText(currentSendStudent) : generateClassBroadcastText();
    if (!text) return;

    let cleanPhone = parentPhone.replace(/[^0-9]/g, "");
    if (cleanPhone.startsWith("0")) {
      cleanPhone = "62" + cleanPhone.slice(1);
    }
    const url = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}` : `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
    toast.success("Membuka WhatsApp untuk mengirim laporan...");
  };

  const handleCopyReport = () => {
    const text = sendTargetMode === "INDIVIDUAL" ? generateStudentReportText(currentSendStudent) : generateClassBroadcastText();
    if (!text) return;

    navigator.clipboard.writeText(text);
    toast.success("Format teks laporan berhasil disalin ke clipboard!");
  };

  // Participant Management Handlers
  const openEditParticipantModal = (participant: any) => {
    setEditingParticipant(participant);
    setEditName(participant.name || "");
    setEditNis(participant.nis || "");
    setEditClassId(participant.classId || "");
  };

  const handleSaveParticipant = async () => {
    if (!editingParticipant) return;
    if (!editName.trim()) {
      toast.error("Nama siswa tidak boleh kosong.");
      return;
    }

    setIsSavingParticipant(true);
    try {
      const res = await fetch(`/api/v1/teacher/exams/${examId}/participants/${editingParticipant.studentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          nis: editNis.trim() || null,
          classId: editClassId || undefined,
        }),
      });

      const resData = await res.json();
      if (resData.success) {
        toast.success(resData.message || "Data peserta berhasil diperbarui!");
        setEditingParticipant(null);
        fetchResults();
      } else {
        toast.error(resData.error?.message || "Gagal memperbarui data peserta.");
      }
    } catch {
      toast.error("Terjadi kesalahan saat menyimpan data peserta.");
    } finally {
      setIsSavingParticipant(false);
    }
  };

  const openDeleteParticipantModal = (participant: any) => {
    setDeletingParticipant(participant);
    setDeleteMode("exam_only");
  };

  const handleDeleteParticipant = async () => {
    if (!deletingParticipant) return;

    setIsDeletingParticipant(true);
    try {
      const res = await fetch(`/api/v1/teacher/exams/${examId}/participants/${deletingParticipant.studentId}?mode=${deleteMode}`, {
        method: "DELETE",
      });

      const resData = await res.json();
      if (resData.success) {
        toast.success(resData.message || "Peserta berhasil dihapus.");
        setDeletingParticipant(null);
        fetchResults();
      } else {
        toast.error(resData.error?.message || "Gagal menghapus peserta.");
      }
    } catch {
      toast.error("Terjadi kesalahan saat menghapus peserta.");
    } finally {
      setIsDeletingParticipant(false);
    }
  };

  const openResetAttemptModal = (participant: any) => {
    setResettingParticipant(participant);
    setResetReason("Ujian ulang atas persetujuan guru pengampu");
  };

  const handleResetAttempt = async () => {
    if (!resettingParticipant) return;

    setIsResettingAttempt(true);
    try {
      const res = await fetch(`/api/v1/teacher/exams/${examId}/participants/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: resettingParticipant.studentId,
          reason: resetReason.trim() || "Reset pengerjaan ujian oleh guru",
        }),
      });

      const resData = await res.json();
      if (resData.success) {
        toast.success(resData.message || "Percobaan ujian berhasil direset!");
        setResettingParticipant(null);
        fetchResults();
      } else {
        toast.error(resData.error?.message || "Gagal mereset percobaan ujian.");
      }
    } catch {
      toast.error("Terjadi kesalahan saat mereset ujian.");
    } finally {
      setIsResettingAttempt(false);
    }
  };

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
            onClick={() => handleOpenSendModal(null, "INDIVIDUAL")}
            className="text-xs font-black gap-1.5 bg-[#0088cc] hover:bg-[#0077b5] text-white shadow-sm border-0"
            title="Kirim laporan hasil ujian ke Email atau Telegram Orang Tua"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Kirim Hasil ke Orang Tua</span>
          </Button>

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

            {/* Search & Actions */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => handleOpenSendModal(null, "CLASS_BROADCAST")}
                className="h-8 text-xs font-bold gap-1.5 border-sky-300 text-sky-800 bg-sky-50 hover:bg-sky-100 shrink-0"
                title="Kirim atau bagikan rekap nilai 1 kelas ke Telegram / Email"
              >
                <Send className="h-3 w-3 text-[#0088cc]" />
                <span>Broadcast Kelas</span>
              </Button>

              <div className="relative w-full sm:w-56">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  placeholder="Cari nama murid..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-8 text-xs rounded-xl bg-slate-50 border-slate-200"
                />
              </div>
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
                          {/* Sticky Student Name & Class & Actions */}
                          <td className="p-3 sticky left-0 bg-white hover:bg-slate-50 z-10 border-r border-slate-200">
                            <div className="flex items-center justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-slate-900 leading-snug truncate" title={p.name}>
                                    {p.name}
                                  </span>
                                  {att?.status === "IN_PROGRESS" && (
                                    <span
                                      className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-100 text-amber-800 border border-amber-300 shrink-0 inline-flex items-center gap-1"
                                      title="Murid sedang aktif mengerjakan ujian (Autosave Real-Time)"
                                    >
                                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                                      Sedang Ujian
                                    </span>
                                  )}
                                  {att?.status === "SUBMITTED" && (
                                    <span
                                      className="px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0"
                                      title="Murid sudah selesai dan mengumpulkan ujian"
                                    >
                                      ✓ Selesai
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-500 font-semibold mt-0.5">
                                  Kelas {p.className} {p.nis ? `(${p.nis})` : ""}
                                </div>
                              </div>

                              {/* Action Buttons: Download, Edit, Delete, Send */}
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openDownloadModal(p);
                                  }}
                                  title={`Unduh / Lihat Lembar Hasil Pengerjaan ${p.name}`}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                                >
                                  <Download className="h-3.5 w-3.5" />
                                </button>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openEditParticipantModal(p);
                                  }}
                                  title={`Edit nama / data ${p.name}`}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                </button>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openDeleteParticipantModal(p);
                                  }}
                                  title={`Hapus ${p.name} dari ujian ini`}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenSendModal(p, "INDIVIDUAL");
                                  }}
                                  title={`Kirim laporan hasil ${p.name} ke Email / Telegram Orang Tua`}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-[#0088cc] hover:bg-sky-50 transition-colors cursor-pointer"
                                >
                                  <Send className="h-3.5 w-3.5" />
                                </button>
                              </div>
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
                            {att?.status === "IN_PROGRESS" && (
                              <div className="text-[9px] font-bold text-amber-600 mt-0.5">
                                (Progres Live)
                              </div>
                            )}
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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-3.5 rounded-2xl border border-slate-200">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input
                placeholder="Cari nama murid atau kelas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
              <Button
                type="button"
                size="sm"
                onClick={() => handleOpenSendModal(null, "CLASS_BROADCAST")}
                className="h-9 text-xs font-black gap-1.5 bg-[#0088cc] hover:bg-[#0077b5] text-white shadow-xs rounded-xl"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Broadcast Rekap Kelas</span>
              </Button>

              <div className="text-xs font-bold text-slate-600">
                Metode: <Badge variant="outline">{exam.gradingMethod}</Badge>
              </div>
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

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => openEditParticipantModal(p)}
                      className="text-xs font-bold gap-1 border-slate-300 hover:bg-slate-100 rounded-xl cursor-pointer"
                      title={`Edit data ${p.name}`}
                    >
                      <Edit className="h-3.5 w-3.5 text-amber-600" />
                      <span>Edit</span>
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => openResetAttemptModal(p)}
                      className="text-xs font-bold gap-1 border-amber-300 text-amber-900 bg-amber-50/60 hover:bg-amber-100 rounded-xl cursor-pointer"
                      title={`Reset pengerjaan ujian untuk ${p.name}`}
                    >
                      <RotateCcw className="h-3.5 w-3.5 text-amber-600" />
                      <span>Reset</span>
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => openDeleteParticipantModal(p)}
                      className="text-xs font-bold gap-1 border-rose-200 text-rose-700 bg-rose-50/50 hover:bg-rose-100 rounded-xl cursor-pointer"
                      title={`Hapus ${p.name} dari ujian ini`}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                      <span>Hapus</span>
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => openDownloadModal(p)}
                      className="text-xs font-bold gap-1.5 border-emerald-300 text-emerald-800 bg-emerald-50/60 hover:bg-emerald-100 rounded-xl cursor-pointer"
                      title={`Unduh / Cetak Lembar Hasil Pengerjaan ${p.name}`}
                    >
                      <Download className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Unduh Hasil</span>
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenSendModal(p, "INDIVIDUAL")}
                      className="text-xs font-bold gap-1.5 border-sky-300 text-sky-800 bg-sky-50/60 hover:bg-sky-100 rounded-xl cursor-pointer"
                      title={`Kirim laporan hasil ${p.name} ke Email / Telegram Orang Tua`}
                    >
                      <Send className="h-3.5 w-3.5 text-[#0088cc]" />
                      <span>Kirim Rapor</span>
                    </Button>

                    <div className="text-right pl-2 border-l border-slate-200">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Nilai Akhir
                      </span>
                      <span className="text-2xl font-black text-[#4B7914]">
                        {p.effectiveScore ?? p.finalScore ?? 0}
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

                  <div className="text-sm font-semibold text-slate-900 leading-relaxed">
                    <MathRenderer content={qs.questionText} />
                  </div>

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
                            <div className="flex items-center gap-2 flex-1">
                              <span className="font-black shrink-0">({optKey})</span>
                              <span className="flex-1">
                                <MathRenderer content={opt.optionText} />
                              </span>
                              {isCorrect && (
                                <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.2 rounded font-black shrink-0">
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
                    <div className="text-slate-900 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <MathRenderer content={item.answer.questionText} />
                    </div>

                    <p className="font-bold text-slate-700 pt-1">Jawaban Murid:</p>
                    <div className="text-slate-900 bg-blue-50/50 p-3 rounded-xl border border-blue-200 whitespace-pre-line italic">
                      <MathRenderer content={item.answer.answerText || "(Murid tidak mengisi jawaban esai ini)"} />
                    </div>
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
              <div className="text-sm font-semibold text-slate-900">
                <MathRenderer content={selectedCellDetail.question.questionText} />
              </div>
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
                <div className="text-sm text-slate-900 whitespace-pre-line">
                  <MathRenderer content={selectedCellDetail.answer?.answerText || "(Tidak dijawab)"} />
                </div>
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
                        <div className="flex items-center gap-2 flex-1">
                          <span className="font-black shrink-0">({optKey})</span>
                          <span className="flex-1">
                            <MathRenderer content={opt.optionText} />
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
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

        <DialogFooter className="flex flex-col-reverse sm:flex-row items-center justify-between gap-2 w-full pt-2">
          {selectedCellDetail && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                const student = selectedCellDetail.student;
                setSelectedCellDetail(null);
                handleOpenSendModal(student, "INDIVIDUAL");
              }}
              className="text-xs font-bold gap-1.5 border-sky-300 text-sky-800 bg-sky-50 hover:bg-sky-100 w-full sm:w-auto"
            >
              <Send className="h-3.5 w-3.5 text-[#0088cc]" />
              <span>Kirim Hasil {selectedCellDetail.student?.name} ke Orang Tua</span>
            </Button>
          )}

          <Button variant="outline" size="sm" onClick={() => setSelectedCellDetail(null)} className="w-full sm:w-auto">
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
              <div className="text-sm font-semibold text-slate-900">
                <MathRenderer content={gradingAnswer.questionText} />
              </div>
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

      {/* 🚀 MODAL: KIRIM HASIL UJIAN KE EMAIL / TELEGRAM / WA ORANG TUA */}
      <Dialog open={showSendModal} onOpenChange={setShowSendModal}>
        <DialogHeader>
          <div className="flex items-center gap-2 text-sky-600 mb-1">
            <Send className="h-5 w-5" />
            <span className="text-xs font-black uppercase tracking-wider">Komunikasi Orang Tua / Wali</span>
          </div>
          <DialogTitle className="text-lg font-black text-slate-900">
            Kirim Hasil Ujian ke Email / Telegram Orang Tua
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Bagikan rincian nilai, pencapaian, dan apresiasi evaluasi siswa langsung ke <strong>Telegram</strong>, <strong>Email</strong>, atau <strong>WhatsApp</strong> orang tua.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-2 text-xs max-h-[75vh] overflow-y-auto pr-1">
          {/* Mode Switcher: Individu vs Broadcast Kelas */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setSendTargetMode("INDIVIDUAL")}
              className={cn(
                "py-2 px-3 rounded-lg font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer",
                sendTargetMode === "INDIVIDUAL"
                  ? "bg-white text-slate-900 shadow-xs ring-1 ring-slate-200"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <Users className="h-3.5 w-3.5" />
              <span>Laporan Per Siswa</span>
            </button>

            <button
              type="button"
              onClick={() => setSendTargetMode("CLASS_BROADCAST")}
              className={cn(
                "py-2 px-3 rounded-lg font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer",
                sendTargetMode === "CLASS_BROADCAST"
                  ? "bg-white text-slate-900 shadow-xs ring-1 ring-slate-200"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>Rekapitulasi 1 Kelas</span>
            </button>
          </div>

          {sendTargetMode === "INDIVIDUAL" ? (
            <div className="space-y-4">
              {/* Student Selector */}
              <div className="space-y-1.5">
                <label className="block font-black text-slate-700 uppercase tracking-wider text-[11px]">
                  Pilih Siswa Target:
                </label>
                <select
                  value={currentSendStudent?.studentId || ""}
                  onChange={(e) => {
                    const found = processedParticipants.find((p: any) => p.studentId === e.target.value);
                    if (found) setSelectedStudentForSend(found);
                  }}
                  className="w-full bg-white border-2 border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#7AB82A] cursor-pointer"
                >
                  {processedParticipants.map((p: any) => (
                    <option key={p.studentId} value={p.studentId}>
                      {p.name} — Kelas {p.className} (Nilai: {p.effectiveScore ?? p.finalScore ?? 0})
                    </option>
                  ))}
                </select>
              </div>

              {/* Student Result Highlight Card */}
              {currentSendStudent && (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-[#F4FBEB] to-[#E5F7C7] border-2 border-[#D5EFA9] space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-black text-sm text-slate-900">{currentSendStudent.name}</h4>
                      <p className="text-[11px] font-semibold text-slate-600">
                        Kelas {currentSendStudent.className} • NIS: {currentSendStudent.nis || "-"}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                        Nilai Akhir
                      </span>
                      <span className="text-2xl font-black text-[#4B7914]">
                        {currentSendStudent.effectiveScore ?? currentSendStudent.finalScore ?? 0}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#D5EFA9]">
                    <Badge className={cn(
                      "text-[10px] font-black",
                      (currentSendStudent.effectiveScore ?? 0) >= passingScore
                        ? "bg-emerald-600 text-white"
                        : "bg-rose-600 text-white"
                    )}>
                      {(currentSendStudent.effectiveScore ?? 0) >= passingScore ? "✓ TUNTAS / LULUS" : "⚠️ PERLU BIMBINGAN"}
                    </Badge>
                    <span className="text-[11px] text-slate-600 font-semibold">
                      Poin: <strong>{currentSendStudent.earnedPoints ?? 0}/{currentSendStudent.maxPoints ?? 100}</strong>
                    </span>
                    <span className="text-[11px] text-slate-600 font-semibold">
                      • Percobaan: <strong>{currentSendStudent.totalAttempts || 1}x</strong>
                    </span>
                  </div>
                </div>
              )}

              {/* KKM & Catatan Guru */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-black text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                    Batas KKM (Kelulusan):
                  </label>
                  <Input
                    type="number"
                    value={passingScore}
                    onChange={(e) => setPassingScore(Number(e.target.value) || 0)}
                    min={0}
                    max={100}
                    className="h-9 text-xs font-bold rounded-xl"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-black text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                    Pesan / Catatan Apresiasi Guru:
                  </label>
                  <Input
                    value={customTeacherNote}
                    onChange={(e) => setCustomTeacherNote(e.target.value)}
                    placeholder="Tuliskan catatan apresiasi untuk murid dan orang tua..."
                    className="h-9 text-xs rounded-xl"
                  />
                </div>
              </div>

              {/* Kanal Pengiriman Langsung */}
              <div className="space-y-2.5 pt-2 border-t border-slate-200">
                <label className="block font-black text-slate-800 uppercase tracking-wider text-[11px]">
                  Pilih Kanal Pengiriman:
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* ✈️ TELEGRAM CARD */}
                  <div className="p-3.5 rounded-2xl border-2 border-sky-200 bg-sky-50/50 space-y-2.5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-sky-700 font-black text-xs">
                        <div className="h-6 w-6 rounded-full bg-[#0088cc] text-white flex items-center justify-center font-bold">
                          <Send className="h-3.5 w-3.5" />
                        </div>
                        <span>Telegram Orang Tua / Siswa</span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1 leading-normal">
                        Kirim langsung ke aplikasi Telegram orang tua atau ke grup kelas.
                      </p>
                    </div>

                    <div className="space-y-2 pt-1">
                      <Input
                        placeholder="Username Telegram (contoh: @wali_murid)"
                        value={parentTelegram}
                        onChange={(e) => setParentTelegram(e.target.value)}
                        className="h-8 text-xs bg-white rounded-xl border-sky-200"
                      />
                      <Button
                        type="button"
                        onClick={handleSendTelegram}
                        className="w-full text-xs font-black gap-2 bg-[#0088cc] hover:bg-[#0077b5] text-white rounded-xl h-9 shadow-xs cursor-pointer"
                      >
                        <Send className="h-3.5 w-3.5" />
                        <span>Kirim ke Telegram</span>
                      </Button>
                    </div>
                  </div>

                  {/* ✉️ EMAIL CARD */}
                  <div className="p-3.5 rounded-2xl border-2 border-slate-200 bg-slate-50/60 space-y-2.5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-slate-800 font-black text-xs">
                        <div className="h-6 w-6 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold">
                          <Mail className="h-3.5 w-3.5" />
                        </div>
                        <span>Email Orang Tua</span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1 leading-normal">
                        Buka aplikasi email (Gmail / Outlook) dengan format laporan siap kirim.
                      </p>
                    </div>

                    <div className="space-y-2 pt-1">
                      <Input
                        type="email"
                        placeholder="Email orang tua (contoh: orangtua@gmail.com)"
                        value={parentEmail}
                        onChange={(e) => setParentEmail(e.target.value)}
                        className="h-8 text-xs bg-white rounded-xl border-slate-300"
                      />
                      <Button
                        type="button"
                        onClick={handleSendEmail}
                        className="w-full text-xs font-black gap-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl h-9 shadow-xs cursor-pointer"
                      >
                        <Mail className="h-3.5 w-3.5" />
                        <span>Kirim via Email</span>
                      </Button>
                    </div>
                  </div>
                </div>

                {/* WhatsApp & One-Click Copy */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 rounded-2xl border border-emerald-200 bg-emerald-50/40 flex items-center gap-2">
                    <Input
                      placeholder="No. WA Orang Tua (contoh: 08123456789)"
                      value={parentPhone}
                      onChange={(e) => setParentPhone(e.target.value)}
                      className="h-8 text-xs bg-white rounded-xl border-emerald-200 flex-1"
                    />
                    <Button
                      type="button"
                      onClick={handleSendWhatsApp}
                      className="text-xs font-black gap-1.5 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl h-8 px-3 shrink-0 cursor-pointer"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      <span>WhatsApp</span>
                    </Button>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCopyReport}
                    className="h-9 text-xs font-bold gap-2 border-slate-300 rounded-xl cursor-pointer"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    <span>Salin Format Pesan Teks</span>
                  </Button>
                </div>
              </div>

              {/* Live Preview Box */}
              <div className="space-y-1.5 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="font-black text-slate-700 uppercase tracking-wider text-[10px]">
                    Pratinjau Pesan yang Akan Diterima Orang Tua:
                  </label>
                  <button
                    type="button"
                    onClick={handleCopyReport}
                    className="text-[10px] font-bold text-sky-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="h-3 w-3" />
                    <span>Salin Teks</span>
                  </button>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 text-slate-100 font-mono text-[11px] whitespace-pre-line leading-relaxed overflow-x-auto max-h-44 select-all border border-slate-800">
                  {generateStudentReportText(currentSendStudent)}
                </div>
              </div>
            </div>
          ) : (
            /* CLASS BROADCAST MODE */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-sky-50 border-2 border-sky-200 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-sm text-sky-950">Rekapitulasi Nilai Seluruh Kelas</h4>
                  <Badge className="bg-sky-600 text-white text-xs">{participants.length} Siswa</Badge>
                </div>
                <p className="text-xs text-sky-800 font-medium leading-relaxed">
                  Bagikan daftar peringkat dan rekapitulasi nilai seluruh peserta ujian ke grup Telegram Kelas atau Email Wali Kelas/Wali Murid.
                </p>
                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-sky-200 text-center text-xs font-bold">
                  <div>
                    <span className="text-[10px] text-sky-700 block uppercase">Rata-Rata</span>
                    <span className="text-base font-black text-sky-950">{stats.averageScore || 0}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-emerald-700 block uppercase">Tertinggi</span>
                    <span className="text-base font-black text-emerald-800">{stats.highestScore || 0}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-rose-700 block uppercase">Terendah</span>
                    <span className="text-base font-black text-rose-800">{stats.lowestScore || 0}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons for Broadcast */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button
                  type="button"
                  onClick={handleSendTelegram}
                  className="w-full text-xs font-black gap-2 bg-[#0088cc] hover:bg-[#0077b5] text-white rounded-xl h-10 shadow-xs cursor-pointer"
                >
                  <Send className="h-4 w-4" />
                  <span>Bagikan Rekap ke Grup Telegram</span>
                </Button>

                <Button
                  type="button"
                  onClick={handleSendEmail}
                  className="w-full text-xs font-black gap-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl h-10 shadow-xs cursor-pointer"
                >
                  <Mail className="h-4 w-4" />
                  <span>Kirim Rekap via Email</span>
                </Button>

                <Button
                  type="button"
                  onClick={handleSendWhatsApp}
                  className="w-full text-xs font-black gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl h-10 shadow-xs cursor-pointer"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Bagikan ke Grup WhatsApp</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCopyReport}
                  className="w-full text-xs font-bold gap-2 border-slate-300 rounded-xl h-10 cursor-pointer"
                >
                  <Copy className="h-4 w-4" />
                  <span>Salin Teks Rekap Kelas</span>
                </Button>
              </div>

              {/* Live Preview Box */}
              <div className="space-y-1.5 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="font-black text-slate-700 uppercase tracking-wider text-[10px]">
                    Pratinjau Pesan Rekapitulasi Kelas:
                  </label>
                  <button
                    type="button"
                    onClick={handleCopyReport}
                    className="text-[10px] font-bold text-sky-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="h-3 w-3" />
                    <span>Salin Teks</span>
                  </button>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 text-slate-100 font-mono text-[11px] whitespace-pre-line leading-relaxed overflow-x-auto max-h-48 select-all border border-slate-800">
                  {generateClassBroadcastText()}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-slate-100 pt-3">
          <Button variant="outline" onClick={() => setShowSendModal(false)} className="text-xs font-bold">
            Tutup
          </Button>
        </DialogFooter>
      </Dialog>

      {/* ✏️ MODAL: EDIT DATA PESERTA */}
      <Dialog open={Boolean(editingParticipant)} onOpenChange={() => setEditingParticipant(null)}>
        <DialogHeader>
          <div className="flex items-center gap-2 text-amber-600 mb-1">
            <Edit className="h-5 w-5" />
            <span className="text-xs font-black uppercase tracking-wider">Perbarui Identitas Siswa</span>
          </div>
          <DialogTitle className="text-lg font-black text-slate-900">
            Edit Data Peserta Ujian
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Ubah nama lengkap, NIS, atau kelas siswa. Perubahan ini akan otomatis sinkron pada lembar jawaban, rekapitulasi nilai, dan rapor.
          </DialogDescription>
        </DialogHeader>

        {editingParticipant && (
          <div className="space-y-4 my-2 text-xs">
            <div>
              <label className="block font-black text-slate-700 uppercase tracking-wider text-[11px] mb-1">
                Nama Lengkap Siswa <span className="text-rose-500">*</span>
              </label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Contoh: Muhammad Fatih"
                className="h-10 text-xs font-bold rounded-xl"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-black text-slate-700 uppercase tracking-wider text-[11px] mb-1">
                  Nomor Induk Siswa (NIS)
                </label>
                <Input
                  value={editNis}
                  onChange={(e) => setEditNis(e.target.value)}
                  placeholder="Contoh: 2026001 (Opsional)"
                  className="h-10 text-xs rounded-xl"
                />
              </div>

              <div>
                <label className="block font-black text-slate-700 uppercase tracking-wider text-[11px] mb-1">
                  Kelas Siswa
                </label>
                <select
                  value={editClassId}
                  onChange={(e) => setEditClassId(e.target.value)}
                  className="w-full h-10 bg-white border border-slate-300 rounded-xl px-3 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#7AB82A] cursor-pointer"
                >
                  {classes.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      Kelas {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <span className="font-bold text-slate-700 text-[11px]">Informasi Ujian:</span>
              <p className="text-slate-600 text-[11px]">
                Total Percobaan: <strong>{editingParticipant.totalAttempts}x</strong> • Nilai Saat Ini: <strong>{editingParticipant.effectiveScore ?? editingParticipant.finalScore ?? 0} Poin</strong>
              </p>
            </div>
          </div>
        )}

        <DialogFooter className="border-t border-slate-100 pt-3">
          <Button variant="outline" onClick={() => setEditingParticipant(null)} className="text-xs font-bold">
            Batal
          </Button>
          <Button
            onClick={handleSaveParticipant}
            isLoading={isSavingParticipant}
            className="text-xs font-black bg-[#7AB82A] hover:bg-[#689f22] text-white shadow-xs"
          >
            Simpan Perubahan
          </Button>
        </DialogFooter>
      </Dialog>

      {/* 🗑️ MODAL: HAPUS PESERTA DARI UJIAN */}
      <Dialog open={Boolean(deletingParticipant)} onOpenChange={() => setDeletingParticipant(null)}>
        <DialogHeader>
          <div className="flex items-center gap-2 text-rose-600 mb-1">
            <Trash2 className="h-5 w-5" />
            <span className="text-xs font-black uppercase tracking-wider">Konfirmasi Hapus Peserta</span>
          </div>
          <DialogTitle className="text-lg font-black text-slate-900">
            Hapus Peserta: {deletingParticipant?.name}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Pilih jenis penghapusan data peserta untuk murid <strong>{deletingParticipant?.name}</strong> (Kelas {deletingParticipant?.className}).
          </DialogDescription>
        </DialogHeader>

        {deletingParticipant && (
          <div className="space-y-3.5 my-2 text-xs">
            <div className="space-y-2">
              <label
                onClick={() => setDeleteMode("exam_only")}
                className={cn(
                  "p-3.5 rounded-xl border-2 cursor-pointer flex items-start gap-3 transition-all",
                  deleteMode === "exam_only"
                    ? "border-[#7AB82A] bg-[#F4FBEB] ring-2 ring-[#D5EFA9]"
                    : "border-slate-200 hover:bg-slate-50"
                )}
              >
                <input
                  type="radio"
                  name="deleteMode"
                  checked={deleteMode === "exam_only"}
                  onChange={() => setDeleteMode("exam_only")}
                  className="mt-0.5 text-[#7AB82A] focus:ring-[#7AB82A]"
                />
                <div className="space-y-0.5">
                  <div className="font-black text-slate-900 flex items-center gap-2">
                    <span>Hapus dari Ujian Ini Saja</span>
                    <Badge variant="outline" className="text-[10px] text-emerald-800 bg-emerald-50 border-emerald-300">
                      Direkomendasikan
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Menghapus seluruh jawaban, riwayat percobaan, dan nilai murid dari ujian ini. Akun murid tetap tersimpan di database sekolah.
                  </p>
                </div>
              </label>

              <label
                onClick={() => setDeleteMode("permanent")}
                className={cn(
                  "p-3.5 rounded-xl border-2 cursor-pointer flex items-start gap-3 transition-all",
                  deleteMode === "permanent"
                    ? "border-rose-500 bg-rose-50/50 ring-2 ring-rose-200"
                    : "border-slate-200 hover:bg-slate-50"
                )}
              >
                <input
                  type="radio"
                  name="deleteMode"
                  checked={deleteMode === "permanent"}
                  onChange={() => setDeleteMode("permanent")}
                  className="mt-0.5 text-rose-600 focus:ring-rose-500"
                />
                <div className="space-y-0.5">
                  <div className="font-black text-rose-900">
                    Hapus Akun Murid Permanen dari Sekolah
                  </div>
                  <p className="text-[11px] text-rose-700">
                    Menghapus data murid ini secara permanen dari sistem sekolah. Gunakan opsi ini jika nama ini adalah akun percobaan / typo (contoh: nama asal-asalan).
                  </p>
                </div>
              </label>
            </div>

            {deleteMode === "permanent" && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-[11px] space-y-1">
                <strong>⚠️ Peringatan:</strong> Tindakan ini tidak dapat dibatalkan. Seluruh data murid dan riwayat ujian murid ini akan terhapus permanen dari sistem.
              </div>
            )}
          </div>
        )}

        <DialogFooter className="border-t border-slate-100 pt-3">
          <Button variant="outline" onClick={() => setDeletingParticipant(null)} className="text-xs font-bold">
            Batal
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeleteParticipant}
            isLoading={isDeletingParticipant}
            className="text-xs font-black shadow-xs bg-rose-600 hover:bg-rose-700"
          >
            {deleteMode === "permanent" ? "Hapus Akun Permanen" : "Hapus dari Ujian"}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* 🔄 MODAL: RESET PERCOBAAN UJIAN */}
      <Dialog open={Boolean(resettingParticipant)} onOpenChange={() => setResettingParticipant(null)}>
        <DialogHeader>
          <div className="flex items-center gap-2 text-amber-600 mb-1">
            <RotateCcw className="h-5 w-5" />
            <span className="text-xs font-black uppercase tracking-wider">Reset Pengerjaan Siswa</span>
          </div>
          <DialogTitle className="text-lg font-black text-slate-900">
            Reset Ujian: {resettingParticipant?.name}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Mereset kuota percobaan murid agar dapat mengerjakan kembali ujian ini dari awal.
          </DialogDescription>
        </DialogHeader>

        {resettingParticipant && (
          <div className="space-y-3.5 my-2 text-xs">
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl space-y-1">
              <span className="font-bold text-amber-950 block">Status Saat Ini:</span>
              <p className="text-amber-900 text-[11px]">
                Siswa telah mengerjakan sebanyak <strong>{resettingParticipant.totalAttempts}x</strong> percobaan dengan nilai akhir <strong>{resettingParticipant.effectiveScore ?? resettingParticipant.finalScore ?? 0}</strong>.
              </p>
            </div>

            <div>
              <label className="block font-black text-slate-700 uppercase tracking-wider text-[11px] mb-1">
                Alasan Reset Pengerjaan:
              </label>
              <Input
                value={resetReason}
                onChange={(e) => setResetReason(e.target.value)}
                placeholder="Contoh: Kendala perangkat / izin ujian ulang dari guru"
                className="h-10 text-xs rounded-xl"
              />
            </div>
          </div>
        )}

        <DialogFooter className="border-t border-slate-100 pt-3">
          <Button variant="outline" onClick={() => setResettingParticipant(null)} className="text-xs font-bold">
            Batal
          </Button>
          <Button
            onClick={handleResetAttempt}
            isLoading={isResettingAttempt}
            className="text-xs font-black bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
          >
            Reset Pengerjaan Sekarang
          </Button>
        </DialogFooter>
      </Dialog>

      {/* 📥 MODAL: LEMBAR HASIL PENGERJAAN & DOWNLOAD PESERTA */}
      <Dialog open={showDownloadModal} onOpenChange={setShowDownloadModal}>
        <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-4xl w-full shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-6">
          {selectedStudentForDownload && (
            <>
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-[#EBF7D9] border border-[#D5EFA9] text-[#4B7914] flex items-center justify-center font-black text-lg">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 leading-tight">
                      Lembar Hasil Pengerjaan Peserta
                    </h2>
                    <p className="text-xs text-slate-500 font-semibold mt-0.5">
                      {selectedStudentForDownload.name} • Kelas {selectedStudentForDownload.className} • NIS: {selectedStudentForDownload.nis || "-"}
                    </p>
                  </div>
                </div>

                {/* Toolbar Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={handlePrintStudentReport}
                    className="h-9 px-3.5 rounded-xl bg-[#7AB82A] hover:bg-[#6AA421] text-white font-black text-xs shadow-md shadow-[#7AB82A]/30 flex items-center gap-1.5"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>Cetak / Simpan PDF</span>
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownloadTextReport(selectedStudentForDownload)}
                    className="h-9 px-3.5 rounded-xl border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs flex items-center gap-1.5"
                  >
                    <Download className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Unduh TXT</span>
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setShowDownloadModal(false);
                      handleOpenSendModal(selectedStudentForDownload, "INDIVIDUAL");
                    }}
                    className="h-9 px-3.5 rounded-xl border-sky-300 text-sky-800 bg-sky-50 hover:bg-sky-100 font-bold text-xs flex items-center gap-1.5"
                  >
                    <Send className="h-3.5 w-3.5 text-[#0088cc]" />
                    <span>Kirim ke Ortu</span>
                  </Button>
                </div>
              </div>

              {/* Score Highlights Summary Card */}
              {(() => {
                const att = selectedStudentForDownload.selectedAttempt || selectedStudentForDownload.attempts?.[0];
                const score = selectedStudentForDownload.effectiveScore ?? selectedStudentForDownload.finalScore ?? 0;
                const isPassed = score >= passingScore;
                const earnedPts = selectedStudentForDownload.earnedPoints ?? att?.earnedPoints ?? 0;
                const maxPts = selectedStudentForDownload.maxPoints ?? att?.maxPoints ?? 100;

                const correctCount = (att?.answers || []).filter((a: any) => a.isCorrect === true).length;
                const totalQ = questions.length;

                return (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                          Nilai Akhir
                        </span>
                        <div className="text-3xl font-black text-[#4B7914]">
                          {score}
                          <span className="text-xs text-slate-400 font-medium"> / 100</span>
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                          Poin Diperoleh
                        </span>
                        <div className="text-2xl font-black text-slate-800">
                          {earnedPts}
                          <span className="text-xs text-slate-400 font-medium"> / {maxPts} pt</span>
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                          Jawaban Benar
                        </span>
                        <div className="text-2xl font-black text-slate-800">
                          {correctCount}
                          <span className="text-xs text-slate-400 font-medium"> / {totalQ} soal</span>
                        </div>
                      </div>

                      <div className={cn(
                        "p-4 rounded-2xl border",
                        isPassed
                          ? "bg-emerald-50/80 border-emerald-200 text-emerald-900"
                          : "bg-rose-50/80 border-rose-200 text-rose-900"
                      )}>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider block mb-1 opacity-75">
                          Status Kelulusan
                        </span>
                        <div className="text-lg font-black flex items-center gap-1.5">
                          {isPassed ? (
                            <>
                              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                              <span>LULUS</span>
                            </>
                          ) : (
                            <>
                              <X className="h-5 w-5 text-rose-600" />
                              <span>REMEDIAL</span>
                            </>
                          )}
                        </div>
                        <span className="text-[10px] font-medium opacity-80 block mt-0.5">
                          (KKM: {passingScore})
                        </span>
                      </div>
                    </div>

                    {/* Questions & Answers Detail List */}
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-[#7AB82A]" />
                          <span>Rincian Lembar Jawaban ({totalQ} Soal)</span>
                        </h3>
                        <span className="text-xs text-slate-500 font-semibold">
                          Percobaan #{att?.attemptNumber || 1}
                        </span>
                      </div>

                      <div className="space-y-3">
                        {questions.map((q: any, idx: number) => {
                          const ans = att?.answers?.find((a: any) => a.questionId === q.id);
                          const isEssay = q.type === "ESSAY";
                          const isCorrect = ans?.isCorrect === true;
                          const isIncorrect = ans?.isCorrect === false;
                          const isPendingEssay = isEssay && (ans?.awardedPoints === null || ans?.awardedPoints === undefined);

                          return (
                            <div
                              key={q.id}
                              className={cn(
                                "p-4 rounded-2xl border transition-all space-y-3",
                                isCorrect && "bg-[#F7FCF4] border-[#D5EFA9]",
                                isIncorrect && "bg-[#FFF8F8] border-rose-200",
                                isPendingEssay && "bg-amber-50/50 border-amber-200",
                                !ans && "bg-slate-50 border-slate-200"
                              )}
                            >
                              {/* Question Item Header */}
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-2">
                                  <span className="h-6 w-6 rounded-lg bg-slate-900 text-white font-black text-xs flex items-center justify-center">
                                    {idx + 1}
                                  </span>
                                  <Badge variant="outline" className="text-[10px] font-bold">
                                    {q.type === "MULTIPLE_CHOICE"
                                      ? "Pilihan Ganda"
                                      : q.type === "TRUE_FALSE"
                                      ? "Benar / Salah"
                                      : "Esai"}
                                  </Badge>
                                  <span className="text-xs font-bold text-slate-500">
                                    Bobot: {q.points} pt
                                  </span>
                                </div>

                                <div className="flex items-center gap-1.5 font-black text-xs">
                                  {isCorrect ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-800">
                                      <Check className="h-3.5 w-3.5 stroke-[3]" />
                                      <span>Benar (+{q.points} pt)</span>
                                    </span>
                                  ) : isIncorrect ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-100 text-rose-800">
                                      <X className="h-3.5 w-3.5 stroke-[3]" />
                                      <span>Salah (0 pt)</span>
                                    </span>
                                  ) : isPendingEssay ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-100 text-amber-800">
                                      <Clock className="h-3.5 w-3.5" />
                                      <span>Menunggu Koreksi Guru</span>
                                    </span>
                                  ) : (
                                    <span className="text-slate-400">Tidak Dijawab</span>
                                  )}
                                </div>
                              </div>

                              {/* Question Text & Image */}
                              <div className="space-y-2">
                                <div className="text-sm font-bold text-slate-900 leading-relaxed">
                                  <MathRenderer content={q.questionText} />
                                </div>
                                {q.questionImage && (
                                  <div className="rounded-xl overflow-hidden border border-slate-200 max-w-sm">
                                    <img
                                      src={q.questionImage}
                                      alt={`Gambar Soal #${idx + 1}`}
                                      className="w-full h-auto object-contain max-h-48"
                                    />
                                  </div>
                                )}
                              </div>

                              {/* Student's Answer and Options Breakdown */}
                              {isEssay ? (
                                <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
                                    Jawaban Tertulis Siswa:
                                  </span>
                                  <div className="text-xs text-slate-800 font-medium whitespace-pre-wrap italic">
                                    <MathRenderer content={ans?.answerText || "(Siswa tidak mengisi jawaban)"} />
                                  </div>
                                  {ans?.awardedPoints !== null && ans?.awardedPoints !== undefined && (
                                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                                      <span className="font-bold text-slate-700">
                                        Poin Diberikan: <strong>{ans.awardedPoints} / {q.points} pt</strong>
                                      </span>
                                      {ans.feedback && (
                                        <span className="text-slate-600 italic">
                                          Catatan: &ldquo;{ans.feedback}&rdquo;
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="space-y-1.5 pt-1">
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {q.options?.map((opt: any) => {
                                      const isChosen = ans?.selectedOptionId === opt.id || ans?.selectedOptionKey === opt.optionKey;
                                      const isKey = opt.isCorrect;

                                      return (
                                        <div
                                          key={opt.id}
                                          className={cn(
                                            "p-2.5 rounded-xl border text-xs flex items-center justify-between transition-all",
                                            isKey && "bg-emerald-50/70 border-emerald-300 font-bold text-emerald-950",
                                            isChosen && !isKey && "bg-rose-50/70 border-rose-300 text-rose-950 line-through",
                                            !isChosen && !isKey && "bg-white border-slate-200 text-slate-600 opacity-75"
                                          )}
                                        >
                                          <div className="flex items-center gap-2 flex-1">
                                            <span className="font-black shrink-0">{opt.optionKey}.</span>
                                            <span className="flex-1">
                                              <MathRenderer content={opt.optionText} />
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-1 font-bold text-[10px] shrink-0 ml-2">
                                            {isChosen && isKey && (
                                              <span className="px-1.5 py-0.5 rounded bg-emerald-200 text-emerald-900">
                                                Jawaban Siswa (Kunci ✅)
                                              </span>
                                            )}
                                            {isChosen && !isKey && (
                                              <span className="px-1.5 py-0.5 rounded bg-rose-200 text-rose-900">
                                                Dipilih Siswa ❌
                                              </span>
                                            )}
                                            {!isChosen && isKey && (
                                              <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                                                Kunci Jawaban
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
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })()}

              <DialogFooter className="border-t border-slate-100 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowDownloadModal(false)}
                  className="text-xs font-bold"
                >
                  Tutup
                </Button>
                <Button
                  onClick={handlePrintStudentReport}
                  className="text-xs font-black bg-[#7AB82A] hover:bg-[#6AA421] text-white shadow-md shadow-[#7AB82A]/30 flex items-center gap-1.5"
                >
                  <Printer className="h-4 w-4" />
                  <span>Cetak / Unduh Lembar Hasil</span>
                </Button>
              </DialogFooter>
            </>
          )}
        </div>
      </Dialog>
    </div>
  );
}
