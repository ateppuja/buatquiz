"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  Plus,
  Trash2,
  Save,
  Sparkles,
  ArrowLeft,
  Copy,
  CheckCircle2,
  Layers,
  Clock,
  Check,
  CheckCircle,
  HelpCircle,
  CopyPlus,
  Printer,
  FileText,
} from "lucide-react";
import { formatDateTimeLocal, parseDateInput, cn } from "@/lib/utils";
import { parseQuestionsFromRawText, beautifyQuestionText } from "@/lib/text-parser";
import { toast } from "sonner";

export default function EditExamPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params?.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [exam, setExam] = useState<any>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [maxAttempts, setMaxAttempts] = useState(1);
  const [gradingMethod, setGradingMethod] = useState("HIGHEST");
  const [resultVisibility, setResultVisibility] = useState("MANUAL");
  const [questions, setQuestions] = useState<any[]>([]);

  // Smart Text Import Modal states
  const [showTextImportModal, setShowTextImportModal] = useState(false);
  const [rawQuestionText, setRawQuestionText] = useState("");
  const [parsedTextResult, setParsedTextResult] = useState<any>(null);
  const [textImportMode, setTextImportMode] = useState<"APPEND" | "REPLACE">("APPEND");
  const [isApplyingText, setIsApplyingText] = useState(false);

  const samplePresets: Record<string, { label: string; text: string }> = {
    MIXED: {
      label: "🌟 Soal Campuran (PG, BS, Esai)",
      text: `1. Siapakah Presiden pertama Republik Indonesia?
A. Soeharto
B. Ir. Soekarno
C. B.J. Habibie
D. Abdurrahman Wahid
Kunci: B
Pembahasan: Ir. Soekarno adalah Presiden pertama RI yang memproklamasikan kemerdekaan.

2. Candi Borobudur merupakan candi Buddha terbesar yang terletak di Jawa Tengah.
A. Benar
B. Salah
Kunci: Benar

3. Sebutkan dan jelaskan 3 fungsi daun bagi kelangsungan hidup tumbuhan!
Bobot: 2
Pembahasan: 1. Tempat fotosintesis, 2. Tempat respirasi/pernapasan, 3. Tempat transpirasi/penguapan air.`,
    },
    PG: {
      label: "📋 Pilihan Ganda (PG)",
      text: `1. Berapakah hasil dari 25 + 15?
A. 30
B. 35
C. 40
D. 45
Kunci: C
Pembahasan: 25 + 15 = 40.

2. Ibukota negara Republik Indonesia adalah...
A. Bandung
B. Jakarta
C. Surabaya
D. Semarang
Kunci: B

3. Lambang sila ketiga Pancasila adalah:
A. Bintang
B. Rantai
C. Pohon Beringin
D. Padi dan Kapas
Kunci: C`,
    },
    BS: {
      label: "✅ Benar / Salah (BS)",
      text: `1. Bumi bergerak mengelilingi matahari dalam tata surya kita.
A. Benar
B. Salah
Kunci: Benar
Pembahasan: Pergerakan bumi mengelilingi matahari disebut revolusi bumi.

2. Besi akan menyusut ukurannya saat dipanaskan.
A. Benar
B. Salah
Kunci: Salah
Pembahasan: Benda padat seperti besi akan memuai saat terkena panas.`,
    },
    ESSAY: {
      label: "✍️ Esai / Uraian",
      text: `1. Jelaskan perbedaan antara perpindahan kalor secara konduksi, konveksi, dan radiasi!
Bobot: 2
Pembahasan: Konduksi tanpa zat perantara, konveksi disertai zat perantara, radiasi tanpa zat perantara.

2. Mengapa kita harus menjaga kelestarian lingkungan dan hutan?
Bobot: 2
Pembahasan: Untuk menjaga keseimbangan ekosistem, mencegah bencana banjir/longsor, dan menjamin ketersediaan air bersih.`,
    },
    WA: {
      label: "⚡ Format Cepat / WhatsApp",
      text: `1. Alat indera penglihatan manusia adalah...
A. Hidung   B. Mata   C. Telinga   D. Lidah
Kunci: B

2. Hewan yang berkembang biak dengan bertelur disebut ovipar.
Benar / Salah
Kunci: Benar

3. Berapakah hasil dari 8 x 7?
A. 54   B. 56   C. 58   D. 62
Jawaban: B`,
    },
  };

  const handleApplyPreset = (presetKey: string) => {
    const preset = samplePresets[presetKey];
    if (preset) {
      setRawQuestionText(preset.text);
      const res = parseQuestionsFromRawText(preset.text);
      setParsedTextResult(res);
      toast.success(`Format "${preset.label}" dimasukkan.`);
    }
  };

  const handleBeautifyText = () => {
    if (!rawQuestionText.trim()) {
      toast.error("Teks soal masih kosong.");
      return;
    }
    const beautified = beautifyQuestionText(rawQuestionText);
    setRawQuestionText(beautified);
    const res = parseQuestionsFromRawText(beautified);
    setParsedTextResult(res);
    toast.success("Format teks berhasil dirapikan otomatis!");
  };

  const handleTogglePreviewOptionKey = (qIdx: number, optKey: string) => {
    if (!parsedTextResult?.questions) return;
    const nextQuestions = [...parsedTextResult.questions];
    const q = nextQuestions[qIdx];
    if (q && q.options) {
      q.options = q.options.map((opt: any) => ({
        ...opt,
        isCorrect: opt.key.toUpperCase() === optKey.toUpperCase(),
      }));
      setParsedTextResult({
        ...parsedTextResult,
        questions: nextQuestions,
      });
    }
  };

  const handleUpdatePreviewQuestionType = (qIdx: number, newType: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "ESSAY") => {
    if (!parsedTextResult?.questions) return;
    const nextQuestions = [...parsedTextResult.questions];
    const q = nextQuestions[qIdx];
    if (q) {
      q.type = newType;
      if (newType === "TRUE_FALSE") {
        q.options = [
          { key: "BENAR", text: "Benar", isCorrect: true },
          { key: "SALAH", text: "Salah", isCorrect: false },
        ];
      } else if (newType === "MULTIPLE_CHOICE" && (!q.options || q.options.length < 2)) {
        q.options = [
          { key: "A", text: "Pilihan A", isCorrect: true },
          { key: "B", text: "Pilihan B", isCorrect: false },
          { key: "C", text: "Pilihan C", isCorrect: false },
          { key: "D", text: "Pilihan D", isCorrect: false },
        ];
      } else if (newType === "ESSAY") {
        q.options = [];
      }
      setParsedTextResult({
        ...parsedTextResult,
        questions: nextQuestions,
      });
    }
  };

  const handleUpdatePreviewQuestionPoints = (qIdx: number, newPoints: number) => {
    if (!parsedTextResult?.questions) return;
    const nextQuestions = [...parsedTextResult.questions];
    if (nextQuestions[qIdx]) {
      nextQuestions[qIdx].points = Math.max(0.5, newPoints || 1);
      setParsedTextResult({
        ...parsedTextResult,
        questions: nextQuestions,
      });
    }
  };

  const handleDeletePreviewQuestion = (qIdx: number) => {
    if (!parsedTextResult?.questions) return;
    const nextQuestions = parsedTextResult.questions.filter((_: any, idx: number) => idx !== qIdx);
    setParsedTextResult({
      ...parsedTextResult,
      questions: nextQuestions,
      validCount: nextQuestions.length,
      totalParsed: nextQuestions.length,
    });
    toast.info("Butir soal dihapus dari pratinjau.");
  };

  const handleApplyTextQuestions = async () => {
    if (!parsedTextResult || parsedTextResult.validCount === 0) {
      toast.error("Tidak ada butir soal valid yang dapat dimasukkan.");
      return;
    }

    const validQuestions = parsedTextResult.questions.filter((q: any) => q.isValid);
    setIsApplyingText(true);
    try {
      if (textImportMode === "REPLACE") {
        // Delete existing questions
        for (const oldQ of questions) {
          if (oldQ.id) {
            await fetch(`/api/v1/teacher/exams/${examId}/questions/${oldQ.id}`, {
              method: "DELETE",
            }).catch(() => {});
          }
        }
      }

      // Add all valid questions
      for (const q of validQuestions) {
        await fetch(`/api/v1/teacher/exams/${examId}/questions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: q.type,
            questionText: q.questionText,
            points: q.points || 1,
            explanation: q.explanation || undefined,
            options: q.options || [],
          }),
        });
      }

      toast.success(`Berhasil menambahkan ${validQuestions.length} butir soal ke dalam ujian!`);
      setShowTextImportModal(false);
      setRawQuestionText("");
      setParsedTextResult(null);
      await loadExamDetail();
    } catch {
      toast.error("Terjadi kesalahan saat menyimpan soal dari teks.");
    } finally {
      setIsApplyingText(false);
    }
  };

  const loadExamDetail = async () => {
    try {
      const res = await fetch(`/api/v1/teacher/exams/${examId}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.error?.message || "Ujian tidak ditemukan.");
        router.push("/teacher/exams");
        return;
      }

      const ex = data.data;
      setExam(ex);
      setTitle(ex.title);
      setDurationMinutes(ex.durationMinutes);
      setStartAt(formatDateTimeLocal(ex.startAt));
      setEndAt(formatDateTimeLocal(ex.endAt));
      setMaxAttempts(ex.maxAttempts);
      setGradingMethod(ex.gradingMethod);
      setResultVisibility(ex.resultVisibility);

      // Normalize questions & options structure for easy inline editing
      const normalizedQ = (ex.questions || []).map((q: any) => ({
        ...q,
        options: (q.options || []).map((opt: any) => ({
          ...opt,
          key: opt.optionKey || opt.key,
          text: opt.optionText || opt.text || "",
          isCorrect: Boolean(opt.isCorrect),
        })),
      }));
      setQuestions(normalizedQ);
    } catch {
      toast.error("Gagal memuat detail ujian.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (examId) loadExamDetail();
  }, [examId]);

  const updateQuestionField = (qIdx: number, field: string, val: any) => {
    setQuestions((prev) => {
      const updated = [...prev];
      updated[qIdx] = { ...updated[qIdx], [field]: val };
      return updated;
    });
  };

  const updateOptionText = (qIdx: number, optIdx: number, text: string) => {
    setQuestions((prev) => {
      const updated = [...prev];
      const opts = [...updated[qIdx].options];
      opts[optIdx] = { ...opts[optIdx], text, optionText: text };
      updated[qIdx].options = opts;
      return updated;
    });
  };

  const setCorrectOption = (qIdx: number, optIdx: number) => {
    setQuestions((prev) => {
      const updated = [...prev];
      updated[qIdx].options = updated[qIdx].options.map((o: any, idx: number) => ({
        ...o,
        isCorrect: idx === optIdx,
      }));
      return updated;
    });
  };

  const handleSetStartNow = () => {
    const now = new Date();
    setStartAt(formatDateTimeLocal(now));
    toast.success("Waktu mulai disetel ke saat ini.");
  };

  const handleSetStartTomorrowMorning = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(8, 0, 0, 0);
    setStartAt(formatDateTimeLocal(tomorrow));
    toast.success("Waktu mulai disetel ke besok pukul 08:00 WIB.");
  };

  const handleSetEndInDays = (days: number) => {
    const base = parseDateInput(startAt) || new Date();
    const end = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
    setEndAt(formatDateTimeLocal(end));
    toast.success(`Waktu berakhir disetel ke +${days} hari.`);
  };

  const handleUpdateExam = async (publish: boolean = false) => {
    // Basic validation
    if (!title.trim()) {
      toast.error("Judul ujian wajib diisi.");
      return;
    }

    if (startAt && endAt) {
      const sDate = parseDateInput(startAt);
      const eDate = parseDateInput(endAt);
      if (sDate && eDate && eDate <= sDate) {
        toast.error("Waktu berakhir ujian harus lebih lambat daripada waktu mulai.");
        return;
      }
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText.trim()) {
        toast.error(`Pertanyaan soal nomor ${i + 1} belum diisi.`);
        return;
      }
      if (q.type === "MULTIPLE_CHOICE" || q.type === "TRUE_FALSE") {
        const hasKey = q.options?.some((o: any) => o.isCorrect);
        if (!hasKey) {
          toast.error(`Kunci jawaban untuk soal nomor ${i + 1} belum dipilih.`);
          return;
        }
      }
    }

    setIsSaving(true);
    try {
      // 1. Update Exam Meta
      const res = await fetch(`/api/v1/teacher/exams/${examId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          durationMinutes,
          startAt,
          endAt,
          maxAttempts,
          gradingMethod,
          resultVisibility,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.error?.message || "Gagal menyimpan perubahan ujian.");
        setIsSaving(false);
        return;
      }

      // 2. Save all questions and options
      for (const q of questions) {
        if (q.id && !q.id.startsWith("temp-")) {
          await fetch(`/api/v1/teacher/exams/${examId}/questions/${q.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              questionText: q.questionText,
              points: parseFloat(q.points) || 1,
              options: q.options?.map((o: any, oIdx: number) => ({
                key: o.key || o.optionKey || String.fromCharCode(65 + oIdx),
                text: o.text || o.optionText || "",
                isCorrect: Boolean(o.isCorrect),
              })),
            }),
          }).catch(() => {});
        }
      }

      // 3. If publishing
      if (publish) {
        const pubRes = await fetch(`/api/v1/teacher/exams/${examId}/publish`, { method: "POST" });
        const pubData = await pubRes.json();
        if (pubData.success) {
          toast.success("Ujian berhasil diterbitkan!");
          router.push("/teacher/exams");
          return;
        } else {
          toast.error(pubData.error?.message || "Gagal menerbitkan ujian.");
          setIsSaving(false);
          return;
        }
      }

      toast.success("Perubahan ujian & soal berhasil disimpan!");
      loadExamDetail();
    } catch {
      toast.error("Terjadi kesalahan saat menyimpan.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddQuestion = async (type: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "ESSAY" = "MULTIPLE_CHOICE", insertAfterIndex?: number) => {
    try {
      const defaultOptions =
        type === "MULTIPLE_CHOICE"
          ? [
              { key: "A", text: "Pilihan A", isCorrect: true },
              { key: "B", text: "Pilihan B", isCorrect: false },
              { key: "C", text: "Pilihan C", isCorrect: false },
              { key: "D", text: "Pilihan D", isCorrect: false },
            ]
          : type === "TRUE_FALSE"
          ? [
              { key: "BENAR", text: "Benar", isCorrect: true },
              { key: "SALAH", text: "Salah", isCorrect: false },
            ]
          : [];

      let insertAfterOrderIndex: number | undefined = undefined;
      if (typeof insertAfterIndex === "number" && questions[insertAfterIndex]) {
        insertAfterOrderIndex = questions[insertAfterIndex].orderIndex;
      }

      const res = await fetch(`/api/v1/teacher/exams/${examId}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          questionText: "Tuliskan pertanyaan baru di sini...",
          points: 1,
          options: defaultOptions,
          insertAfterOrderIndex,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(
          typeof insertAfterIndex === "number"
            ? `Soal baru berhasil disisipkan setelah soal #${insertAfterIndex + 1}.`
            : "Soal baru berhasil ditambahkan."
        );
        loadExamDetail();
      }
    } catch {
      toast.error("Gagal menambahkan soal.");
    }
  };

  const handleDeleteQuestion = async (qId: string) => {
    if (questions.length === 1) {
      toast.error("Ujian minimal harus memiliki 1 butir soal.");
      return;
    }
    if (!confirm("Hapus butir soal ini?")) return;
    try {
      const res = await fetch(`/api/v1/teacher/exams/${examId}/questions/${qId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Soal berhasil dihapus.");
        loadExamDetail();
      }
    } catch {
      toast.error("Gagal menghapus soal.");
    }
  };

  const handleDuplicateCurrentExam = async () => {
    try {
      const res = await fetch(`/api/v1/teacher/exams/${examId}/duplicate`, { method: "POST" });
      const data = await res.json();
      if (data.success && data.data?.id) {
        toast.success(`Ujian berhasil disalin!`);
        router.push(`/teacher/exams/${data.data.id}/edit`);
      } else {
        toast.error(data.error?.message || "Gagal menduplikasi ujian.");
      }
    } catch {
      toast.error("Terjadi kesalahan saat menduplikasi.");
    }
  };

  if (isLoading || !exam) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-xs text-muted-foreground">Memuat data ujian...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <button
              type="button"
              onClick={() => router.push("/teacher/exams")}
              className="text-muted-foreground hover:text-foreground text-xs flex items-center gap-1 font-semibold cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Daftar Ujian</span>
            </button>
            <span className="text-muted-foreground">•</span>
            <Badge variant="outline" className="text-xs">{exam.subject?.name}</Badge>
            {exam.status === "PUBLISHED" && <Badge variant="success" className="text-xs">Aktif ({exam.examCode})</Badge>}
            {exam.status === "CLOSED" && <Badge variant="secondary" className="text-xs">Selesai</Badge>}
            {exam.status === "DRAFT" && <Badge variant="outline" className="text-xs">Draft</Badge>}
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Edit Ujian & Lembar Soal</h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/teacher/exams/${examId}/print`}>
            <Button
              type="button"
              variant="outline"
              className="gap-1.5 text-xs font-bold border-slate-300 text-slate-700 hover:bg-slate-100 bg-white"
              title="Cetak naskah soal ujian atau unduh PDF"
            >
              <Printer className="h-4 w-4 text-slate-600" />
              <span>Cetak / PDF</span>
            </Button>
          </Link>

          <Button
            type="button"
            variant="outline"
            onClick={handleDuplicateCurrentExam}
            className="gap-1.5 text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-300"
            title="Duplikat ujian ini menjadi ujian baru"
          >
            <CopyPlus className="h-4 w-4" />
            <span>Buat Lagi dari Ini</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            isLoading={isSaving}
            onClick={() => handleUpdateExam(false)}
            className="gap-1.5 text-xs font-semibold"
          >
            <Save className="h-4 w-4" />
            <span>Simpan Perubahan</span>
          </Button>

          {exam.status === "DRAFT" && (
            <Button
              type="button"
              onClick={() => handleUpdateExam(true)}
              isLoading={isSaving}
              className="font-bold gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Sparkles className="h-4 w-4" />
              <span>Terbitkan Ujian</span>
            </Button>
          )}
        </div>
      </div>

      {/* Basic Info Card */}
      <Card className="p-6 shadow-md border-2 border-[#D8EEB6] rounded-[28px] bg-white space-y-4">
        <div className="flex items-center gap-2 border-b border-[#E0F2C2] pb-3">
          <Clock className="h-5 w-5 text-[#7AB82A]" />
          <div>
            <h3 className="text-sm font-black text-slate-900">Informasi & Jadwal Pelaksanaan Ujian</h3>
            <p className="text-[11px] font-semibold text-slate-500">
              Atur judul, durasi waktu, serta jadwal mulai dan berakhir sesuai keinginan Anda
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="sm:col-span-2">
            <label className="block font-black uppercase tracking-wider text-[#4B7914] mb-1.5">
              Judul Ujian <span className="text-rose-500">*</span>
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-11 text-xs rounded-xl border-2 border-[#D5EFA9] focus-visible:ring-[#7AB82A] font-bold"
              placeholder="Contoh: Ujian Tengah Semester Fiqih Kelas 4"
            />
          </div>

          <div>
            <label className="block font-black uppercase tracking-wider text-[#4B7914] mb-1.5">
              Durasi Pengerjaan Siswa (Menit) <span className="text-rose-500">*</span>
            </label>
            <Input
              type="number"
              min={1}
              max={300}
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10) || 60)}
              className="h-11 text-xs rounded-xl border-2 border-[#D5EFA9] focus-visible:ring-[#7AB82A] font-bold"
            />
          </div>

          <div>
            <label className="block font-black uppercase tracking-wider text-[#4B7914] mb-1.5">
              Maksimal Percobaan Siswa
            </label>
            <Input
              type="number"
              min={1}
              max={10}
              value={maxAttempts}
              onChange={(e) => setMaxAttempts(parseInt(e.target.value, 10) || 1)}
              className="h-11 text-xs rounded-xl border-2 border-[#D5EFA9] focus-visible:ring-[#7AB82A] font-bold"
            />
          </div>

          {/* Waktu Mulai with Quick Presets */}
          <div className="space-y-1.5 bg-[#F9FCF5] p-3 rounded-2xl border border-[#D8EEB6]">
            <div className="flex items-center justify-between">
              <label className="block font-black uppercase tracking-wider text-[#4B7914]">
                Waktu Mulai Ujian (WIB) <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleSetStartNow}
                  className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-[#EBF7D9] text-[#4B7914] border border-[#D5EFA9] hover:bg-[#7AB82A] hover:text-white transition-colors cursor-pointer"
                  title="Atur waktu mulai ke saat ini agar siswa bisa langsung mengerjakan"
                >
                  ⚡ Mulai Sekarang
                </button>
                <button
                  type="button"
                  onClick={handleSetStartTomorrowMorning}
                  className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  📅 Besok 08:00
                </button>
              </div>
            </div>

            <Input
              type="datetime-local"
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
              className="h-10 text-xs rounded-xl border-2 border-[#D5EFA9] bg-white focus-visible:ring-[#7AB82A] font-bold font-mono"
            />
            <p className="text-[10px] text-slate-500 font-semibold">
              Siswa baru dapat membuka soal setelah waktu mulai ini tercapai.
            </p>
          </div>

          {/* Waktu Berakhir with Quick Presets */}
          <div className="space-y-1.5 bg-[#F9FCF5] p-3 rounded-2xl border border-[#D8EEB6]">
            <div className="flex items-center justify-between">
              <label className="block font-black uppercase tracking-wider text-[#4B7914]">
                Waktu Berakhir Ujian (WIB) <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleSetEndInDays(1)}
                  className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-[#EBF7D9] text-[#4B7914] border border-[#D5EFA9] hover:bg-[#7AB82A] hover:text-white transition-colors cursor-pointer"
                >
                  +1 Hari
                </button>
                <button
                  type="button"
                  onClick={() => handleSetEndInDays(7)}
                  className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-[#EBF7D9] text-[#4B7914] border border-[#D5EFA9] hover:bg-[#7AB82A] hover:text-white transition-colors cursor-pointer"
                >
                  +7 Hari
                </button>
                <button
                  type="button"
                  onClick={() => handleSetEndInDays(30)}
                  className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  +1 Bulan
                </button>
              </div>
            </div>

            <Input
              type="datetime-local"
              value={endAt}
              onChange={(e) => setEndAt(e.target.value)}
              className="h-10 text-xs rounded-xl border-2 border-[#D5EFA9] bg-white focus-visible:ring-[#7AB82A] font-bold font-mono"
            />
            <p className="text-[10px] text-slate-500 font-semibold">
              Setelah waktu berakhir, ujian otomatis tertutup dan tidak bisa diakses lagi.
            </p>
          </div>
        </div>
      </Card>

      {/* Questions Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-foreground">Daftar Butir Soal ({questions.length} Butir)</h2>
            <p className="text-xs text-muted-foreground">
              Edit kalimat pertanyaan, opsi jawaban, kunci jawaban, dan bobot poin langsung di bawah ini.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <Button
              size="sm"
              onClick={() => setShowTextImportModal(true)}
              className="text-xs font-bold gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-xs"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Tempel Teks Soal</span>
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleAddQuestion("MULTIPLE_CHOICE")} className="text-xs font-semibold gap-1">
              <Plus className="h-3.5 w-3.5" />
              <span>+ PG</span>
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleAddQuestion("TRUE_FALSE")} className="text-xs font-semibold gap-1">
              <Plus className="h-3.5 w-3.5" />
              <span>+ Benar/Salah</span>
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleAddQuestion("ESSAY")} className="text-xs font-semibold gap-1">
              <Plus className="h-3.5 w-3.5" />
              <span>+ Esai</span>
            </Button>
          </div>
        </div>

        {questions.map((q, idx) => (
          <Card key={q.id} className="p-5 shadow-sm border-border space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-xs">
                  {idx + 1}
                </span>
                <Badge variant="outline" className="text-xs font-semibold">
                  {q.type === "MULTIPLE_CHOICE"
                    ? "Pilihan Ganda"
                    : q.type === "TRUE_FALSE"
                    ? "Benar / Salah"
                    : "Uraian / Esai"}
                </Badge>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold">
                  <span className="text-muted-foreground">Bobot:</span>
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={q.points}
                    onChange={(e) => updateQuestionField(idx, "points", e.target.value)}
                    className="h-8 w-16 text-center text-xs font-bold"
                  />
                  <span className="text-muted-foreground">Poin</span>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  title="Hapus butir soal ini"
                  onClick={() => handleDeleteQuestion(q.id)}
                  className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Question Text Prompt */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                Teks Pertanyaan Soal
              </label>
              <Textarea
                value={q.questionText}
                onChange={(e) => updateQuestionField(idx, "questionText", e.target.value)}
                rows={3}
                placeholder="Tuliskan pertanyaan soal di sini..."
                className="text-xs font-medium leading-relaxed resize-y"
              />
            </div>

            {/* MULTIPLE CHOICE: 4 Editable Options with Clickable Radio Key */}
            {q.type === "MULTIPLE_CHOICE" && (
              <div className="space-y-2 pt-1">
                <label className="block text-xs font-semibold text-muted-foreground">
                  Pilihan Jawaban & Kunci Benar (Klik lingkaran/opsi untuk memilih kunci jawaban)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {q.options?.map((opt: any, optIdx: number) => {
                    const isCorrect = Boolean(opt.isCorrect);
                    const optKey = opt.key || String.fromCharCode(65 + optIdx);
                    return (
                      <div
                        key={optIdx}
                        className={cn(
                          "flex items-center gap-2 p-2 rounded-xl border transition-all",
                          isCorrect
                            ? "bg-emerald-50/70 border-emerald-400 ring-2 ring-emerald-200"
                            : "bg-background border-border"
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => setCorrectOption(idx, optIdx)}
                          className={cn(
                            "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-black text-xs cursor-pointer transition-all",
                            isCorrect
                              ? "bg-emerald-600 text-white shadow-xs"
                              : "bg-muted text-muted-foreground hover:bg-primary/20 hover:text-primary"
                          )}
                          title={isCorrect ? "Kunci Jawaban Benar" : "Jadikan Kunci Benar"}
                        >
                          {isCorrect ? "✓" : optKey}
                        </button>
                        <Input
                          value={opt.text || ""}
                          onChange={(e) => updateOptionText(idx, optIdx, e.target.value)}
                          placeholder={`Teks pilihan ${optKey}...`}
                          className="h-8 text-xs border-0 bg-transparent focus-visible:ring-0 px-1 shadow-none"
                        />
                        {isCorrect && (
                          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-tight shrink-0 mr-1">
                            Kunci
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TRUE / FALSE: 2 Joyful Option Cards */}
            {q.type === "TRUE_FALSE" && (
              <div className="space-y-2 pt-1">
                <label className="block text-xs font-semibold text-muted-foreground">
                  Kunci Jawaban Benar / Salah (Klik salah satu untuk memilih kunci)
                </label>
                <div className="grid grid-cols-2 gap-3 max-w-sm">
                  {q.options?.map((opt: any, optIdx: number) => {
                    const isCorrect = Boolean(opt.isCorrect);
                    const isBenar = (opt.text || "").toLowerCase().includes("benar") || opt.key === "BENAR";
                    return (
                      <button
                        key={optIdx}
                        type="button"
                        onClick={() => setCorrectOption(idx, optIdx)}
                        className={cn(
                          "flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer",
                          isCorrect
                            ? isBenar
                              ? "bg-emerald-600 border-emerald-600 text-white shadow-md ring-2 ring-emerald-300"
                              : "bg-rose-600 border-rose-600 text-white shadow-md ring-2 ring-rose-300"
                            : "bg-muted/40 border-border text-foreground hover:bg-muted"
                        )}
                      >
                        {isCorrect && <Check className="h-4 w-4 stroke-[3]" />}
                        <span>{opt.text || (isBenar ? "Benar" : "Salah")}</span>
                        {isCorrect && <span className="text-[10px] opacity-90">(Kunci)</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ESSAY: Notice */}
            {q.type === "ESSAY" && (
              <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200/80 text-blue-800 text-xs">
                <p className="font-semibold flex items-center gap-1.5">
                  <HelpCircle className="h-3.5 w-3.5 text-blue-600" />
                  <span>Soal Uraian / Esai</span>
                </p>
                <p className="text-[11px] text-blue-700 mt-0.5">
                  Siswa akan menjawab dengan kolom teks terbuka. Nilai dapat diberikan oleh guru melalui menu <strong>Hasil & Nilai</strong>.
                </p>
              </div>
            )}

            {/* Per-Question Insertion Footer */}
            <div className="flex flex-wrap items-center justify-between pt-2.5 border-t border-slate-100 dark:border-slate-800 gap-2">
              <span className="text-[11px] font-medium text-muted-foreground">Soal nomor #{idx + 1}</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-muted-foreground mr-1 hidden sm:inline">Tambah soal di bawah ini:</span>
                <button
                  type="button"
                  onClick={() => handleAddQuestion("MULTIPLE_CHOICE", idx)}
                  className="px-2 py-1 rounded-lg border border-slate-200 bg-white hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 text-slate-600 font-semibold text-[11px] transition-colors cursor-pointer"
                  title="Sisipkan Pilihan Ganda tepat di bawah soal ini"
                >
                  + PG
                </button>
                <button
                  type="button"
                  onClick={() => handleAddQuestion("TRUE_FALSE", idx)}
                  className="px-2 py-1 rounded-lg border border-slate-200 bg-white hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 text-slate-600 font-semibold text-[11px] transition-colors cursor-pointer"
                  title="Sisipkan Benar/Salah tepat di bawah soal ini"
                >
                  + Benar/Salah
                </button>
                <button
                  type="button"
                  onClick={() => handleAddQuestion("ESSAY", idx)}
                  className="px-2 py-1 rounded-lg border border-slate-200 bg-white hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 text-slate-600 font-semibold text-[11px] transition-colors cursor-pointer"
                  title="Sisipkan Esai tepat di bawah soal ini"
                >
                  + Esai
                </button>
              </div>
            </div>
          </Card>
        ))}

        {/* Button: + Tambahkan soal (Tepat di bawah seluruh soal) */}
        <div className="w-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 hover:border-primary/60 dark:hover:border-primary/60 rounded-2xl p-4 shadow-xs transition-all">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => handleAddQuestion("MULTIPLE_CHOICE")}
              className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-sm font-bold text-slate-800 dark:text-slate-100 hover:bg-primary/5 hover:text-primary transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
              <span>Tambahkan soal</span>
            </button>

            <div className="flex flex-wrap items-center justify-center gap-1.5 shrink-0">
              <span className="text-[11px] font-semibold text-muted-foreground mr-1">Tipe:</span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => handleAddQuestion("MULTIPLE_CHOICE")}
                className="h-8 text-xs font-semibold gap-1 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300"
              >
                <Plus className="h-3 w-3" />
                <span>Pilihan Ganda</span>
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => handleAddQuestion("TRUE_FALSE")}
                className="h-8 text-xs font-semibold gap-1 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300"
              >
                <Plus className="h-3 w-3" />
                <span>Benar / Salah</span>
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => handleAddQuestion("ESSAY")}
                className="h-8 text-xs font-semibold gap-1 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300"
              >
                <Plus className="h-3 w-3" />
                <span>Esai</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Bottom Save Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-md border-t border-border shadow-lg flex items-center justify-between max-w-5xl mx-auto rounded-t-2xl z-30">
        <div className="text-xs text-muted-foreground hidden sm:block">
          Pastikan seluruh pertanyaan dan kunci jawaban telah terisi dengan benar sebelum menyimpan.
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/teacher/exams")}
            className="text-xs font-semibold"
          >
            Batal
          </Button>
          <Button
            type="button"
            isLoading={isSaving}
            onClick={() => handleUpdateExam(false)}
            className="font-bold gap-1.5 text-xs bg-primary text-primary-foreground shadow-sm"
          >
            <Save className="h-4 w-4" />
            <span>Simpan Semua Perubahan</span>
          </Button>
        </div>
      </div>

      {/* Modal: Text to Question Parser (Input Teks Otomatis Jadi Soal) */}
      <Dialog open={showTextImportModal} onOpenChange={setShowTextImportModal}>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">Input / Tempel Teks Otomatis Jadi Soal</DialogTitle>
              <DialogDescription className="text-xs">
                Ketik atau tempelkan teks soal dari Word, PDF, WhatsApp, atau dokumen Anda. Format soal, pilihan, kunci jawaban, dan esai akan dipisahkan secara cerdas tanpa error.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 my-3 text-xs">
          {/* Preset Buttons & Auto-format toolbar */}
          <div className="space-y-2 p-3 rounded-xl bg-muted/50 border border-border">
            <div className="flex items-center justify-between">
              <span className="font-bold text-foreground flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Pilih Contoh Format Cepat:
              </span>
              <div className="flex items-center gap-1.5">
                {rawQuestionText && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleBeautifyText}
                      className="h-7 text-xs font-semibold gap-1 text-primary border-primary/30 hover:bg-primary/5"
                    >
                      <Sparkles className="h-3 w-3" />
                      <span>Rapikan Format Teks</span>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setRawQuestionText("");
                        setParsedTextResult(null);
                      }}
                      className="h-7 text-xs text-muted-foreground hover:text-destructive"
                    >
                      <span>Bersihkan</span>
                    </Button>
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {Object.entries(samplePresets).map(([k, preset]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => handleApplyPreset(k)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-background hover:bg-primary/10 hover:text-primary border border-border transition-all cursor-pointer shadow-2xs"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Text Area Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block font-bold text-foreground uppercase tracking-wide">
                Teks Soal Ujian <span className="text-destructive">*</span>
              </label>
              <span className="text-[11px] text-muted-foreground">
                Mendukung nomor 1., A., B., C., Kunci, Bobot, Benar/Salah, dan Esai
              </span>
            </div>
            <Textarea
              placeholder={`Tempelkan atau ketik soal di sini, contoh:
1. Berapakah hasil dari 25 + 15?
A. 30
B. 35
C. 40
D. 45
Kunci: C
Pembahasan: 25 + 15 = 40.

2. Candi Borobudur terletak di Jawa Tengah.
A. Benar
B. Salah
Kunci: Benar

3. Jelaskan proses fotosintesis pada tumbuhan hijau!`}
              value={rawQuestionText}
              onChange={(e) => {
                setRawQuestionText(e.target.value);
                if (e.target.value.trim()) {
                  const res = parseQuestionsFromRawText(e.target.value);
                  setParsedTextResult(res);
                } else {
                  setParsedTextResult(null);
                }
              }}
              rows={9}
              className="font-mono text-xs leading-relaxed"
            />
          </div>

          {/* Real-time Parse Results & Interactive Preview */}
          {parsedTextResult && (
            <div className="space-y-3 pt-2 border-t border-border">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={parsedTextResult.validCount > 0 ? "default" : "destructive"}
                    className="text-xs font-bold bg-emerald-600 hover:bg-emerald-600 text-white"
                  >
                    ✨ {parsedTextResult.validCount} Soal Berhasil Dikenali
                  </Badge>
                  <span className="text-[11px] text-muted-foreground">
                    ({parsedTextResult.questions.filter((q: any) => q.type === "MULTIPLE_CHOICE").length} PG,{" "}
                    {parsedTextResult.questions.filter((q: any) => q.type === "TRUE_FALSE").length} BS,{" "}
                    {parsedTextResult.questions.filter((q: any) => q.type === "ESSAY").length} Esai)
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs font-medium">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="editModalTextMode"
                      checked={textImportMode === "APPEND"}
                      onChange={() => setTextImportMode("APPEND")}
                      className="text-primary"
                    />
                    <span>Tambahkan ke Soal Ada</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="editModalTextMode"
                      checked={textImportMode === "REPLACE"}
                      onChange={() => setTextImportMode("REPLACE")}
                      className="text-primary"
                    />
                    <span>Gantikan Lembar Soal</span>
                  </label>
                </div>
              </div>

              {/* Preview List with Interactive Key Toggle & Type Switcher */}
              <div className="max-h-72 overflow-y-auto space-y-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-border">
                {parsedTextResult.questions.map((q: any, qIdx: number) => (
                  <div
                    key={qIdx}
                    className="p-3 rounded-xl bg-background border border-border space-y-2.5 text-xs shadow-xs transition-all"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-foreground px-2 py-0.5 rounded bg-muted">
                          No. {qIdx + 1}
                        </span>

                        {/* Question Type Switcher */}
                        <select
                          value={q.type}
                          onChange={(e: any) => handleUpdatePreviewQuestionType(qIdx, e.target.value)}
                          className="h-6 text-[11px] font-bold rounded-md bg-muted/60 border border-border px-1.5 text-foreground cursor-pointer focus:outline-none"
                        >
                          <option value="MULTIPLE_CHOICE">Pilihan Ganda (PG)</option>
                          <option value="TRUE_FALSE">Benar / Salah (BS)</option>
                          <option value="ESSAY">Esai / Uraian</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-muted/40 px-2 py-0.5 rounded-md border border-border">
                          <span className="text-[11px] text-muted-foreground font-semibold">Bobot:</span>
                          <input
                            type="number"
                            min="0.5"
                            step="0.5"
                            value={q.points}
                            onChange={(e) => handleUpdatePreviewQuestionPoints(qIdx, parseFloat(e.target.value))}
                            className="w-12 h-5 text-center text-[11px] font-bold bg-background border border-input rounded"
                          />
                          <span className="text-[11px] text-muted-foreground">Poin</span>
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletePreviewQuestion(qIdx)}
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md"
                          title="Hapus soal ini"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    <p className="font-semibold text-foreground leading-relaxed">{q.questionText}</p>

                    {/* Interactive Options list - Click to toggle correct key! */}
                    {q.type !== "ESSAY" && q.options && q.options.length > 0 && (
                      <div className="space-y-1 pt-1">
                        <p className="text-[10px] text-muted-foreground italic">
                          💡 Klik pada kotak opsi di bawah untuk mengubah kunci jawaban yang benar:
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {q.options.map((opt: any, optIdx: number) => (
                            <div
                              key={optIdx}
                              onClick={() => handleTogglePreviewOptionKey(qIdx, opt.key)}
                              className={cn(
                                "p-2 rounded-lg border text-[11px] cursor-pointer transition-all flex items-center justify-between gap-2 select-none",
                                opt.isCorrect
                                  ? "border-emerald-500 bg-emerald-50 text-emerald-900 font-bold dark:bg-emerald-950/40 dark:text-emerald-300 ring-2 ring-emerald-500/20 shadow-xs"
                                  : "border-border bg-background text-muted-foreground hover:border-emerald-300 hover:bg-muted/30"
                              )}
                            >
                              <div className="flex items-center gap-1.5 truncate">
                                <span className="font-bold">{opt.key}.</span>
                                <span className="truncate">{opt.text}</span>
                              </div>
                              {opt.isCorrect ? (
                                <Badge className="text-[9px] px-1.5 py-0 bg-emerald-600 text-white font-bold shrink-0">
                                  Kunci ✓
                                </Badge>
                              ) : (
                                <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 shrink-0">
                                  Pilih Kunci
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {q.type === "ESSAY" && (
                      <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-[11px] text-amber-800 dark:text-amber-300">
                        ✍️ <strong>Soal Esai:</strong> Siswa akan menjawab dengan mengetik teks uraian bebas.
                      </div>
                    )}

                    {q.explanation && (
                      <p className="text-[11px] text-muted-foreground pt-1.5 border-t border-border/60">
                        <strong>Pembahasan:</strong> {q.explanation}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setShowTextImportModal(false);
              setRawQuestionText("");
              setParsedTextResult(null);
            }}
          >
            Batal
          </Button>
          <Button
            type="button"
            isLoading={isApplyingText}
            disabled={!parsedTextResult || parsedTextResult.validCount === 0 || isApplyingText}
            onClick={handleApplyTextQuestions}
            className="font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white gap-2 shadow-md"
          >
            <Sparkles className="h-4 w-4" />
            <span>
              Masukkan {parsedTextResult?.validCount || 0} Soal ke Lembar Ujian
            </span>
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
