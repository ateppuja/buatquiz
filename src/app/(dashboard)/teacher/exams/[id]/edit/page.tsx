"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";
import { formatDateTimeLocal, parseDateInput, cn } from "@/lib/utils";
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
              points: parseFloat(q.points) || 5,
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

  const handleAddQuestion = async (type: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "ESSAY") => {
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

      const res = await fetch(`/api/v1/teacher/exams/${examId}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          questionText: "Tuliskan pertanyaan baru di sini...",
          points: type === "ESSAY" ? 15 : 5,
          options: defaultOptions,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Soal baru berhasil ditambahkan.");
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
          <div className="flex items-center gap-1.5">
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
          </Card>
        ))}
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
    </div>
  );
}
