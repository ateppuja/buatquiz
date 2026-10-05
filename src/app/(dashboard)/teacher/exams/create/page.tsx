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
  Image as ImageIcon,
} from "lucide-react";
import { formatDateTimeLocal, parseDateInput, cn, compressAndReadFileAsDataUrl } from "@/lib/utils";
import { parseQuestionsFromRawText, beautifyQuestionText } from "@/lib/text-parser";
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
  const [pointWeightMode, setPointWeightMode] = useState<"AUTO_100" | "CUSTOM">("AUTO_100");
  const [questions, setQuestions] = useState<any[]>([
    {
      id: "temp-1",
      type: "MULTIPLE_CHOICE",
      questionText: "",
      points: 100,
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

  const sampleTextFormat = samplePresets.MIXED.text;

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
      nextQuestions[qIdx].points = Math.max(0.1, newPoints || 0);
      setParsedTextResult({
        ...parsedTextResult,
        questions: nextQuestions,
      });
    }
  };

  const handleDistributePreviewPoints = () => {
    if (!parsedTextResult?.questions || parsedTextResult.questions.length === 0) return;
    const count = parsedTextResult.questions.length;
    const perQ = Number((100 / count).toFixed(2));
    const nextQuestions = parsedTextResult.questions.map((q: any) => ({ ...q, points: perQ }));
    setParsedTextResult({
      ...parsedTextResult,
      questions: nextQuestions,
    });
    toast.success(`Bobot pratinjau diratakan: ${count} soal @ ${perQ} poin.`);
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
        points: q.points || 1,
        explanation: q.explanation || "",
        options: q.options || [],
      }));

    let targetQuestions: any[] = [];
    if (textImportMode === "REPLACE") {
      targetQuestions = converted;
    } else {
      if (
        questions.length === 1 &&
        !questions[0].questionText.trim() &&
        (!questions[0].options || questions[0].options.every((o: any) => !o.text.trim()))
      ) {
        targetQuestions = converted;
      } else {
        targetQuestions = [...questions, ...converted];
      }
    }

    const hasExplicitPoints = converted.some((q: any) => q.points && q.points !== 1);
    if (!hasExplicitPoints && pointWeightMode === "AUTO_100" && targetQuestions.length > 0) {
      const perQ = Number((100 / targetQuestions.length).toFixed(2));
      targetQuestions = targetQuestions.map((q) => ({ ...q, points: perQ }));
    } else if (hasExplicitPoints) {
      setPointWeightMode("CUSTOM");
    }

    setQuestions(targetQuestions);
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
  const handleDistributeEvenly100 = () => {
    if (questions.length === 0) return;
    const count = questions.length;
    const perQ = Number((100 / count).toFixed(2));
    const updated = questions.map((q) => ({ ...q, points: perQ }));
    setQuestions(updated);
    setPointWeightMode("AUTO_100");
    toast.success(`Bobot berhasil diratakan: ${count} soal @ ${perQ} poin (Total 100 Poin).`);
  };

  const handleSetPointMode = (mode: "AUTO_100" | "CUSTOM") => {
    setPointWeightMode(mode);
    if (mode === "AUTO_100") {
      handleDistributeEvenly100();
    } else {
      toast.info("Mode Kustom aktif: Anda bebas mengatur bobot poin per butir soal.");
    }
  };

  const addQuestion = (type: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "ESSAY" = "MULTIPLE_CHOICE", insertAfterIndex?: number) => {
    const newCount = questions.length + 1;
    const initialPoints = pointWeightMode === "AUTO_100" ? Number((100 / newCount).toFixed(2)) : 1;

    const newQ: any = {
      id: `temp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type,
      questionText: "",
      points: initialPoints,
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

    let nextQuestions = [...questions];
    if (typeof insertAfterIndex === "number" && insertAfterIndex >= 0 && insertAfterIndex < questions.length) {
      nextQuestions.splice(insertAfterIndex + 1, 0, newQ);
    } else {
      nextQuestions.push(newQ);
    }

    if (pointWeightMode === "AUTO_100") {
      const perQ = Number((100 / newCount).toFixed(2));
      nextQuestions = nextQuestions.map((q) => ({ ...q, points: perQ }));
    }

    setQuestions(nextQuestions);
    toast.success(
      typeof insertAfterIndex === "number"
        ? `Soal baru disisipkan di bawah soal #${insertAfterIndex + 1}${pointWeightMode === "AUTO_100" ? ` (Bobot disesuaikan @${Number((100 / newCount).toFixed(2))} poin)` : ""}.`
        : `Soal baru berhasil ditambahkan${pointWeightMode === "AUTO_100" ? ` (Bobot disesuaikan @${Number((100 / newCount).toFixed(2))} poin)` : ""}.`
    );
  };

  const removeQuestion = (index: number) => {
    if (questions.length === 1) {
      toast.error("Ujian minimal harus memiliki 1 butir soal.");
      return;
    }
    const nextQuestions = questions.filter((_, idx) => idx !== index);
    const newCount = nextQuestions.length;
    if (pointWeightMode === "AUTO_100" && newCount > 0) {
      const perQ = Number((100 / newCount).toFixed(2));
      setQuestions(nextQuestions.map((q) => ({ ...q, points: perQ })));
    } else {
      setQuestions(nextQuestions);
    }
  };

  const updateQuestionField = (index: number, field: string, val: any) => {
    const updated = [...questions];
    updated[index][field] = val;
    if (field === "points") {
      setPointWeightMode("CUSTOM");
    }
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

  const totalExamPoints = Math.round(questions.reduce((acc, q) => acc + (parseFloat(q.points) || 0), 0) * 100) / 100;

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
        <div className="space-y-4">
          {/* Top Actions: Add Question & Import Document Buttons */}
          <Card className="shadow-sm border-border p-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-foreground">
                  Total Soal: {questions.length} Butir
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

          {/* Point Weight Toolbar */}
          <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Mode Bobot Nilai:</span>
              <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => handleSetPointMode("AUTO_100")}
                  className={cn(
                    "px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer",
                    pointWeightMode === "AUTO_100"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-foreground"
                  )}
                >
                  ⚡ Otomatis (Total 100 Poin)
                </button>
                <button
                  type="button"
                  onClick={() => handleSetPointMode("CUSTOM")}
                  className={cn(
                    "px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer",
                    pointWeightMode === "CUSTOM"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-foreground"
                  )}
                >
                  ✏️ Kustom / Manual
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
                <span className="text-muted-foreground font-medium">Total Bobot:</span>
                <span className={cn("font-black", Math.abs(totalExamPoints - 100) < 0.1 ? "text-emerald-600 font-bold" : "text-amber-600 font-bold")}>
                  {totalExamPoints} Poin
                </span>
                {Math.abs(totalExamPoints - 100) < 0.1 ? (
                  <Badge variant="success" className="text-[10px] py-0 px-1.5 ml-1">
                    ✓ Pas 100
                  </Badge>
                ) : (
                  <button
                    type="button"
                    onClick={handleDistributeEvenly100}
                    className="ml-1 text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
                  >
                    [⚡ Jadikan 100 Poin]
                  </button>
                )}
              </div>

              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleDistributeEvenly100}
                className="h-8 text-xs font-bold gap-1.5 border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300"
                title="Bagi rata seluruh poin butir soal agar bernilai tepat 100 poin"
              >
                <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                <span>Bagi Rata 100 Poin</span>
              </Button>
            </div>
          </div>

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
                        min={0.1}
                        step="any"
                        value={q.points}
                        onChange={(e) =>
                          updateQuestionField(qIdx, "points", parseFloat(e.target.value) || 0)
                        }
                        className="w-16 h-8 text-xs font-bold text-center bg-white dark:bg-slate-900"
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
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Teks Pertanyaan <span className="text-destructive">*</span>
                    </label>

                    {!q.questionImage && (
                      <label className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 text-[11px] font-bold text-primary hover:text-primary/80 cursor-pointer transition-colors shadow-2xs">
                        <ImageIcon className="h-3.5 w-3.5" />
                        <span>+ Tambah Gambar / Diagram</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              try {
                                const dataUrl = await compressAndReadFileAsDataUrl(file);
                                updateQuestionField(qIdx, "questionImage", dataUrl);
                                toast.success("Gambar berhasil disisipkan ke soal.");
                              } catch {
                                toast.error("Gagal memuat file gambar.");
                              }
                            }
                          }}
                        />
                      </label>
                    )}
                  </div>
                  <Textarea
                    placeholder="Tuliskan pertanyaan soal di sini..."
                    value={q.questionText}
                    onChange={(e) => updateQuestionField(qIdx, "questionText", e.target.value)}
                    rows={3}
                    className="text-sm font-medium leading-relaxed"
                  />
                </div>

                {/* Attached Question Image Preview */}
                {q.questionImage && (
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <ImageIcon className="h-4 w-4 text-primary" />
                        <span>Gambar / Ilustrasi Soal:</span>
                      </span>
                      <div className="flex items-center gap-1.5">
                        <label className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer transition-colors shadow-2xs flex items-center gap-1">
                          <Upload className="h-3.5 w-3.5" />
                          <span>Ganti Gambar</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                try {
                                  const dataUrl = await compressAndReadFileAsDataUrl(file);
                                  updateQuestionField(qIdx, "questionImage", dataUrl);
                                  toast.success("Gambar soal berhasil diganti.");
                                } catch {
                                  toast.error("Gagal memuat gambar.");
                                }
                              }
                            }}
                          />
                        </label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            updateQuestionField(qIdx, "questionImage", null);
                            toast.info("Gambar soal dihapus.");
                          }}
                          className="h-7 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 gap-1 px-2"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Hapus</span>
                        </Button>
                      </div>
                    </div>
                    <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-white dark:bg-slate-950 flex justify-center max-h-64 p-1.5">
                      <img
                        src={q.questionImage}
                        alt={`Gambar Soal #${qIdx + 1}`}
                        className="max-h-60 w-auto object-contain rounded-lg"
                      />
                    </div>
                  </div>
                )}

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

                {/* Per-Question Insertion Footer */}
                <div className="flex flex-wrap items-center justify-between pt-2.5 border-t border-slate-100 dark:border-slate-800 gap-2">
                  <span className="text-[11px] font-medium text-muted-foreground">Soal nomor #{qIdx + 1}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-muted-foreground mr-1 hidden sm:inline">Tambah soal di bawah ini:</span>
                    <button
                      type="button"
                      onClick={() => addQuestion("MULTIPLE_CHOICE", qIdx)}
                      className="px-2 py-1 rounded-lg border border-slate-200 bg-white hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 text-slate-600 font-semibold text-[11px] transition-colors cursor-pointer"
                      title="Sisipkan Pilihan Ganda tepat di bawah soal ini"
                    >
                      + PG
                    </button>
                    <button
                      type="button"
                      onClick={() => addQuestion("TRUE_FALSE", qIdx)}
                      className="px-2 py-1 rounded-lg border border-slate-200 bg-white hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 text-slate-600 font-semibold text-[11px] transition-colors cursor-pointer"
                      title="Sisipkan Benar/Salah tepat di bawah soal ini"
                    >
                      + Benar/Salah
                    </button>
                    <button
                      type="button"
                      onClick={() => addQuestion("ESSAY", qIdx)}
                      className="px-2 py-1 rounded-lg border border-slate-200 bg-white hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 text-slate-600 font-semibold text-[11px] transition-colors cursor-pointer"
                      title="Sisipkan Esai tepat di bawah soal ini"
                    >
                      + Esai
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Button: + Tambahkan soal (Tepat di bawah seluruh soal) */}
          <div className="w-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 hover:border-primary/60 dark:hover:border-primary/60 rounded-2xl p-4 shadow-xs transition-all">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => addQuestion("MULTIPLE_CHOICE")}
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
                  onClick={() => addQuestion("MULTIPLE_CHOICE")}
                  className="h-8 text-xs font-semibold gap-1 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300"
                >
                  <Plus className="h-3 w-3" />
                  <span>Pilihan Ganda</span>
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => addQuestion("TRUE_FALSE")}
                  className="h-8 text-xs font-semibold gap-1 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300"
                >
                  <Plus className="h-3 w-3" />
                  <span>Benar / Salah</span>
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => addQuestion("ESSAY")}
                  className="h-8 text-xs font-semibold gap-1 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300"
                >
                  <Plus className="h-3 w-3" />
                  <span>Esai</span>
                </Button>
              </div>
            </div>
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
                <div className="flex flex-wrap items-center gap-2">
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
                  <button
                    type="button"
                    onClick={handleDistributePreviewPoints}
                    className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 cursor-pointer"
                    title="Bagi rata poin butir soal pratinjau agar total bernilai 100 poin"
                  >
                    ⚡ Bagi Rata 100 Poin
                  </button>
                </div>

                <div className="flex items-center gap-3 text-xs font-medium">
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

                    {q.questionImage && (
                      <div className="my-2 max-w-sm rounded-lg overflow-hidden border border-border/80 bg-muted/20">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={q.questionImage}
                          alt={`Gambar Soal #${qIdx + 1}`}
                          className="max-h-48 w-auto object-contain rounded-md"
                        />
                      </div>
                    )}

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
            disabled={!parsedTextResult || parsedTextResult.validCount === 0}
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
