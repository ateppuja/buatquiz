"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Printer,
  ArrowLeft,
  CheckCircle2,
  FileText,
  KeyRound,
  Settings,
  Edit,
  Eye,
  Layers,
  Clock,
  Calendar,
  Sparkles,
  BookOpen,
  Columns,
  Maximize2,
  Minimize2,
  SlidersHorizontal,
} from "lucide-react";
import { formatDate, cn } from "@/lib/utils";
import { MathRenderer } from "@/components/ui/math-renderer";
import { toast } from "sonner";

export default function PrintExamPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const examId = params?.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [exam, setExam] = useState<any>(null);

  // Print configuration options
  const [printMode, setPrintMode] = useState<"STUDENT" | "TEACHER_KEY">("STUDENT");
  const [columns, setColumns] = useState<1 | 2>(2); // Default to 2 columns for paper saving
  const [fontSize, setFontSize] = useState<"sm" | "base" | "lg">("sm"); // Default to small for compact exam paper
  const [showInstructions, setShowInstructions] = useState(true);
  const [showStudentIdentityBox, setShowStudentIdentityBox] = useState(true);
  const [showPoints, setShowPoints] = useState(true);
  const [showExplanations, setShowExplanations] = useState(true);
  const [showSignatures, setShowSignatures] = useState(true);
  const [showColumnDivider, setShowColumnDivider] = useState(true);
  const [pageOrientation, setPageOrientation] = useState<"portrait" | "landscape">("portrait");
  const [pageMargin, setPageMargin] = useState<"compact" | "normal">("compact");

  useEffect(() => {
    const mode = searchParams.get("mode");
    if (mode === "key" || mode === "teacher") {
      setPrintMode("TEACHER_KEY");
    }
  }, [searchParams]);

  const loadExamDetail = async () => {
    try {
      const res = await fetch(`/api/v1/teacher/exams/${examId}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.error?.message || "Ujian tidak ditemukan.");
        router.push("/teacher/exams");
        return;
      }
      setExam(data.data);
    } catch {
      toast.error("Gagal memuat detail ujian untuk dicetak.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (examId) loadExamDetail();
  }, [examId]);

  const handleTriggerPrint = () => {
    window.print();
  };

  if (isLoading || !exam) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#7AB82A] border-t-transparent" />
        <p className="text-xs font-bold text-slate-500">Menyiapkan format naskah ujian cetak...</p>
      </div>
    );
  }

  const mcqQuestions = (exam.questions || []).filter((q: any) => q.type === "MULTIPLE_CHOICE");
  const tfQuestions = (exam.questions || []).filter((q: any) => q.type === "TRUE_FALSE");
  const essayQuestions = (exam.questions || []).filter((q: any) => q.type === "ESSAY");
  const totalPoints = (exam.questions || []).reduce((acc: number, q: any) => acc + (parseFloat(q.points) || 0), 0);
  const schoolName = exam.school?.name || "WhiteBee School of Life";

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-3 sm:px-6 print:bg-white print:p-0">
      {/* 🎛️ FLOATING CONTROL TOOLBAR (Hidden when printing) */}
      <div className="max-w-4xl mx-auto mb-6 bg-white border-2 border-[#D8EEB6] rounded-2xl p-4 shadow-md no-print space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.push("/teacher/exams")}
              className="text-xs font-bold text-slate-600 hover:text-[#4B7914] flex items-center gap-1 cursor-pointer transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Daftar Ujian</span>
            </button>
            <span className="text-slate-300">•</span>
            <Badge variant="outline" className="text-xs font-bold text-[#4B7914] bg-[#F4FBEB] border-[#D5EFA9]">
              {exam.subject?.name}
            </Badge>
            <span className="text-xs font-bold text-slate-500">
              {exam.questions?.length || 0} Soal ({totalPoints} Poin)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link href={`/teacher/exams/${examId}/edit`}>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs font-bold border-slate-300">
                <Edit className="h-3.5 w-3.5" />
                <span>Edit Soal</span>
              </Button>
            </Link>

            <Button
              onClick={handleTriggerPrint}
              className="gap-2 text-xs font-black bg-[#7AB82A] hover:bg-[#689f22] text-white shadow-md px-5 h-9 rounded-xl cursor-pointer"
            >
              <Printer className="h-4 w-4 stroke-[2.5]" />
              <span>Cetak / Simpan PDF</span>
            </Button>
          </div>
        </div>

        {/* Print Configuration Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* 1. Mode Naskah */}
          <div className="space-y-1.5">
            <label className="block font-black text-slate-700 uppercase tracking-wider text-[11px]">
              Jenis Naskah Cetak:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPrintMode("STUDENT")}
                className={cn(
                  "flex items-center justify-center gap-1.5 p-2 rounded-xl border text-xs font-black transition-all cursor-pointer",
                  printMode === "STUDENT"
                    ? "bg-[#7AB82A] text-white border-[#7AB82A] shadow-xs ring-2 ring-[#D5EFA9]"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                )}
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Soal Siswa</span>
              </button>

              <button
                type="button"
                onClick={() => setPrintMode("TEACHER_KEY")}
                className={cn(
                  "flex items-center justify-center gap-1.5 p-2 rounded-xl border text-xs font-black transition-all cursor-pointer",
                  printMode === "TEACHER_KEY"
                    ? "bg-amber-600 text-white border-amber-600 shadow-xs ring-2 ring-amber-200"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                )}
              >
                <KeyRound className="h-3.5 w-3.5" />
                <span>Kunci Guru</span>
              </button>
            </div>
          </div>

          {/* 2. Format Kolom (1 Kolom vs 2 Kolom Hemat Kertas) */}
          <div className="space-y-1.5">
            <label className="block font-black text-slate-700 uppercase tracking-wider text-[11px] flex items-center justify-between">
              <span>Format Kolom Naskah:</span>
              <span className="text-[#4B7914] font-black text-[10px]">
                {columns === 2 ? "⚡ 2 Kolom (Hemat)" : "Standar (1 Kolom)"}
              </span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setColumns(1)}
                className={cn(
                  "flex items-center justify-center gap-1.5 p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer",
                  columns === 1
                    ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                )}
              >
                <Columns className="h-3.5 w-3.5" />
                <span>1 Kolom</span>
              </button>

              <button
                type="button"
                onClick={() => setColumns(2)}
                className={cn(
                  "flex items-center justify-center gap-1.5 p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer",
                  columns === 2
                    ? "bg-[#7AB82A] text-white border-[#7AB82A] shadow-xs ring-2 ring-[#D5EFA9]"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                )}
              >
                <Columns className="h-3.5 w-3.5" />
                <span>2 Kolom (Hemat)</span>
              </button>
            </div>
          </div>

          {/* 3. Ukuran Huruf */}
          <div className="space-y-1.5">
            <label className="block font-black text-slate-700 uppercase tracking-wider text-[11px]">
              Ukuran Font:
            </label>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              {[
                { key: "sm", label: "Kecil (Hemat)" },
                { key: "base", label: "Standar" },
                { key: "lg", label: "Besar" },
              ].map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setFontSize(s.key as any)}
                  className={cn(
                    "flex-1 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer text-center",
                    fontSize === s.key ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Checkbox Options & Toggle Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-[11px] font-semibold text-slate-600">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            {columns === 2 && (
              <label className="flex items-center gap-1.5 cursor-pointer text-[#4B7914] font-bold">
                <input
                  type="checkbox"
                  checked={showColumnDivider}
                  onChange={(e) => setShowColumnDivider(e.target.checked)}
                  className="rounded border-slate-300 text-[#7AB82A] focus:ring-[#7AB82A]"
                />
                <span>Garis Tengah Kolom</span>
              </label>
            )}

            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={pageMargin === "compact"}
                onChange={(e) => setPageMargin(e.target.checked ? "compact" : "normal")}
                className="rounded border-slate-300 text-[#7AB82A] focus:ring-[#7AB82A]"
              />
              <span>Margin Rapat (Hemat Kertas)</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={showPoints}
                onChange={(e) => setShowPoints(e.target.checked)}
                className="rounded border-slate-300 text-[#7AB82A] focus:ring-[#7AB82A]"
              />
              <span>Bobot Poin</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={showInstructions}
                onChange={(e) => setShowInstructions(e.target.checked)}
                className="rounded border-slate-300 text-[#7AB82A] focus:ring-[#7AB82A]"
              />
              <span>Petunjuk</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={showSignatures}
                onChange={(e) => setShowSignatures(e.target.checked)}
                className="rounded border-slate-300 text-[#7AB82A] focus:ring-[#7AB82A]"
              />
              <span>Kolom Tanda Tangan</span>
            </label>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Orientasi:</span>
            <button
              type="button"
              onClick={() => setPageOrientation("portrait")}
              className={cn(
                "px-2 py-0.5 rounded-md font-bold text-[10px] cursor-pointer transition-colors",
                pageOrientation === "portrait" ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              Potret
            </button>
            <button
              type="button"
              onClick={() => setPageOrientation("landscape")}
              className={cn(
                "px-2 py-0.5 rounded-md font-bold text-[10px] cursor-pointer transition-colors",
                pageOrientation === "landscape" ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              Lanskap
            </button>
          </div>
        </div>
      </div>

      {/* 📄 PRINTABLE PAPER SHEET (A4 Standard Format) */}
      <div
        className={cn(
          "mx-auto bg-white text-black rounded-2xl shadow-xl print:shadow-none print:p-0 print:m-0 print:max-w-none print:w-full border print:border-none transition-all",
          pageOrientation === "landscape" ? "max-w-6xl" : "max-w-4xl",
          pageMargin === "compact"
            ? "p-6 sm:p-8 print:p-0"
            : "p-8 sm:p-12 print:p-0",
          fontSize === "sm" && "text-xs leading-normal",
          fontSize === "base" && "text-sm leading-relaxed",
          fontSize === "lg" && "text-base leading-relaxed"
        )}
        style={{ fontFamily: "'Times New Roman', Times, serif" }}
      >
        {/* KOP SURAT RESMI SEKOLAH */}
        <div className="text-center pb-3 border-b-4 border-black">
          <div className="border-b border-black pb-2 mb-1">
            <h2 className="text-base sm:text-lg font-bold uppercase tracking-widest text-slate-800">
              {schoolName}
            </h2>
            <h1 className="text-lg sm:text-xl font-black uppercase tracking-wider my-0.5 text-black">
              {printMode === "TEACHER_KEY" ? "LEMBAR KUNCI JAWABAN & PEMBAHASAN GURU" : "NASKAH SOAL UJIAN SEKOLAH"}
            </h1>
            <p className="text-xs font-semibold italic text-slate-700">
              Tahun Ajaran 2026/2027 • Sistem Evaluasi Terpadu
            </p>
          </div>
        </div>

        {/* METADATA UJIAN & KOTAK IDENTITAS SISWA */}
        <div className="my-3.5 border-2 border-black p-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-bold leading-normal">
          {/* Sisi Kiri: Informasi Ujian */}
          <div className="space-y-1">
            <div className="grid grid-cols-3">
              <span className="text-slate-700">Mata Pelajaran</span>
              <span className="col-span-2">: {exam.subject?.name || "-"}</span>
            </div>
            <div className="grid grid-cols-3">
              <span className="text-slate-700">Judul Ujian</span>
              <span className="col-span-2">: {exam.title}</span>
            </div>
            <div className="grid grid-cols-3">
              <span className="text-slate-700">Kelas Target</span>
              <span className="col-span-2">
                : {exam.examClasses?.map((ec: any) => ec.class.name).join(", ") || "Semua Kelas"}
              </span>
            </div>
            <div className="grid grid-cols-3">
              <span className="text-slate-700">Alokasi Waktu</span>
              <span className="col-span-2">: {exam.durationMinutes} Menit</span>
            </div>
            <div className="grid grid-cols-3">
              <span className="text-slate-700">Guru Pengampu</span>
              <span className="col-span-2">: {exam.teacher?.name || "-"}</span>
            </div>
          </div>

          {/* Sisi Kanan: Kolom Isian Siswa / Nilai */}
          {showStudentIdentityBox && (
            <div className="border border-black p-2 space-y-1 bg-slate-50/50 print:bg-transparent">
              {printMode === "STUDENT" ? (
                <>
                  <div className="grid grid-cols-3">
                    <span className="text-slate-700">Nama Siswa</span>
                    <span className="col-span-2 border-b border-dotted border-black pb-0.5">: ....................................................</span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="text-slate-700">Kelas / No. Absen</span>
                    <span className="col-span-2 border-b border-dotted border-black pb-0.5">: ....................................................</span>
                  </div>
                  <div className="grid grid-cols-3">
                    <span className="text-slate-700">Hari / Tanggal</span>
                    <span className="col-span-2 border-b border-dotted border-black pb-0.5">: ....................................................</span>
                  </div>
                  <div className="flex items-center justify-between pt-1 mt-1 border-t border-black">
                    <span className="text-slate-700">Paraf Pengawas: ............</span>
                    <div className="border border-black px-3 py-0.5 font-black text-center text-xs">
                      <span>NILAI:</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col justify-center items-center h-full text-center p-2 bg-amber-50 print:bg-slate-100 rounded border border-amber-300">
                  <span className="font-black text-amber-900 text-xs uppercase tracking-wider">
                    DOKUMEN PEGANGAN GURU
                  </span>
                  <span className="text-[10px] text-amber-800 font-semibold mt-0.5">
                    Kunci jawaban & panduan penskoran (Total: {totalPoints} Poin)
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* PETUNJUK UMUM PENGERJAAN */}
        {showInstructions && (
          <div className="mb-4 p-2.5 border border-dashed border-black text-xs space-y-1 bg-slate-50/40 print:bg-transparent">
            <p className="font-bold uppercase tracking-wider">PETUNJUK UMUM PENGERJAAN UJIAN:</p>
            <ol className="list-decimal list-inside space-y-0.5 font-normal text-slate-900">
              <li>Berdoalah sebelum mulai mengerjakan soal ujian.</li>
              <li>Tulislah nama dan kelas Anda secara lengkap pada kolom identitas yang telah disediakan.</li>
              <li>Bacalah setiap pertanyaan dengan teliti sebelum menentukan jawaban Anda.</li>
              <li>Untuk soal pilihan ganda, berilah tanda silang (X) atau bulatkan huruf pilihan A, B, C, atau D.</li>
              <li>Kerjakan terlebih dahulu soal-soal yang Anda anggap lebih mudah.</li>
              <li>Periksa kembali seluruh lembar jawaban Anda sebelum diserahkan kepada pengawas ujian.</li>
            </ol>
            {exam.instructions && (
              <p className="font-semibold text-slate-800 pt-1 border-t border-slate-200 mt-1">
                <strong>Instruksi Khusus Guru:</strong> {exam.instructions}
              </p>
            )}
          </div>
        )}

        {/* DAFTAR BUTIR SOAL */}
        <div
          className={cn(
            "space-y-4",
            columns === 2 && "print-columns-2"
          )}
          style={
            columns === 2
              ? {
                  columnCount: 2,
                  columnGap: pageOrientation === "landscape" ? "2.5rem" : "1.75rem",
                  columnRule: showColumnDivider ? "1px solid #000" : "none",
                }
              : undefined
          }
        >
          {/* SECTION 1: PILIHAN GANDA */}
          {mcqQuestions.length > 0 && (
            <div className="space-y-3 mb-4">
              <div
                className="font-black text-xs uppercase tracking-wider border-b-2 border-black pb-1 mb-2 column-span-all"
                style={{ columnSpan: "all" }}
              >
                I. PILIHAN GANDA (Berilah tanda silang (X) pada huruf A, B, C, atau D di depan jawaban yang paling benar!)
              </div>

              <div className="space-y-3">
                {mcqQuestions.map((q: any, idx: number) => {
                  const qNumber = idx + 1;
                  return (
                    <div key={q.id} className="break-inside-avoid space-y-1.5 pt-1">
                      {/* Question Prompt */}
                      <div className="flex items-start gap-1.5">
                        <span className="font-bold shrink-0">{qNumber}.</span>
                        <div className="flex-1 space-y-1.5">
                          <div className="font-normal text-justify whitespace-pre-line leading-snug">
                            <MathRenderer content={q.questionText} />
                          </div>

                          {q.questionImage && (
                            <div className="my-1.5 max-w-full">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={q.questionImage}
                                alt={`Gambar Soal ${qNumber}`}
                                className="max-h-48 max-w-full rounded border border-slate-300 object-contain print:border-black"
                              />
                            </div>
                          )}

                          {showPoints && (
                            <span className="text-[10px] font-bold text-slate-600 italic block">
                              [Skor: {q.points} Poin]
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Options Grid / List */}
                      <div className={cn(
                        "pl-4 grid gap-x-2 gap-y-1",
                        columns === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-2"
                      )}>
                        {q.options?.map((opt: any, oIdx: number) => {
                          const optKey = opt.optionKey || opt.key || String.fromCharCode(65 + oIdx);
                          const isCorrect = Boolean(opt.isCorrect);
                          return (
                            <div
                              key={oIdx}
                              className={cn(
                                "flex items-start gap-1 p-0.5 rounded transition-colors break-inside-avoid",
                                printMode === "TEACHER_KEY" && isCorrect
                                  ? "bg-emerald-100 font-bold text-emerald-950 border border-emerald-400 print:bg-slate-200 print:border-black"
                                  : "text-slate-900"
                              )}
                            >
                              <span className="font-bold shrink-0">
                                {printMode === "TEACHER_KEY" && isCorrect ? `[✓ ${optKey}]` : `(${optKey})`}
                              </span>
                              <span className="flex-1 leading-snug">
                                <MathRenderer content={opt.optionText || opt.text} />
                              </span>
                              {printMode === "TEACHER_KEY" && isCorrect && (
                                <span className="text-[9px] uppercase tracking-wider font-black text-emerald-800 print:text-black shrink-0">
                                  KUNCI
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Explanation (if Teacher Key mode) */}
                      {printMode === "TEACHER_KEY" && showExplanations && q.explanation && (
                        <div className="ml-4 p-1.5 rounded bg-amber-50 border border-amber-200 text-xs text-amber-900 print:bg-slate-100 print:border-black break-inside-avoid">
                          <strong>Pembahasan:</strong> <MathRenderer content={q.explanation} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SECTION 2: BENAR / SALAH */}
          {tfQuestions.length > 0 && (
            <div className="space-y-3 pt-2 mb-4">
              <div
                className="font-black text-xs uppercase tracking-wider border-b-2 border-black pb-1 mb-2 column-span-all"
                style={{ columnSpan: "all" }}
              >
                II. BENAR ATAU SALAH (Tentukan apakah pernyataan di bawah ini BENAR atau SALAH!)
              </div>

              <div className="space-y-2.5">
                {tfQuestions.map((q: any, idx: number) => {
                  const qNumber = mcqQuestions.length + idx + 1;
                  const correctOpt = q.options?.find((o: any) => o.isCorrect);
                  const correctText = correctOpt?.optionText || correctOpt?.text || correctOpt?.key || "-";

                  return (
                    <div key={q.id} className="break-inside-avoid space-y-1 pt-1">
                      <div className="flex items-start gap-1.5">
                        <span className="font-bold shrink-0">{qNumber}.</span>
                        <div className="flex-1 space-y-1">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1.5">
                            <div className="font-normal text-justify flex-1 leading-snug">
                              <MathRenderer content={q.questionText} />
                            </div>
                            <div className="flex items-center gap-2 shrink-0 pl-1">
                              {printMode === "STUDENT" ? (
                                <div className="flex items-center gap-2 text-xs font-bold whitespace-nowrap">
                                  <span>[&nbsp;&nbsp;&nbsp;&nbsp;] Benar</span>
                                  <span>[&nbsp;&nbsp;&nbsp;&nbsp;] Salah</span>
                                </div>
                              ) : (
                                <div className="px-1.5 py-0.5 bg-emerald-100 border border-emerald-400 rounded text-xs font-black text-emerald-950 print:bg-slate-200 print:border-black whitespace-nowrap">
                                  Kunci: {correctText}
                                </div>
                              )}
                            </div>
                          </div>

                          {q.questionImage && (
                            <div className="my-1.5 max-w-full">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={q.questionImage}
                                alt={`Gambar Soal ${qNumber}`}
                                className="max-h-48 max-w-full rounded border border-slate-300 object-contain print:border-black"
                              />
                            </div>
                          )}

                          {showPoints && (
                            <div className="text-[10px] font-bold text-slate-600 italic">
                              [Skor: {q.points} Poin]
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SECTION 3: URAIAN / ESAI */}
          {essayQuestions.length > 0 && (
            <div className="space-y-3 pt-2 mb-4">
              <div
                className="font-black text-xs uppercase tracking-wider border-b-2 border-black pb-1 mb-2 column-span-all"
                style={{ columnSpan: "all" }}
              >
                III. URAIAN / ESAI (Jawablah pertanyaan-pertanyaan di bawah ini dengan jelas dan tepat!)
              </div>

              <div className="space-y-3.5">
                {essayQuestions.map((q: any, idx: number) => {
                  const qNumber = mcqQuestions.length + tfQuestions.length + idx + 1;
                  return (
                    <div key={q.id} className="break-inside-avoid space-y-1.5 pt-1">
                      <div className="flex items-start gap-1.5">
                        <span className="font-bold shrink-0">{qNumber}.</span>
                        <div className="flex-1 space-y-1">
                          <div className="font-normal text-justify leading-snug">
                            <MathRenderer content={q.questionText} />
                          </div>

                          {q.questionImage && (
                            <div className="my-1.5 max-w-full">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={q.questionImage}
                                alt={`Gambar Soal ${qNumber}`}
                                className="max-h-48 max-w-full rounded border border-slate-300 object-contain print:border-black"
                              />
                            </div>
                          )}

                          {showPoints && (
                            <span className="text-[10px] font-bold text-slate-600 italic block">
                              [Skor Maksimal: {q.points} Poin]
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Ruled Writing Lines for Students */}
                      {printMode === "STUDENT" ? (
                        <div className="pl-4 space-y-2 pt-1">
                          <div className="border-b border-dotted border-black w-full h-3" />
                          <div className="border-b border-dotted border-black w-full h-3" />
                          <div className="border-b border-dotted border-black w-full h-3" />
                        </div>
                      ) : (
                        showExplanations && (
                          <div className="ml-4 p-2 rounded bg-amber-50 border border-amber-200 text-xs text-amber-900 print:bg-slate-100 print:border-black break-inside-avoid">
                            <strong>Pedoman Penskoran / Kunci Jawaban:</strong>
                            <p className="mt-0.5 whitespace-pre-line font-normal">
                              {q.explanation || "Jawaban dinilai berdasarkan kelengkapan, ketepatan uraian materi, dan kerapian bahasa."}
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* FOOTER & TANDA TANGAN */}
        {showSignatures && (
          <div
            className="mt-8 pt-4 border-t-2 border-black break-inside-avoid text-xs column-span-all"
            style={{ columnSpan: "all" }}
          >
            <div className="text-center font-bold italic mb-4">
              --- Selamat Mengerjakan & Semoga Sukses ---
            </div>

            <div className="grid grid-cols-2 text-center font-bold">
              <div className="space-y-12">
                <span>Orang Tua / Wali Siswa,</span>
                <span className="block border-t border-black w-40 mx-auto pt-1 font-normal">
                  ( ........................................ )
                </span>
              </div>

              <div className="space-y-12">
                <span>Guru Pengampu Mata Pelajaran,</span>
                <span className="block border-t border-black w-40 mx-auto pt-1 font-bold">
                  ( {exam.teacher?.name || "........................................"} )
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Embedded Print Styling */}
      <style jsx global>{`
        @media print {
          body {
            background-color: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
          header, footer, nav, aside {
            display: none !important;
          }
          @page {
            size: ${pageOrientation === "landscape" ? "A4 landscape" : "A4 portrait"};
            margin: ${pageMargin === "compact" ? "0.8cm 1cm 0.8cm 1cm" : "1.5cm 1.5cm 1.5cm 1.5cm"};
          }
          .print-columns-2 {
            column-count: 2 !important;
            column-gap: ${pageOrientation === "landscape" ? "2cm" : "1.2cm"} !important;
            column-rule: ${showColumnDivider ? "0.5pt solid #000" : "none"} !important;
          }
          .column-span-all {
            column-span: all !important;
          }
          .break-inside-avoid {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>
    </div>
  );
}
