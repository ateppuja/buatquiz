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
  const [fontSize, setFontSize] = useState<"sm" | "base" | "lg">("base");
  const [showInstructions, setShowInstructions] = useState(true);
  const [showStudentIdentityBox, setShowStudentIdentityBox] = useState(true);
  const [showPoints, setShowPoints] = useState(true);
  const [showExplanations, setShowExplanations] = useState(true);
  const [showSignatures, setShowSignatures] = useState(true);

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Left: Mode Switcher */}
          <div className="space-y-1.5">
            <label className="block font-black text-slate-700 uppercase tracking-wider text-[11px]">
              Pilih Jenis Naskah Cetak:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPrintMode("STUDENT")}
                className={cn(
                  "flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-black transition-all cursor-pointer",
                  printMode === "STUDENT"
                    ? "bg-[#7AB82A] text-white border-[#7AB82A] shadow-sm ring-2 ring-[#D5EFA9]"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                )}
              >
                <FileText className="h-4 w-4" />
                <span>Lembar Soal Siswa</span>
              </button>

              <button
                type="button"
                onClick={() => setPrintMode("TEACHER_KEY")}
                className={cn(
                  "flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-black transition-all cursor-pointer",
                  printMode === "TEACHER_KEY"
                    ? "bg-amber-600 text-white border-amber-600 shadow-sm ring-2 ring-amber-200"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                )}
              >
                <KeyRound className="h-4 w-4" />
                <span>Kunci & Pembahasan Guru</span>
              </button>
            </div>
          </div>

          {/* Right: Layout & Font Options */}
          <div className="space-y-1.5">
            <label className="block font-black text-slate-700 uppercase tracking-wider text-[11px]">
              Ukuran Font & Tampilan:
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                {[
                  { key: "sm", label: "Kecil (Hemat Kertas)" },
                  { key: "base", label: "Standar" },
                  { key: "lg", label: "Besar" },
                ].map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => setFontSize(s.key as any)}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                      fontSize === s.key ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3 pt-1 text-[11px] font-semibold text-slate-600">
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showPoints}
                    onChange={(e) => setShowPoints(e.target.checked)}
                    className="rounded border-slate-300 text-[#7AB82A] focus:ring-[#7AB82A]"
                  />
                  <span>Bobot Poin</span>
                </label>

                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showInstructions}
                    onChange={(e) => setShowInstructions(e.target.checked)}
                    className="rounded border-slate-300 text-[#7AB82A] focus:ring-[#7AB82A]"
                  />
                  <span>Petunjuk</span>
                </label>

                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showSignatures}
                    onChange={(e) => setShowSignatures(e.target.checked)}
                    className="rounded border-slate-300 text-[#7AB82A] focus:ring-[#7AB82A]"
                  />
                  <span>Kolom Tanda Tangan</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 📄 PRINTABLE PAPER SHEET (A4 Standard Format) */}
      <div
        className={cn(
          "max-w-4xl mx-auto bg-white text-black p-8 sm:p-12 rounded-2xl shadow-xl print:shadow-none print:p-0 print:m-0 print:max-w-none print:w-full border print:border-none",
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
        <div className="my-4 border-2 border-black p-3.5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold leading-normal">
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
            <div className="border border-black p-2.5 space-y-1.5 bg-slate-50/50 print:bg-transparent">
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
                    <div className="border border-black px-3 py-1 font-black text-center text-xs">
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
          <div className="mb-5 p-3 border border-dashed border-black text-xs space-y-1 bg-slate-50/40 print:bg-transparent">
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
        <div className="space-y-6">
          {/* SECTION 1: PILIHAN GANDA */}
          {mcqQuestions.length > 0 && (
            <div className="space-y-4">
              <div className="font-black text-xs uppercase tracking-wider border-b-2 border-black pb-1">
                I. PILIHAN GANDA (Berilah tanda silang (X) pada huruf A, B, C, atau D di depan jawaban yang paling benar!)
              </div>

              <div className="space-y-4">
                {mcqQuestions.map((q: any, idx: number) => {
                  const qNumber = idx + 1;
                  return (
                    <div key={q.id} className="break-inside-avoid space-y-2 pt-1">
                      {/* Question Prompt */}
                      <div className="flex items-start gap-2">
                        <span className="font-bold shrink-0">{qNumber}.</span>
                        <div className="flex-1 space-y-2">
                          <p className="font-normal text-justify whitespace-pre-line leading-relaxed">
                            <MathRenderer content={q.questionText} />
                          </p>

                          {q.questionImage && (
                            <div className="my-2 max-w-md">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={q.questionImage}
                                alt={`Gambar Soal ${qNumber}`}
                                className="max-h-60 max-w-full rounded border border-slate-300 object-contain print:border-black"
                              />
                            </div>
                          )}

                          {showPoints && (
                            <span className="text-[11px] font-bold text-slate-600 italic block">
                              [Skor: {q.points} Poin]
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Options Grid / List */}
                      <div className="pl-6 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
                        {q.options?.map((opt: any, oIdx: number) => {
                          const optKey = opt.optionKey || opt.key || String.fromCharCode(65 + oIdx);
                          const isCorrect = Boolean(opt.isCorrect);
                          return (
                            <div
                              key={oIdx}
                              className={cn(
                                "flex items-start gap-2 p-1 rounded transition-colors",
                                printMode === "TEACHER_KEY" && isCorrect
                                  ? "bg-emerald-100 font-bold text-emerald-950 border border-emerald-400 print:bg-slate-200 print:border-black"
                                  : "text-slate-900"
                              )}
                            >
                              <span className="font-bold shrink-0">
                                {printMode === "TEACHER_KEY" && isCorrect ? `[✓ ${optKey}]` : `(${optKey})`}
                              </span>
                              <span className="flex-1">
                                <MathRenderer content={opt.optionText || opt.text} />
                              </span>
                              {printMode === "TEACHER_KEY" && isCorrect && (
                                <span className="text-[10px] uppercase tracking-wider font-black text-emerald-800 print:text-black">
                                  KUNCI
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Explanation (if Teacher Key mode) */}
                      {printMode === "TEACHER_KEY" && showExplanations && q.explanation && (
                        <div className="ml-6 p-2 rounded bg-amber-50 border border-amber-200 text-xs text-amber-900 print:bg-slate-100 print:border-black">
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
            <div className="space-y-4 pt-2">
              <div className="font-black text-xs uppercase tracking-wider border-b-2 border-black pb-1">
                II. BENAR ATAU SALAH (Tentukan apakah pernyataan di bawah ini BENAR atau SALAH!)
              </div>

              <div className="space-y-3">
                {tfQuestions.map((q: any, idx: number) => {
                  const qNumber = mcqQuestions.length + idx + 1;
                  const correctOpt = q.options?.find((o: any) => o.isCorrect);
                  const correctText = correctOpt?.optionText || correctOpt?.text || correctOpt?.key || "-";

                  return (
                    <div key={q.id} className="break-inside-avoid space-y-1.5 pt-1">
                      <div className="flex items-start gap-2">
                        <span className="font-bold shrink-0">{qNumber}.</span>
                        <div className="flex-1 space-y-2">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <p className="font-normal text-justify flex-1">
                              <MathRenderer content={q.questionText} />
                            </p>
                            <div className="flex items-center gap-3 shrink-0 pl-2">
                              {printMode === "STUDENT" ? (
                                <div className="flex items-center gap-3 text-xs font-bold">
                                  <span>[&nbsp;&nbsp;&nbsp;&nbsp;] Benar</span>
                                  <span>[&nbsp;&nbsp;&nbsp;&nbsp;] Salah</span>
                                </div>
                              ) : (
                                <div className="px-2 py-0.5 bg-emerald-100 border border-emerald-400 rounded text-xs font-black text-emerald-950 print:bg-slate-200 print:border-black">
                                  Kunci: {correctText}
                                </div>
                              )}
                            </div>
                          </div>

                          {q.questionImage && (
                            <div className="my-2 max-w-md">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={q.questionImage}
                                alt={`Gambar Soal ${qNumber}`}
                                className="max-h-60 max-w-full rounded border border-slate-300 object-contain print:border-black"
                              />
                            </div>
                          )}

                          {showPoints && (
                            <div className="text-[11px] font-bold text-slate-600 italic">
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
            <div className="space-y-4 pt-2">
              <div className="font-black text-xs uppercase tracking-wider border-b-2 border-black pb-1">
                III. URAIAN / ESAI (Jawablah pertanyaan-pertanyaan di bawah ini dengan jelas dan tepat!)
              </div>

              <div className="space-y-5">
                {essayQuestions.map((q: any, idx: number) => {
                  const qNumber = mcqQuestions.length + tfQuestions.length + idx + 1;
                  return (
                    <div key={q.id} className="break-inside-avoid space-y-2 pt-1">
                      <div className="flex items-start gap-2">
                        <span className="font-bold shrink-0">{qNumber}.</span>
                        <div className="flex-1 space-y-2">
                          <p className="font-normal text-justify leading-relaxed">
                            <MathRenderer content={q.questionText} />
                          </p>

                          {q.questionImage && (
                            <div className="my-2 max-w-md">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={q.questionImage}
                                alt={`Gambar Soal ${qNumber}`}
                                className="max-h-60 max-w-full rounded border border-slate-300 object-contain print:border-black"
                              />
                            </div>
                          )}

                          {showPoints && (
                            <span className="text-[11px] font-bold text-slate-600 italic block">
                              [Skor Maksimal: {q.points} Poin]
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Ruled Writing Lines for Students */}
                      {printMode === "STUDENT" ? (
                        <div className="pl-6 space-y-4 pt-2">
                          <div className="border-b border-dotted border-black w-full h-4" />
                          <div className="border-b border-dotted border-black w-full h-4" />
                          <div className="border-b border-dotted border-black w-full h-4" />
                          <div className="border-b border-dotted border-black w-full h-4" />
                        </div>
                      ) : (
                        showExplanations && (
                          <div className="ml-6 p-2.5 rounded bg-amber-50 border border-amber-200 text-xs text-amber-900 print:bg-slate-100 print:border-black">
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
          <div className="mt-12 pt-6 border-t-2 border-black break-inside-avoid text-xs">
            <div className="text-center font-bold italic mb-6">
              --- Selamat Mengerjakan & Semoga Sukses ---
            </div>

            <div className="grid grid-cols-2 text-center font-bold">
              <div className="space-y-16">
                <span>Orang Tua / Wali Siswa,</span>
                <span className="block border-t border-black w-40 mx-auto pt-1 font-normal">
                  ( ........................................ )
                </span>
              </div>

              <div className="space-y-16">
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
            size: A4;
            margin: 1.5cm 1.5cm 1.5cm 1.5cm;
          }
          .break-inside-avoid {
            page-break-inside: avoid;
            break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
}
