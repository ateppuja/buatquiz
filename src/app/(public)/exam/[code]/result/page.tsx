"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/layouts/Navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  BookOpen,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Home,
  Sparkles,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ConfettiCanvas } from "@/components/ui/confetti";
import { sounds } from "@/lib/sound-effects";

export default function ExamResultPage() {
  const params = useParams();
  const router = useRouter();
  const code = (params?.code as string)?.toUpperCase();

  const [isLoading, setIsLoading] = useState(true);
  const [resultData, setResultData] = useState<any>(null);
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    async function fetchResult() {
      try {
        const storedAttemptId = sessionStorage.getItem("exam_active_attempt_id");
        const url = storedAttemptId
          ? `/api/v1/student/attempts/${storedAttemptId}/result`
          : `/api/v1/student/attempts/session/result`;

        const res = await fetch(url);
        const data = await res.json();

        if (!res.ok || !data.success) {
          toast.error(data.error?.message || "Gagal memuat hasil ujian.");
          router.push(`/exam/${code}/identity`);
          return;
        }

        setResultData(data.data);
        sounds.playCelebrate();
      } catch {
        toast.error("Gagal memuat data nilai.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchResult();
  }, [code, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#DDF3FD] via-[#E8F8FE] to-[#EFFDF4]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center space-y-3 bg-white/80 backdrop-blur p-8 rounded-3xl shadow-xl">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#00C0FA] border-t-transparent mx-auto" />
            <p className="text-sm font-bold text-slate-700">Memuat rekapan hasil ujian...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!resultData) return null;

  const { isPublished, canShowAnswerKey, exam, student, currentAttempt, allAttempts, examResult, questionReview } = resultData;
  const remainingAttempts = Math.max(0, exam.maxAttempts - allAttempts.length);
  const finalScore = examResult?.finalScore ?? currentAttempt.finalScore ?? 0;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#DDF3FD] via-[#E8F8FE] to-[#EFFDF4] text-slate-800 pb-16">
      {showConfetti && <ConfettiCanvas duration={4000} />}
      <Navbar />

      <div className="container mx-auto max-w-3xl px-3 sm:px-6 pt-6 sm:pt-8 space-y-6">
        {/* Main Congratulations & Score Card */}
        <div className="bg-white/95 backdrop-blur-md rounded-[32px] sm:rounded-[40px] shadow-2xl border-4 border-white p-6 sm:p-10 text-center relative overflow-hidden">
          
          {/* Official Mascot & Trophy */}
          <div className="mx-auto flex items-center justify-center gap-3 mb-4">
            <div className="h-18 w-18 rounded-3xl overflow-hidden bg-white p-1 border-2 border-[#E0F2C2] shadow-xl ring-4 ring-white">
              <img
                src="/whitebee-logo.png"
                alt="White Bee Logo"
                className="h-full w-full object-contain"
              />
            </div>
            <div className="flex h-18 w-18 items-center justify-center rounded-3xl bg-[#7AB82A] text-white shadow-xl ring-4 ring-white">
              <Trophy className="h-9 w-9" />
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#EBF7D9] text-[#4B7914] text-xs font-black uppercase tracking-wider mb-2 border border-[#D5EFA9]">
            <Sparkles className="h-3.5 w-3.5 text-[#7AB82A]" /> Ujian Selesai Dikumpulkan
          </span>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight mb-2">
            Hebat, {student.name}! 🎉
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 max-w-md mx-auto mb-6">
            Lembar jawaban Anda untuk ujian <strong>{exam.title}</strong> (Kelas {student.className}) telah berhasil diterima oleh sistem.
          </p>

          {/* Published Score Badge vs Waiting Notification */}
          {isPublished ? (
            <div className="rounded-3xl bg-gradient-to-b from-[#F0FDF4] to-[#ECFCCB] p-6 sm:p-8 border-2 border-[#D3F2A7] max-w-sm mx-auto shadow-inner mb-6">
              <span className="text-xs font-black uppercase tracking-wider text-[#579717]">
                Nilai Akhir Ujian
              </span>
              <div className="my-2 flex items-center justify-center gap-1">
                <span className="text-5xl sm:text-6xl font-black text-slate-800 tracking-tight">
                  {finalScore}
                </span>
                <span className="text-base font-bold text-slate-400 self-end mb-2">/ 100</span>
              </div>
              <p className="text-xs font-bold text-[#579717]">
                Metode: {exam.gradingMethod}
              </p>
              {currentAttempt.gradingStatus === "PENDING" && (
                <p className="text-[11px] text-amber-700 font-semibold mt-2 pt-2 border-t border-amber-200">
                  * Terdapat soal esai yang menunggu penilaian oleh guru.
                </p>
              )}
            </div>
          ) : (
            <div className="rounded-3xl bg-amber-50/90 p-5 border-2 border-amber-200/80 max-w-md mx-auto text-center mb-6 shadow-sm">
              <AlertCircle className="h-6 w-6 text-amber-600 mx-auto mb-2" />
              <h4 className="text-sm font-black text-amber-900">Nilai Belum Dipublikasikan</h4>
              <p className="text-xs font-medium text-amber-800 mt-1 leading-relaxed">
                Hasil nilai akan diumumkan oleh guru pengampu setelah seluruh sesi ujian dan penilaian esai selesai.
              </p>
            </div>
          )}

          {/* Multi-Attempt History Recap (FR-020) */}
          {allAttempts.length > 1 && (
            <div className="mt-6 border-t border-slate-100 pt-6 text-left max-w-md mx-auto">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                <RotateCcw className="h-4 w-4 text-[#00C0FA]" />
                Riwayat Percobaan Ujian ({allAttempts.length}x)
              </h4>
              <div className="space-y-2">
                {allAttempts.map((att: any) => (
                  <div
                    key={att.id}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-2xl border text-xs font-bold",
                      att.id === currentAttempt.id
                        ? "border-[#00C0FA] bg-[#F0F9FF] text-[#0093BE]"
                        : "border-slate-100 bg-slate-50 text-slate-500"
                    )}
                  >
                    <span>Percobaan ke-{att.attemptNumber} {att.id === currentAttempt.id && "(Terbaru)"}</span>
                    <span className="text-slate-800 font-black">
                      {isPublished ? `${att.finalScore ?? 0} Poin` : "Tersimpan"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {remainingAttempts > 0 && (
              <Button
                variant="outline"
                onClick={() => router.push(`/exam/${code}/instructions`)}
                className="gap-2 font-bold rounded-2xl border-2"
              >
                <RotateCcw className="h-4 w-4 text-[#00C0FA]" />
                <span>Ulangi Ujian (Sisa {remainingAttempts}x)</span>
              </Button>
            )}

            <Button
              onClick={() => router.push("/")}
              className="gap-2 font-black rounded-2xl bg-[#00C0FA] hover:bg-[#0093BE] text-white shadow-md px-6"
            >
              <Home className="h-4 w-4" />
              <span>Kembali ke Beranda</span>
            </Button>
          </div>
        </div>

        {/* Detailed Question Review & Answer Key (FR-021) */}
        {canShowAnswerKey && questionReview.length > 0 && (
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-[#00C0FA]" />
                <span>Pembahasan & Kunci Jawaban</span>
              </h2>
              <span className="text-xs font-bold bg-[#80D235] text-white px-3 py-1 rounded-xl shadow-sm">
                Kunci Jawaban Terbuka
              </span>
            </div>

            {questionReview.map((q: any, idx: number) => {
              const isEssay = q.type === "ESSAY";
              const studentOpt = q.options?.find((o: any) => o.id === q.studentAnswer.selectedOptionId);
              const correctOpt = q.options?.find((o: any) => o.isCorrect);
              const isCorrect = studentOpt?.isCorrect;

              return (
                <div key={q.id} className="bg-white/95 backdrop-blur-md rounded-3xl shadow-md border-2 border-white p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-3 mb-3 border-b border-slate-100 pb-3">
                    <span className="font-extrabold text-sm text-slate-800">Soal Nomor {idx + 1}</span>
                    <div className="flex items-center gap-2">
                      {!isEssay ? (
                        isCorrect ? (
                          <Badge variant="success" className="text-xs gap-1 font-bold">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Benar (+{q.points} Poin)</span>
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="text-xs gap-1 font-bold">
                            <XCircle className="h-3.5 w-3.5" />
                            <span>Salah (0 Poin)</span>
                          </Badge>
                        )
                      ) : (
                        <Badge variant="outline" className="text-xs font-bold">
                          Esai: {q.studentAnswer.awardedPoints ?? "Menunggu Penilaian"} / {q.points} Poin
                        </Badge>
                      )}
                    </div>
                  </div>

                  <p className="text-sm font-bold text-slate-800 mb-4 whitespace-pre-line leading-relaxed">
                    {q.questionText}
                  </p>

                  {/* Options Review for MCQ / TF */}
                  {!isEssay && (
                    <div className="space-y-2 mb-4">
                      {q.options.map((opt: any) => {
                        const isStudentChoice = opt.id === q.studentAnswer.selectedOptionId;
                        const isThisCorrect = opt.isCorrect;

                        return (
                          <div
                            key={opt.id}
                            className={cn(
                              "flex items-center justify-between p-3.5 rounded-2xl border text-xs font-semibold leading-relaxed transition-all",
                              isThisCorrect
                                ? "border-emerald-500 bg-emerald-50 text-emerald-900 font-bold"
                                : isStudentChoice
                                ? "border-rose-400 bg-rose-50 text-rose-900"
                                : "border-slate-100 bg-slate-50/60 text-slate-600"
                            )}
                          >
                            <span className="flex items-center gap-2.5">
                              <span className="h-6 w-6 rounded-lg bg-white flex items-center justify-center font-bold text-slate-800 shadow-sm">
                                {opt.key}
                              </span>
                              <span>{opt.text}</span>
                            </span>
                            <div className="flex items-center gap-1.5 font-bold">
                              {isStudentChoice && <span className="text-rose-600">(Pilihan Anda)</span>}
                              {isThisCorrect && <span className="text-emerald-600">✓ Kunci Jawaban</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Essay Answer Review */}
                  {isEssay && (
                    <div className="space-y-3 mb-4">
                      <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                        <span className="text-[11px] font-black text-slate-400 uppercase">Jawaban Anda:</span>
                        <p className="text-xs font-semibold text-slate-800 mt-1 whitespace-pre-line">
                          {q.studentAnswer.answerText || "(Tidak dijawab)"}
                        </p>
                      </div>
                      {q.studentAnswer.feedback && (
                        <div className="rounded-2xl bg-blue-50 p-4 border border-blue-200">
                          <span className="text-[11px] font-black text-blue-700 uppercase">Catatan Guru:</span>
                          <p className="text-xs font-semibold text-blue-950 mt-1">
                            {q.studentAnswer.feedback}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Explanation / Pembahasan */}
                  {q.explanation && (
                    <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 text-xs">
                      <span className="font-bold text-[#0093BE] flex items-center gap-1.5 mb-1">
                        <HelpCircle className="h-4 w-4" />
                        Pembahasan Soal:
                      </span>
                      <p className="text-slate-700 whitespace-pre-line leading-relaxed font-medium">
                        {q.explanation}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
