"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import { formatDateTimeLocal, cn } from "@/lib/utils";
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
      setQuestions(ex.questions || []);
    } catch {
      toast.error("Gagal memuat detail ujian.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (examId) loadExamDetail();
  }, [examId]);

  const handleUpdateExam = async (publish: boolean = false) => {
    setIsSaving(true);
    try {
      // 1. Update Exam
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
        toast.error(data.error?.message || "Gagal menyimpan perubahan.");
        setIsSaving(false);
        return;
      }

      // 2. If publishing
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

      toast.success("Perubahan ujian berhasil disimpan.");
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

  if (isLoading || !exam) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-xs text-muted-foreground">Memuat data ujian...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <button
              type="button"
              onClick={() => router.push("/teacher/exams")}
              className="text-muted-foreground hover:text-foreground text-xs flex items-center gap-1 font-semibold"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Daftar Ujian</span>
            </button>
            <span className="text-muted-foreground">•</span>
            <Badge variant="outline" className="text-xs">{exam.subject?.name}</Badge>
            {exam.status === "PUBLISHED" && <Badge variant="success" className="text-xs">Aktif ({exam.examCode})</Badge>}
            {exam.status === "DRAFT" && <Badge variant="outline" className="text-xs">Draft</Badge>}
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Edit Ujian & Lembar Soal</h1>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" isLoading={isSaving} onClick={() => handleUpdateExam(false)} className="gap-1.5 text-xs font-semibold">
            <Save className="h-4 w-4" />
            <span>Simpan Perubahan</span>
          </Button>
          {exam.status === "DRAFT" && (
            <Button onClick={() => handleUpdateExam(true)} isLoading={isSaving} className="font-bold gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700">
              <Sparkles className="h-4 w-4" />
              <span>Terbitkan Ujian</span>
            </Button>
          )}
        </div>
      </div>

      {/* Basic Info Card */}
      <Card className="p-5 shadow-sm border-border space-y-4">
        <h3 className="text-sm font-bold text-foreground">Informasi Pelaksanaan</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="sm:col-span-2">
            <label className="block font-semibold text-muted-foreground mb-1">Judul Ujian</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="h-10" />
          </div>
          <div>
            <label className="block font-semibold text-muted-foreground mb-1">Durasi (Menit)</label>
            <Input
              type="number"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10))}
              className="h-10"
            />
          </div>
          <div>
            <label className="block font-semibold text-muted-foreground mb-1">Maks. Percobaan</label>
            <Input
              type="number"
              value={maxAttempts}
              onChange={(e) => setMaxAttempts(parseInt(e.target.value, 10))}
              className="h-10"
            />
          </div>
          <div>
            <label className="block font-semibold text-muted-foreground mb-1">Waktu Mulai</label>
            <Input
              type="datetime-local"
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
              className="h-10"
            />
          </div>
          <div>
            <label className="block font-semibold text-muted-foreground mb-1">Waktu Berakhir</label>
            <Input
              type="datetime-local"
              value={endAt}
              onChange={(e) => setEndAt(e.target.value)}
              className="h-10"
            />
          </div>
        </div>
      </Card>

      {/* Questions Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground">Daftar Soal ({questions.length} Butir)</h2>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => handleAddQuestion("MULTIPLE_CHOICE")} className="text-xs">
              + PG
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleAddQuestion("TRUE_FALSE")} className="text-xs">
              + Benar/Salah
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleAddQuestion("ESSAY")} className="text-xs">
              + Esai
            </Button>
          </div>
        </div>

        {questions.map((q, idx) => (
          <Card key={q.id} className="p-4 shadow-sm border-border space-y-3">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <span className="font-bold text-xs">
                Soal #{idx + 1} ({q.type}) — {q.points} Poin
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDeleteQuestion(q.id)}
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
            <p className="text-sm text-foreground">{q.questionText}</p>
            {q.options && q.options.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {q.options.map((opt: any) => (
                  <div
                    key={opt.id || opt.optionKey}
                    className={cn(
                      "p-2 rounded border",
                      opt.isCorrect
                        ? "border-emerald-500 bg-emerald-50/50 text-emerald-800 font-bold dark:bg-emerald-950/40 dark:text-emerald-300"
                        : "border-border text-muted-foreground"
                    )}
                  >
                    {opt.optionKey}. {opt.optionText} {opt.isCorrect && "✓ (Kunci)"}
                  </div>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
