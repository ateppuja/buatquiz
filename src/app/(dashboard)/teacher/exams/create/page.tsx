"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  FileText,
  FilePlus,
  Settings2,
  CheckCircle2,
  Upload,
  Download,
  Trash2,
  Plus,
  Sparkles,
  HelpCircle,
  Copy,
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
  Clock,
  Layers,
  BookOpen,
  PlusCircle,
  Edit2,
  Check,
  X,
} from "lucide-react";
import { formatDateTimeLocal, parseDateInput, cn } from "@/lib/utils";
import { parseQuestionsFromRawText } from "@/lib/text-parser";
import { toast } from "sonner";

export default function CreateExamWizardPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);

  // Reference data
  const [subjects, setSubjects] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);

  // Step 1: Info Ujian
  const [title, setTitle] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");

  // Step 2: Soal Ujian
  const [questions, setQuestions] = useState<any[]>([
    {
      id: "temp-1",
      type: "MULTIPLE_CHOICE",
      questionText: "",
      points: 5,
      explanation: "",
      options: [
        { key: "A", text: "", isCorrect: false },
        { key: "B", text: "", isCorrect: false },
        { key: "C", text: "", isCorrect: false },
        { key: "D", text: "", isCorrect: false },
      ],
    },
  ]);

  // Step 3: Pengaturan
  const [maxAttempts, setMaxAttempts] = useState(1);
  const [gradingMethod, setGradingMethod] = useState("HIGHEST");
  const [resultVisibility, setResultVisibility] = useState("MANUAL");
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [shuffleOptions, setShuffleOptions] = useState(false);
  const [navigationMode, setNavigationMode] = useState("FREE");
  const [showAnswerKey, setShowAnswerKey] = useState(false);
  const [pin, setPin] = useState("");

  // Import file state
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [previewParsedQuestions, setPreviewParsedQuestions] = useState<any[]>([]);

  // Publish & Draft state
  const [isSaving, setIsSaving] = useState(false);
  const [publishedResult, setPublishedResult] = useState<any>(null);

  // Quick Custom Subject modal state
  const [showQuickSubjectModal, setShowQuickSubjectModal] = useState(false);
  const [quickSubjectTab, setQuickSubjectTab] = useState<"CREATE" | "MANAGE">("CREATE");
  const [quickSubjectName, setQuickSubjectName] = useState("");
  const [quickSubjectCode, setQuickSubjectCode] = useState("");
  const [isQuickSubjectSubmitting, setIsQuickSubjectSubmitting] = useState(false);

  // Inline subject edit & delete state
  const [inlineEditSubjectId, setInlineEditSubjectId] = useState<string | null>(null);
  const [inlineEditName, setInlineEditName] = useState("");
  const [inlineEditCode, setInlineEditCode] = useState("");
  const [isInlineUpdating, setIsInlineUpdating] = useState(false);

  const handleQuickCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickSubjectName.trim()) {
      toast.error("Nama mata pelajaran wajib diisi.");
      return;
    }

    setIsQuickSubjectSubmitting(true);
    try {
      const res = await fetch("/api/v1/teacher/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: quickSubjectName.trim(),
          code: quickSubjectCode.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Mata pelajaran ${data.data.name} berhasil dibuat!`);
        setSubjects((prev) => [...prev, data.data]);
        setSubjectId(data.data.id);
        setShowQuickSubjectModal(false);
        setQuickSubjectName("");
        setQuickSubjectCode("");
      } else {
        toast.error(data.error?.message || "Gagal membuat mata pelajaran.");
      }
    } catch {
      toast.error("Terjadi kesalahan sistem saat membuat mata pelajaran.");
    } finally {
      setIsQuickSubjectSubmitting(false);
    }
  };

  const handleQuickDeleteSubject = async (subId: string, subName: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus mata pelajaran "${subName}"?`)) return;
    try {
      const res = await fetch(`/api/v1/teacher/subjects/${subId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success(`Mata pelajaran "${subName}" berhasil dihapus.`);
        setSubjects((prev) => {
          const next = prev.filter((s) => s.id !== subId);
          if (subjectId === subId && next.length > 0) {
            setSubjectId(next[0].id);
          }
          return next;
        });
      } else {
        toast.error(data.error?.message || "Gagal menghapus mata pelajaran.");
      }
    } catch {
      toast.error("Terjadi kesalahan saat menghapus mata pelajaran.");
    }
  };

  const handleQuickUpdateSubject = async (subId: string) => {
    if (!inlineEditName.trim()) {
      toast.error("Nama mata pelajaran tidak boleh kosong.");
      return;
    }
    setIsInlineUpdating(true);
    try {
      const res = await fetch(`/api/v1/teacher/subjects/${subId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: inlineEditName.trim(),
          code: inlineEditCode.trim().toUpperCase() || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Mata pelajaran berhasil diperbarui!");
        setSubjects((prev) =>
          prev.map((s) =>
            s.id === subId
              ? { ...s, name: inlineEditName.trim(), code: inlineEditCode.trim().toUpperCase() }
              : s
          )
        );
        setInlineEditSubjectId(null);
      } else {
        toast.error(data.error?.message || "Gagal memperbarui mata pelajaran.");
      }
    } catch {
      toast.error("Terjadi kesalahan saat memperbarui mata pelajaran.");
    } finally {
      setIsInlineUpdating(false);
    }
  };

  // Text to Question Parser modal state
  const [showTextImportModal, setShowTextImportModal] = useState(false);
  const [rawQuestionText, setRawQuestionText] = useState("");
  const [parsedTextResult, setParsedTextResult] = useState<any>(null);
  const [textImportMode, setTextImportMode] = useState<"APPEND" | "REPLACE">("APPEND");

  const sampleTextFormat = `1. Berapakah hasil dari 25 + 15?
A. 30
B. 35
C. 40
D. 45
Kunci: C
Bobot: 10
Pembahasan: 25 + 15 = 40.

2. Ibukota Indonesia adalah Nusantara.
A. Benar
B. Salah
Kunci: A
Bobot: 5

3. Jelaskan pengertian dari fotosintesis pada tumbuhan hijau!
Bobot: 20
Pembahasan: Fotosintesis adalah proses tumbuhan hijau mengubah energi cahaya menjadi energi kimia.`;

  const handleParseText = () => {
    if (!rawQuestionText.trim()) {
      toast.error("Silakan ketik atau tempelkan teks soal terlebih dahulu.");
      return;
    }
    const result = parseQuestionsFromRawText(rawQuestionText);
    setParsedTextResult(result);
    if (result.success) {
      toast.success(`Berhasil mengenali ${result.validCount} butir soal!`);
    } else {
      toast.error(result.globalErrors[0] || "Tidak ada butir soal yang valid.");
    }
  };

  const handleApplyTextQuestions = () => {
    if (!parsedTextResult || parsedTextResult.validCount === 0) {
      toast.error("Tidak ada butir soal valid yang dapat dimasukkan.");
      return;
    }

    const converted = parsedTextResult.questions
      .filter((q: any) => q.isValid)
      .map((q: any, idx: number) => ({
        id: `text-q-${Date.now()}-${idx}`,
        type: q.type,
        questionText: q.questionText,
        points: q.points || 5,
        explanation: q.explanation || "",
        options: q.options || [],
      }));

    if (textImportMode === "REPLACE") {
      setQuestions(converted);
    } else {
      setQuestions((prev) => {
        // If current questions only contains 1 empty initial placeholder, replace it
        if (
          prev.length === 1 &&
          !prev[0].questionText.trim() &&
          (!prev[0].options || prev[0].options.every((o: any) => !o.text.trim()))
        ) {
          return converted;
        }
        return [...prev, ...converted];
      });
    }

    toast.success(`Berhasil memasukkan ${converted.length} butir soal ke lembar ujian!`);
    setShowTextImportModal(false);
    setRawQuestionText("");
    setParsedTextResult(null);
  };

  useEffect(() => {
    async function loadData() {
      try {
        const [resSub, resCls] = await Promise.all([
          fetch("/api/v1/admin/subjects"),
          fetch("/api/v1/admin/classes"),
        ]);
        const dataSub = await resSub.json();
        const dataCls = await resCls.json();

        if (dataSub.success) {
          setSubjects(dataSub.data);
          if (dataSub.data.length > 0) setSubjectId(dataSub.data[0].id);
        }
        if (dataCls.success) {
          setClasses(dataCls.data);
          if (dataCls.data.length > 0) setSelectedClassIds([dataCls.data[0].id]);
        }

        // Set default start and end date
        const now = new Date();
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        setStartAt(formatDateTimeLocal(now));
        setEndAt(formatDateTimeLocal(tomorrow));
      } catch {
        toast.error("Gagal memuat data referensi.");
      }
    }
    loadData();
  }, []);

  const toggleClassSelection = (clsId: string) => {
    setSelectedClassIds((prev) =>
      prev.includes(clsId) ? prev.filter((id) => id !== clsId) : [...prev, clsId]
    );
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

  // --- Step 2 Question Helpers ---
  const addQuestion = (type: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "ESSAY") => {
    const newQ: any = {
      id: `temp-${Date.now()}`,
      type,
      questionText: "",
      points: type === "ESSAY" ? 15 : 5,
      explanation: "",
      options:
        type === "MULTIPLE_CHOICE"
          ? [
              { key: "A", text: "", isCorrect: false },
              { key: "B", text: "", isCorrect: false },
              { key: "C", text: "", isCorrect: false },
              { key: "D", text: "", isCorrect: false },
            ]
          : type === "TRUE_FALSE"
          ? [
              { key: "BENAR", text: "Benar", isCorrect: true },
              { key: "SALAH", text: "Salah", isCorrect: false },
            ]
          : [],
    };
    setQuestions([...questions, newQ]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length === 1) {
      toast.error("Ujian minimal harus memiliki 1 butir soal.");
      return;
    }
    setQuestions(questions.filter((_, idx) => idx !== index));
  };

  const updateQuestionField = (index: number, field: string, val: any) => {
    const updated = [...questions];
    updated[index][field] = val;
    setQuestions(updated);
  };

  const updateOptionText = (qIndex: number, optIndex: number, text: string) => {
    const updated = [...questions];
    updated[qIndex].options[optIndex].text = text;
    setQuestions(updated);
  };

  const setCorrectOption = (qIndex: number, optIndex: number) => {
    const updated = [...questions];
    updated[qIndex].options = updated[qIndex].options.map((o: any, idx: number) => ({
      ...o,
      isCorrect: idx === optIndex,
    }));
    setQuestions(updated);
  };

  // --- Import Word / Excel Handler ---
  const handleFileParse = async () => {
    if (!importFile) {
      toast.error("Pilih file Word (.docx) atau Excel (.xlsx).");
      return;
    }

    setIsImporting(true);
    try {
      const formData = new FormData();
      formData.append("file", importFile);

      // We can use the mock endpoint or direct parse
      const res = await fetch("/api/v1/teacher/exams/import-preview", {
        method: "POST",
        body: formData,
      }).catch(() => null);

      // If dedicated preview route doesn't exist, we fallback to client-side parse if needed or use main import
      if (res && res.ok) {
        const data = await res.json();
        setPreviewParsedQuestions(data.data?.questions || []);
      } else {
        toast.info("Memproses file dokumen...");
        // Use standard import endpoint preview
        const res2 = await fetch("/api/v1/teacher/exams/000/import", {
          method: "POST",
          body: formData,
        });
        const data2 = await res2.json();
        if (data2.success) {
          setPreviewParsedQuestions(data2.data.questions || []);
        } else {
          toast.error(data2.error?.message || "Format dokumen tidak sesuai template.");
        }
      }
    } catch {
      toast.error("Gagal mengurai file dokumen.");
    } finally {
      setIsImporting(false);
    }
  };

  const handleApplyImportedQuestions = () => {
    const validQuestions = previewParsedQuestions.filter((q) => q.isValid);
    if (validQuestions.length === 0) {
      toast.error("Tidak ada soal valid untuk dimasukkan.");
      return;
    }

    const converted = validQuestions.map((q, idx) => ({
      id: `imported-${Date.now()}-${idx}`,
      type: q.type,
      questionText: q.questionText,
      points: q.points,
      explanation: q.explanation || "",
      options: q.options || [],
    }));

    setQuestions((prev) => (prev.length === 1 && !prev[0].questionText ? converted : [...prev, ...converted]));
    setShowImportModal(false);
    setPreviewParsedQuestions([]);
    setImportFile(null);
    toast.success(`Berhasil menambahkan ${converted.length} soal dari dokumen!`);
  };

  // --- Submit / Publish Wizard ---
  const handleSaveExam = async (publish: boolean) => {
    // Validations
    if (!title.trim()) {
      toast.error("Judul ujian wajib diisi.");
      setCurrentStep(1);
      return;
    }
    if (!subjectId) {
      toast.error("Mata pelajaran wajib dipilih.");
      setCurrentStep(1);
      return;
    }
    if (selectedClassIds.length === 0) {
      toast.error("Pilih minimal satu kelas peserta.");
      setCurrentStep(1);
      return;
    }

    if (startAt && endAt) {
      const sDate = parseDateInput(startAt);
      const eDate = parseDateInput(endAt);
      if (sDate && eDate && eDate <= sDate) {
        toast.error("Waktu berakhir ujian harus lebih lambat daripada waktu mulai.");
        setCurrentStep(1);
        return;
      }
    }

    // Question validation
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText.trim()) {
        toast.error(`Pertanyaan soal nomor ${i + 1} belum diisi.`);
        setCurrentStep(2);
        return;
      }
      if (q.type === "MULTIPLE_CHOICE" || q.type === "TRUE_FALSE") {
        const hasKey = q.options.some((o: any) => o.isCorrect);
        if (!hasKey) {
          toast.error(`Kunci jawaban untuk soal nomor ${i + 1} belum dipilih.`);
          setCurrentStep(2);
          return;
        }
      }
    }

    setIsSaving(true);
    try {
      // 1. Create Exam record
      const res = await fetch("/api/v1/teacher/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          subjectId,
          classIds: selectedClassIds,
          description: description.trim(),
          instructions: instructions.trim(),
          durationMinutes,
          startAt,
          endAt,
          maxAttempts,
          gradingMethod,
          resultVisibility,
          shuffleQuestions,
          shuffleOptions,
          navigationMode,
          showAnswerKey,
          pin: pin.trim() || undefined,
        }),
      });

      const examData = await res.json();
      if (!res.ok || !examData.success) {
        toast.error(examData.error?.message || "Gagal membuat ujian.");
        setIsSaving(false);
        return;
      }

      const examId = examData.data.id;

      // 2. Add Questions
      for (const q of questions) {
        await fetch(`/api/v1/teacher/exams/${examId}/questions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(q),
        });
      }

      // 3. Publish if requested
      if (publish) {
        const pubRes = await fetch(`/api/v1/teacher/exams/${examId}/publish`, {
          method: "POST",
        });
        const pubData = await pubRes.json();
        if (pubData.success) {
          setPublishedResult(pubData.data);
          toast.success("Ujian berhasil diterbitkan!");
        } else {
          toast.error(pubData.error?.message || "Gagal menerbitkan ujian.");
        }
      } else {
        toast.success("Draft ujian berhasil disimpan.");
        router.push("/teacher/exams");
      }
    } catch {
      toast.error("Terjadi kesalahan saat menyimpan ujian.");
    } finally {
      setIsSaving(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Kode ujian ${code} disalin ke clipboard!`);
  };

  const totalExamPoints = questions.reduce((acc, q) => acc + (parseFloat(q.points) || 0), 0);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Wizard Header */}
      <div className="border-b border-border pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Pembuatan Ujian Baru</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Lengkapi 4 tahapan pembuatan ujian di bawah ini untuk menerbitkan ujian dan mendapatkan kode akses.
        </p>

        {/* Step Progress Bar */}
        <div className="mt-6 grid grid-cols-4 gap-2 sm:gap-4">
          {[
            { num: 1, label: "Informasi Ujian" },
            { num: 2, label: "Memasukkan Soal" },
            { num: 3, label: "Pengaturan" },
            { num: 4, label: "Pratinjau & Terbitkan" },
          ].map((s) => (
            <button
              key={s.num}
              type="button"
              onClick={() => setCurrentStep(s.num)}
              className={cn(
                "flex flex-col sm:flex-row items-center gap-2 p-3 rounded-xl border text-center sm:text-left transition-all",
                currentStep === s.num
                  ? "border-primary bg-primary/5 text-primary ring-2 ring-primary/20 font-bold"
                  : currentStep > s.num
                  ? "border-emerald-500 bg-emerald-50/40 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400"
                  : "border-border bg-card text-muted-foreground"
              )}
            >
              <div
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                  currentStep === s.num
                    ? "bg-primary text-primary-foreground"
                    : currentStep > s.num
                    ? "bg-emerald-600 text-white"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {s.num}
              </div>
              <span className="text-xs">{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* TAHAP 1: Informasi Ujian */}
      {currentStep === 1 && (
        <Card className="shadow-sm border-border p-6 space-y-6">
          <div className="border-b border-border pb-3">
            <CardTitle className="text-lg font-bold">Tahap 1 — Informasi Dasar Ujian</CardTitle>
            <CardDescription>Tentukan judul, mata pelajaran, durasi, dan kelas target</CardDescription>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Judul Ujian <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="Contoh: Ujian Tengah Semester Matematika Kelas IX A"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={150}
                className="h-11 text-base font-medium"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Mata Pelajaran <span className="text-destructive">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setQuickSubjectTab("CREATE");
                      setShowQuickSubjectModal(true);
                    }}
                    className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span>+ Tambah</span>
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => {
                      setQuickSubjectTab("MANAGE");
                      setShowQuickSubjectModal(true);
                    }}
                    className="text-xs font-bold text-slate-600 hover:text-primary hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <BookOpen className="h-3.5 w-3.5" />
                    <span>Kelola Mapel</span>
                  </button>
                </div>
              </div>
              <select
                value={subjectId}
                onChange={(e) => {
                  if (e.target.value === "ADD_CUSTOM") {
                    setQuickSubjectTab("CREATE");
                    setShowQuickSubjectModal(true);
                  } else if (e.target.value === "MANAGE_CUSTOM") {
                    setQuickSubjectTab("MANAGE");
                    setShowQuickSubjectModal(true);
                  } else {
                    setSubjectId(e.target.value);
                  }
                }}
                className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name} ({sub.code})
                  </option>
                ))}
                <option value="ADD_CUSTOM" className="font-bold text-primary">
                  ✨ + Tambah Mata Pelajaran Baru...
                </option>
                <option value="MANAGE_CUSTOM" className="font-bold text-slate-700">
                  ⚙️ Kelola / Edit / Hapus Mata Pelajaran...
                </option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Durasi Ujian (Menit) <span className="text-destructive">*</span>
              </label>
              <Input
                type="number"
                min={1}
                max={300}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10) || 60)}
                className="h-11"
              />
            </div>

            {/* Waktu Mulai with Quick Presets */}
            <div className="space-y-1.5 bg-[#F9FCF5] p-3 rounded-2xl border border-[#D8EEB6]">
              <div className="flex items-center justify-between">
                <label className="block font-black uppercase tracking-wider text-[#4B7914] text-xs">
                  Waktu Mulai Ujian (WIB) <span className="text-destructive">*</span>
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
                <label className="block font-black uppercase tracking-wider text-[#4B7914] text-xs">
                  Waktu Berakhir Ujian (WIB) <span className="text-destructive">*</span>
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

            {/* Class Multi-select */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Kelas Peserta yang Berhak Mengikuti <span className="text-destructive">*</span>
              </label>
              <div className="flex flex-wrap gap-2 pt-1">
                {classes.map((cls) => {
                  const isSelected = selectedClassIds.includes(cls.id);
                  return (
                    <button
                      key={cls.id}
                      type="button"
                      onClick={() => toggleClassSelection(cls.id)}
                      className={cn(
                        "px-3.5 py-2 rounded-xl text-xs font-bold border transition-all",
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground shadow-sm"
                          : "border-border bg-background hover:bg-muted text-foreground"
                      )}
                    >
                      Kelas {cls.name} ({cls.gradeLevel})
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Deskripsi Singkat (Opsional)
              </label>
              <Input
                placeholder="Contoh: Materi persamaan kuadrat dan geometri datar"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Instruksi Khusus untuk Murid (Opsional)
              </label>
              <Textarea
                placeholder="Contoh: Dilarang menggunakan kalkulator. Kerjakan soal yang mudah terlebih dahulu."
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-border">
            <Button
              onClick={() => {
                if (!title.trim()) {
                  toast.error("Judul ujian wajib diisi.");
                  return;
                }
                if (!subjectId) {
                  toast.error("Mata pelajaran wajib dipilih.");
                  return;
                }
                if (selectedClassIds.length === 0) {
                  toast.error("Pilih minimal satu kelas peserta.");
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
                setCurrentStep(2);
              }}
              className="font-bold gap-2"
            >
              <span>Lanjut ke Tahap 2 (Soal)</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* TAHAP 2: Memasukkan Soal (Manual & Import Word/Excel) */}
      {currentStep === 2 && (
        <div className="space-y-6">
          {/* Top Actions: Add Question & Import Document Buttons */}
          <Card className="shadow-sm border-border p-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-foreground">
                  Total Soal: {questions.length} Butir ({totalExamPoints} Poin)
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setShowTextImportModal(true)}
                  className="gap-1.5 text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm hover:from-blue-700 hover:to-indigo-700"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Input / Tempel Teks Soal</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowImportModal(true)}
                  className="gap-1.5 text-xs font-semibold border-blue-200 bg-blue-50/50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                >
                  <Upload className="h-4 w-4" />
                  <span>Import Word / Excel</span>
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addQuestion("MULTIPLE_CHOICE")}
                  className="gap-1 text-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>+ Pilihan Ganda</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addQuestion("TRUE_FALSE")}
                  className="gap-1 text-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>+ Benar/Salah</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addQuestion("ESSAY")}
                  className="gap-1 text-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>+ Esai</span>
                </Button>
              </div>
            </div>
          </Card>

          {/* Questions List */}
          <div className="space-y-5">
            {questions.map((q, qIdx) => (
              <Card key={q.id} className="shadow-sm border-border p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xs">
                      {qIdx + 1}
                    </span>
                    <Badge variant="outline" className="text-xs font-semibold">
                      {q.type === "MULTIPLE_CHOICE"
                        ? "Pilihan Ganda"
                        : q.type === "TRUE_FALSE"
                        ? "Benar / Salah"
                        : "Esai / Uraian"}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-muted-foreground font-medium">Bobot:</span>
                      <Input
                        type="number"
                        min={1}
                        value={q.points}
                        onChange={(e) =>
                          updateQuestionField(qIdx, "points", parseFloat(e.target.value) || 1)
                        }
                        className="w-16 h-8 text-xs font-bold text-center"
                      />
                      <span className="text-muted-foreground">Poin</span>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeQuestion(qIdx)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      title="Hapus Soal"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Question Prompt */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Teks Pertanyaan <span className="text-destructive">*</span>
                  </label>
                  <Textarea
                    placeholder="Tuliskan pertanyaan soal di sini..."
                    value={q.questionText}
                    onChange={(e) => updateQuestionField(qIdx, "questionText", e.target.value)}
                    rows={3}
                    className="text-sm font-medium leading-relaxed"
                  />
                </div>

                {/* Multiple Choice Options */}
                {q.type === "MULTIPLE_CHOICE" && (
                  <div className="space-y-2.5 pt-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Pilihan Jawaban & Kunci Jawaban (Pilih 1 Kunci yang Benar):
                    </label>
                    {q.options.map((opt: any, optIdx: number) => (
                      <div key={opt.key} className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => setCorrectOption(qIdx, optIdx)}
                          className={cn(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-bold text-xs uppercase border transition-colors",
                            opt.isCorrect
                              ? "border-emerald-600 bg-emerald-600 text-white shadow-sm"
                              : "border-border bg-muted text-muted-foreground hover:bg-muted/80"
                          )}
                          title={opt.isCorrect ? "Kunci Jawaban Benar" : "Klik untuk jadikan kunci jawaban"}
                        >
                          {opt.key}
                        </button>
                        <Input
                          placeholder={`Isi pilihan ${opt.key}...`}
                          value={opt.text}
                          onChange={(e) => updateOptionText(qIdx, optIdx, e.target.value)}
                          className={cn("h-9 text-xs", opt.isCorrect ? "border-emerald-500 font-semibold" : "")}
                        />
                        {opt.isCorrect && (
                          <Badge variant="success" className="text-[10px] shrink-0">
                            Kunci Jawaban
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* True / False Options */}
                {q.type === "TRUE_FALSE" && (
                  <div className="space-y-2.5 pt-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Pilih Kunci Jawaban yang Benar:
                    </label>
                    <div className="flex gap-4">
                      {q.options.map((opt: any, optIdx: number) => (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => setCorrectOption(qIdx, optIdx)}
                          className={cn(
                            "flex-1 p-3 rounded-xl border text-xs font-bold transition-all",
                            opt.isCorrect
                              ? "border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20 dark:bg-emerald-950/40 dark:text-emerald-300"
                              : "border-border bg-card text-muted-foreground hover:bg-muted"
                          )}
                        >
                          {opt.text} {opt.isCorrect && "✓ (Kunci Benar)"}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Essay Note */}
                {q.type === "ESSAY" && (
                  <div className="rounded-lg bg-slate-50 dark:bg-slate-900 p-3 border border-border text-xs text-muted-foreground">
                    💡 <em>Soal jenis esai/uraian akan dinilai secara manual oleh guru pada menu Koreksi Esai setelah murid mengumpulkan jawaban.</em>
                  </div>
                )}

                {/* Explanation */}
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Pembahasan / Catatan Penilaian (Opsional):
                  </label>
                  <Input
                    placeholder="Tuliskan pembahasan soal ini..."
                    value={q.explanation || ""}
                    onChange={(e) => updateQuestionField(qIdx, "explanation", e.target.value)}
                    className="text-xs"
                  />
                </div>
              </Card>
            ))}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-border">
            <Button variant="outline" onClick={() => setCurrentStep(1)} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Kembali</span>
            </Button>
            <Button onClick={() => setCurrentStep(3)} className="font-bold gap-2">
              <span>Lanjut ke Pengaturan</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* TAHAP 3: Pengaturan Ujian */}
      {currentStep === 3 && (
        <Card className="shadow-sm border-border p-6 space-y-6">
          <div className="border-b border-border pb-3">
            <CardTitle className="text-lg font-bold">Tahap 3 — Pengaturan Pelaksanaan Ujian</CardTitle>
            <CardDescription>Atur batas percobaan, pengacakan soal, dan visibilitas hasil</CardDescription>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Max Attempts */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Batas Maksimal Percobaan
              </label>
              <select
                value={maxAttempts}
                onChange={(e) => setMaxAttempts(parseInt(e.target.value, 10))}
                className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              >
                {[1, 2, 3, 4, 5, 10].map((num) => (
                  <option key={num} value={num}>
                    {num} Kali Percobaan
                  </option>
                ))}
              </select>
            </div>

            {/* Grading Method */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Metode Perhitungan Nilai Akhir
              </label>
              <select
                value={gradingMethod}
                onChange={(e) => setGradingMethod(e.target.value)}
                className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="HIGHEST">Nilai Tertinggi (Direkomendasikan)</option>
                <option value="LATEST">Nilai Percobaan Terakhir</option>
                <option value="AVERAGE">Rata-rata Seluruh Percobaan</option>
              </select>
            </div>

            {/* Result Visibility */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Publikasi Nilai ke Murid
              </label>
              <select
                value={resultVisibility}
                onChange={(e) => setResultVisibility(e.target.value)}
                className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="MANUAL">Manual (Guru klik tombol publikasi)</option>
                <option value="IMMEDIATE">Langsung (Tampil seketika setelah selesai)</option>
                <option value="HIDDEN">Disembunyikan (Hanya guru & admin)</option>
              </select>
            </div>

            {/* Navigation Mode */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Mode Navigasi Soal
              </label>
              <select
                value={navigationMode}
                onChange={(e) => setNavigationMode(e.target.value)}
                className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="FREE">Bebas (Murid dapat berpindah ke nomor mana saja)</option>
                <option value="SEQUENTIAL">Berurutan (Harus urut nomor)</option>
              </select>
            </div>

            {/* Toggles */}
            <div className="sm:col-span-2 space-y-4 pt-2 border-t border-border">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={shuffleQuestions}
                  onChange={(e) => setShuffleQuestions(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <div>
                  <span className="text-sm font-semibold text-foreground block">Acak Urutan Soal</span>
                  <span className="text-xs text-muted-foreground">Urutan soal akan diacak secara berbeda untuk setiap percobaan murid</span>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={shuffleOptions}
                  onChange={(e) => setShuffleOptions(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <div>
                  <span className="text-sm font-semibold text-foreground block">Acak Pilihan Jawaban</span>
                  <span className="text-xs text-muted-foreground">Urutan pilihan A, B, C, D akan diacak untuk setiap murid</span>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showAnswerKey}
                  onChange={(e) => setShowAnswerKey(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <div>
                  <span className="text-sm font-semibold text-foreground block">Tampilkan Kunci Jawaban & Pembahasan</span>
                  <span className="text-xs text-muted-foreground">Ditampilkan setelah murid kehabisan kuota atau jadwal ujian berakhir</span>
                </div>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-border">
            <Button variant="outline" onClick={() => setCurrentStep(2)} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Kembali</span>
            </Button>
            <Button onClick={() => setCurrentStep(4)} className="font-bold gap-2">
              <span>Lanjut ke Pratinjau</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* TAHAP 4: Pratinjau dan Publikasi */}
      {currentStep === 4 && (
        <Card className="shadow-sm border-border p-6 space-y-6">
          <div className="border-b border-border pb-3">
            <CardTitle className="text-lg font-bold">Tahap 4 — Pratinjau & Validasi Ujian</CardTitle>
            <CardDescription>Periksa kembali seluruh konfigurasi sebelum menerbitkan ujian</CardDescription>
          </div>

          {/* Summary Box */}
          <div className="rounded-xl bg-slate-50 dark:bg-slate-900 p-5 border border-border space-y-4">
            <h3 className="text-base font-bold text-foreground">{title || "(Judul Ujian Belum Diisi)"}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-muted-foreground block">Mata Pelajaran:</span>
                <span className="font-bold text-foreground">
                  {subjects.find((s) => s.id === subjectId)?.name || "-"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block">Durasi:</span>
                <span className="font-bold text-foreground">{durationMinutes} Menit</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Total Soal:</span>
                <span className="font-bold text-foreground">{questions.length} Butir ({totalExamPoints} Poin)</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Maks. Percobaan:</span>
                <span className="font-bold text-foreground">{maxAttempts}x ({gradingMethod})</span>
              </div>
            </div>
          </div>

          {/* Validation Checklist */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Pemeriksaan Kelayakan Ujian:</h4>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-2 text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
                <span>Seluruh {questions.length} butir soal telah memiliki bobot poin valid.</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
                <span>Kelas peserta telah ditentukan ({selectedClassIds.length} kelas terpilih).</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
                <span>Sistem siap menghasilkan 8-digit kode ujian unik otomatis saat Anda menekan tombol terbitkan.</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-6 border-t border-border">
            <Button variant="outline" onClick={() => setCurrentStep(3)} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Kembali</span>
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                isLoading={isSaving}
                onClick={() => handleSaveExam(false)}
              >
                Simpan Sebagai Draft
              </Button>
              <Button
                onClick={() => handleSaveExam(true)}
                isLoading={isSaving}
                className="font-bold gap-2 bg-emerald-600 hover:bg-emerald-700 shadow"
              >
                <Sparkles className="h-4 w-4" />
                <span>Terbitkan Ujian Sekarang</span>
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Modal: Import Word / Excel */}
      <Dialog open={showImportModal} onOpenChange={setShowImportModal}>
        <DialogHeader>
          <DialogTitle>Import Soal dari Word (.docx) atau Excel (.xlsx)</DialogTitle>
          <DialogDescription>
            Unggah file soal menggunakan template standar ExamCode School.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-2">
          {/* Download Templates Banner */}
          <div className="rounded-xl bg-blue-50 dark:bg-blue-950/40 p-4 border border-blue-100 dark:border-blue-900 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-blue-900 dark:text-blue-200">Belum memiliki format file?</p>
              <p className="text-[11px] text-blue-700 dark:text-blue-400">Unduh template acuan resmi di sini:</p>
            </div>
            <div className="flex gap-2">
              <a href="/templates/template_soal_examcode.docx" download>
                <Button variant="outline" size="sm" className="text-xs gap-1 h-8">
                  <Download className="h-3.5 w-3.5" />
                  <span>Word (.docx)</span>
                </Button>
              </a>
              <a href="/templates/template_soal_examcode.xlsx" download>
                <Button variant="outline" size="sm" className="text-xs gap-1 h-8">
                  <Download className="h-3.5 w-3.5" />
                  <span>Excel (.xlsx)</span>
                </Button>
              </a>
            </div>
          </div>

          {/* File Input */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Pilih File Dokumen
            </label>
            <input
              type="file"
              accept=".docx,.xlsx,.xls"
              onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
            />
          </div>

          {importFile && previewParsedQuestions.length === 0 && (
            <Button
              onClick={handleFileParse}
              isLoading={isImporting}
              className="w-full text-xs font-bold"
            >
              Periksa & Baca Isi Dokumen
            </Button>
          )}

          {/* Parsed Preview Table */}
          {previewParsedQuestions.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-foreground">
                  Hasil Baca: {previewParsedQuestions.filter((q) => q.isValid).length} Soal Valid
                </span>
                {previewParsedQuestions.some((q) => !q.isValid) && (
                  <span className="text-destructive font-semibold">
                    {previewParsedQuestions.filter((q) => !q.isValid).length} Bermasalah
                  </span>
                )}
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {previewParsedQuestions.map((q, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "p-3 rounded-lg border text-xs space-y-1",
                      q.isValid
                        ? "border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20"
                        : "border-red-500 bg-red-50/30 dark:bg-red-950/20"
                    )}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span>Soal #{idx + 1} ({q.type})</span>
                      <span>{q.isValid ? "✓ Valid" : "✗ Error"}</span>
                    </div>
                    <p className="line-clamp-2 text-foreground">{q.questionText}</p>
                    {q.errors?.length > 0 && (
                      <p className="text-destructive font-medium">{q.errors.join(", ")}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setShowImportModal(false)}>
            Batal
          </Button>
          {previewParsedQuestions.length > 0 && (
            <Button onClick={handleApplyImportedQuestions} className="font-bold bg-emerald-600 hover:bg-emerald-700">
              Tambahkan ke Lembar Soal
            </Button>
          )}
        </DialogFooter>
      </Dialog>

      {/* Modal: Exam Published Successfully (FR-012) */}
      <Dialog open={Boolean(publishedResult)} onOpenChange={() => {}}>
        <DialogHeader>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 mb-3 mx-auto shadow">
            <Sparkles className="h-7 w-7" />
          </div>
          <DialogTitle className="text-center text-2xl font-bold">
            Ujian Berhasil Diterbitkan!
          </DialogTitle>
          <DialogDescription className="text-center text-xs">
            Kode ujian otomatis telah dibuat. Bagikan kode ini kepada murid peserta ujian.
          </DialogDescription>
        </DialogHeader>

        <div className="my-5 rounded-2xl bg-gradient-to-b from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-900/60 p-6 border border-blue-200 dark:border-blue-900 text-center shadow-inner">
          <span className="text-xs font-bold uppercase tracking-widest text-primary block mb-1">
            KODE AKSES UJIAN
          </span>
          <span className="font-mono font-black text-4xl sm:text-5xl text-foreground tracking-widest block select-all">
            {publishedResult?.examCode}
          </span>
          <div className="mt-4 flex items-center justify-center gap-2">
            <Button
              size="sm"
              onClick={() => copyCode(publishedResult?.examCode)}
              className="font-semibold gap-1.5"
            >
              <Copy className="h-4 w-4" />
              <span>Salin Kode Ujian</span>
            </Button>
          </div>
        </div>

        <DialogFooter className="sm:justify-center">
          <Button
            size="lg"
            onClick={() => router.push("/teacher/exams")}
            className="w-full font-bold"
          >
            Lihat Daftar Ujian
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Modal: Quick Add / Manage Custom Subjects */}
      <Dialog open={showQuickSubjectModal} onOpenChange={setShowQuickSubjectModal}>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle>Kelola & Tambah Mata Pelajaran</DialogTitle>
              <DialogDescription className="text-xs">
                Tambah mata pelajaran kustom baru atau edit & hapus mata pelajaran yang sudah ada.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Tab Switcher */}
        <div className="flex border-b border-border mb-3">
          <button
            type="button"
            onClick={() => setQuickSubjectTab("CREATE")}
            className={cn(
              "px-4 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer",
              quickSubjectTab === "CREATE"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            + Tambah Mapel Baru
          </button>
          <button
            type="button"
            onClick={() => setQuickSubjectTab("MANAGE")}
            className={cn(
              "px-4 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer",
              quickSubjectTab === "MANAGE"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            Daftar & Edit / Hapus ({subjects.length})
          </button>
        </div>

        {quickSubjectTab === "CREATE" ? (
          <form onSubmit={handleQuickCreateSubject} className="space-y-4 my-2 text-xs">
            <div>
              <label className="block font-semibold uppercase text-muted-foreground mb-1">
                Nama Mata Pelajaran <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="Contoh: Coding & Robotika, Life Skills, Bahasa Inggris..."
                value={quickSubjectName}
                onChange={(e) => {
                  setQuickSubjectName(e.target.value);
                  if (!quickSubjectCode) {
                    const words = e.target.value.trim().split(/\s+/);
                    if (words.length >= 2) {
                      setQuickSubjectCode(words.map((w) => w[0]).join("").toUpperCase().slice(0, 5));
                    } else {
                      setQuickSubjectCode(e.target.value.trim().slice(0, 3).toUpperCase());
                    }
                  }
                }}
                required
                className="h-10 text-xs"
                autoFocus
              />
            </div>

            <div>
              <label className="block font-semibold uppercase text-muted-foreground mb-1">
                Kode Singkatan Mapel
              </label>
              <Input
                placeholder="Contoh: COD, LS, BING..."
                value={quickSubjectCode}
                onChange={(e) => setQuickSubjectCode(e.target.value.toUpperCase())}
                maxLength={10}
                className="h-10 text-xs font-mono uppercase"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Singkatan kode mapel untuk identifikasi (maks. 10 karakter)
              </p>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowQuickSubjectModal(false)}>
                Tutup
              </Button>
              <Button type="submit" isLoading={isQuickSubjectSubmitting} className="font-bold">
                Simpan & Pilih Mapel
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-3 my-2 text-xs">
            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {subjects.length === 0 ? (
                <p className="text-center text-muted-foreground py-6">Belum ada mata pelajaran.</p>
              ) : (
                subjects.map((sub) => {
                  const isEditingThis = inlineEditSubjectId === sub.id;
                  return (
                    <div
                      key={sub.id}
                      className={cn(
                        "p-3 rounded-xl border transition-all flex items-center justify-between gap-2",
                        subjectId === sub.id ? "bg-primary/5 border-primary/40" : "bg-card border-border"
                      )}
                    >
                      {isEditingThis ? (
                        <div className="flex-1 flex flex-col sm:flex-row items-center gap-2">
                          <Input
                            value={inlineEditName}
                            onChange={(e) => setInlineEditName(e.target.value)}
                            placeholder="Nama mapel"
                            className="h-8 text-xs flex-1"
                            autoFocus
                          />
                          <Input
                            value={inlineEditCode}
                            onChange={(e) => setInlineEditCode(e.target.value.toUpperCase())}
                            placeholder="Kode"
                            maxLength={10}
                            className="h-8 text-xs font-mono uppercase w-20"
                          />
                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              type="button"
                              size="sm"
                              isLoading={isInlineUpdating}
                              onClick={() => handleQuickUpdateSubject(sub.id)}
                              className="h-8 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setInlineEditSubjectId(null)}
                              className="h-8 px-2.5"
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-foreground">{sub.name}</span>
                              <Badge variant="outline" className="text-[10px] font-mono">
                                {sub.code}
                              </Badge>
                              {subjectId === sub.id && (
                                <Badge className="text-[10px] bg-primary text-primary-foreground">
                                  Terpilih
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              title="Edit Mata Pelajaran"
                              onClick={() => {
                                setInlineEditSubjectId(sub.id);
                                setInlineEditName(sub.name);
                                setInlineEditCode(sub.code);
                              }}
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              title="Hapus Mata Pelajaran"
                              onClick={() => handleQuickDeleteSubject(sub.id, sub.name)}
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowQuickSubjectModal(false)}>
                Selesai
              </Button>
            </DialogFooter>
          </div>
        )}
      </Dialog>

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
                Ketik atau tempelkan teks soal dari Word, WA, atau dokumen Anda. Format soal dan kunci jawaban akan dikenali otomatis.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 my-3 text-xs">
          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-muted/50 border border-border">
            <span className="font-semibold text-muted-foreground">Format Teks Cepat:</span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setRawQuestionText(sampleTextFormat);
                  const res = parseQuestionsFromRawText(sampleTextFormat);
                  setParsedTextResult(res);
                  toast.info("Contoh format teks dimasukkan.");
                }}
                className="h-7 text-xs font-semibold gap-1 text-primary hover:text-primary"
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Isi Contoh Format Teks</span>
              </Button>
              {rawQuestionText && (
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
              )}
            </div>
          </div>

          {/* Text Area Input */}
          <div>
            <label className="block font-semibold uppercase text-muted-foreground mb-1.5">
              Teks Soal Ujian <span className="text-destructive">*</span>
            </label>
            <Textarea
              placeholder={`Ketik atau tempelkan teks soal di sini, contoh:
1. Berapakah hasil dari 25 + 15?
A. 30
B. 35
C. 40
D. 45
Kunci: C
Bobot: 10

2. Ibukota Indonesia adalah Nusantara.
A. Benar
B. Salah
Kunci: A

3. Jelaskan proses fotosintesis pada tumbuhan!
Bobot: 20`}
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
              rows={10}
              className="font-mono text-xs leading-relaxed"
            />
          </div>

          {/* Real-time Parse Results & Preview */}
          {parsedTextResult && (
            <div className="space-y-3 pt-2 border-t border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={parsedTextResult.validCount > 0 ? "default" : "destructive"}
                    className="text-xs font-bold"
                  >
                    {parsedTextResult.validCount > 0
                      ? `✅ ${parsedTextResult.validCount} Soal Berhasil Dikenali`
                      : "⚠️ Format Belum Sesuai"}
                  </Badge>
                  {parsedTextResult.errorCount > 0 && (
                    <Badge variant="outline" className="text-xs text-destructive border-destructive/30">
                      {parsedTextResult.errorCount} Perlu Dicek
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="textMode"
                      checked={textImportMode === "APPEND"}
                      onChange={() => setTextImportMode("APPEND")}
                      className="text-primary"
                    />
                    <span>Tambahkan ke Soal Ada</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="textMode"
                      checked={textImportMode === "REPLACE"}
                      onChange={() => setTextImportMode("REPLACE")}
                      className="text-primary"
                    />
                    <span>Gantikan Lembar Soal</span>
                  </label>
                </div>
              </div>

              {/* Preview List */}
              <div className="max-h-60 overflow-y-auto space-y-2.5 p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-border">
                {parsedTextResult.questions.map((q: any, qIdx: number) => (
                  <div
                    key={qIdx}
                    className="p-3 rounded-lg bg-background border border-border space-y-2 text-xs shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground">No. {qIdx + 1}</span>
                        <Badge variant="outline" className="text-[10px] font-bold">
                          {q.type === "MULTIPLE_CHOICE"
                            ? "Pilihan Ganda"
                            : q.type === "TRUE_FALSE"
                            ? "Benar / Salah"
                            : "Esai"}
                        </Badge>
                      </div>
                      <span className="text-[11px] font-bold text-primary">Bobot: {q.points} Poin</span>
                    </div>

                    <p className="font-medium text-foreground">{q.questionText}</p>

                    {q.options && q.options.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                        {q.options.map((opt: any, optIdx: number) => (
                          <div
                            key={optIdx}
                            className={cn(
                              "p-1.5 rounded border text-[11px]",
                              opt.isCorrect
                                ? "border-emerald-500 bg-emerald-50 text-emerald-800 font-bold dark:bg-emerald-950/40 dark:text-emerald-300"
                                : "border-border text-muted-foreground"
                            )}
                          >
                            {opt.key}. {opt.text} {opt.isCorrect && "✓ (Kunci)"}
                          </div>
                        ))}
                      </div>
                    )}

                    {q.explanation && (
                      <p className="text-[11px] text-muted-foreground pt-1 border-t border-border">
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
            disabled={!parsedTextResult || parsedTextResult.validCount === 0}
            onClick={handleApplyTextQuestions}
            className="font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-white gap-2"
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
