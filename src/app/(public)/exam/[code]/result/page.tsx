"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/layouts/Navbar";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function ExamResultPage() {
  const params = useParams();
  const router = useRouter();
  const code = (params?.code as string)?.toUpperCase();

  const [isLoading, setIsLoading] = useState(true);
  const [resultData, setResultData] = useState<any>(null);

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
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center space-y-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
            <p className="text-sm text-muted-foreground">Memuat rekapan hasil ujian...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!resultData) return null;

  const { isPublished, canShowAnswerKey, exam, student, currentAttempt, allAttempts, examResult, questionReview } = resultData;
  const remainingAttempts = Math.max(0, exam.maxAttempts - allAttempts.length);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 pb-12">
      <Navbar />

      <div className="container mx-auto max-w-3xl px-4 sm:px-6 pt-8 space-y-6">
        {/* Header Success Card */}
        <Card className="shadow-lg border-slate-200 dark:border-slate-800 text-center p-6 sm:p-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 mb-4 shadow-sm">
            <CheckCircle2 className="h-8 w-8" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground mb-1">
            Ujian Berhasil Dikumpulkan!
          </h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
            Terima kasih, <strong>{student.name}</strong> (Kelas {student.className}). Lembar jawaban Anda telah diterima oleh server.
          </p>

          {/* Published vs Unpublished Score View */}
          {isPublished ? (
            <div className="rounded-2xl bg-gradient-to-b from-blue-50 to-indigo-50/40 dark:from-slate-900 dark:to-slate-900/60 p-6 border border-blue-100 dark:border-blue-900 max-w-md mx-auto shadow-inner">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                Nilai Akhir Ujian ({exam.gradingMethod})
              </span>
              <div className="my-2 flex items-center justify-center gap-1">
                <span className="text-5xl font-black text-foreground tracking-tight">
                  {examResult?.finalScore ?? currentAttempt.finalScore ?? 0}
                </span>
                <span className="text-sm font-semibold text-muted-foreground self-end mb-1.5">/ 100</span>
              </div>
              {currentAttempt.gradingStatus === "PENDING" && (
                <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                  * Terdapat soal esai yang sedang menunggu penilaian manual oleh guru.
                </p>
              )}
            </div>
          ) : (
            <div className="rounded-xl bg-amber-50 dark:bg-amber-950/40 p-5 border border-amber-200 dark:border-amber-900 max-w-md mx-auto text-center">
              <AlertCircle className="h-6 w-6 text-amber-600 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-amber-900 dark:text-amber-300">Nilai Belum Dipublikasikan</h4>
              <p className="text-xs text-amber-800 dark:text-amber-400 mt-1">
                Hasil ujian dan nilai akan dipublikasikan oleh guru pengampu setelah seluruh sesi dan penilaian selesai.
              </p>
            </div>
          )}

          {/* Multi-Attempt History Recap (FR-020) */}
          {allAttempts.length > 1 && (
            <div className="mt-8 border-t border-border pt-6 text-left max-w-lg mx-auto">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                <RotateCcw className="h-4 w-4" />
                Riwayat Percobaan Ujian Anda ({allAttempts.length}x)
              </h4>
              <div className="space-y-2">
                {allAttempts.map((att: any) => (
                  <div
                    key={att.id}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg border text-xs",
                      att.id === currentAttempt.id
                        ? "border-primary bg-primary/5 font-semibold"
                        : "border-border bg-card text-muted-foreground"
                    )}
                  >
                    <span>Percobaan ke-{att.attemptNumber} {att.id === currentAttempt.id && "(Terbaru)"}</span>
                    <span className="font-bold text-foreground">
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
                className="gap-2 font-semibold"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Ulangi Ujian (Sisa {remainingAttempts}x)</span>
              </Button>
            )}

            <Button
              onClick={() => router.push("/")}
              className="gap-2 font-semibold"
            >
              <Home className="h-4 w-4" />
              <span>Kembali ke Beranda</span>
            </Button>
          </div>
        </Card>

        {/* Detailed Question Review & Answer Key (FR-021) */}
        {canShowAnswerKey && questionReview.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <span>Pembahasan & Kunci Jawaban</span>
              </h2>
              <Badge variant="success" className="text-xs">
                Kunci Jawaban Terbuka
              </Badge>
            </div>

            {questionReview.map((q: any, idx: number) => {
              const isEssay = q.type === "ESSAY";
              const studentOpt = q.options?.find((o: any) => o.id === q.studentAnswer.selectedOptionId);
              const correctOpt = q.options?.find((o: any) => o.isCorrect);
              const isCorrect = studentOpt?.isCorrect;

              return (
                <Card key={q.id} className="shadow-sm border-border p-5">
                  <div className="flex items-start justify-between gap-3 mb-3 border-b border-border pb-3">
                    <span className="font-bold text-sm text-foreground">Soal {idx + 1}</span>
                    <div className="flex items-center gap-2">
                      {!isEssay ? (
                        isCorrect ? (
                          <Badge variant="success" className="text-xs gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Benar (+{q.points} Poin)</span>
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="text-xs gap-1">
                            <XCircle className="h-3 w-3" />
                            <span>Salah (0 Poin)</span>
                          </Badge>
                        )
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          Esai: {q.studentAnswer.awardedPoints ?? "Menunggu Nilai"} / {q.points} Poin
                        </Badge>
                      )}
                    </div>
                  </div>

                  <p className="text-sm font-medium text-foreground mb-4 whitespace-pre-line leading-relaxed">
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
                              "flex items-center justify-between p-3 rounded-lg border text-xs leading-relaxed",
                              isThisCorrect
                                ? "border-emerald-500 bg-emerald-50/70 text-emerald-900 font-semibold dark:bg-emerald-950/40 dark:text-emerald-300"
                                : isStudentChoice
                                ? "border-red-500 bg-red-50/70 text-red-900 dark:bg-red-950/40 dark:text-red-300"
                                : "border-border bg-background text-muted-foreground"
                            )}
                          >
                            <span className="flex items-center gap-2">
                              <span className="font-bold">{opt.key}.</span>
                              <span>{opt.text}</span>
                            </span>
                            <div className="flex items-center gap-1.5 font-bold">
                              {isStudentChoice && <span>(Pilihan Anda)</span>}
                              {isThisCorrect && <span>✓ Kunci</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Essay Answer Review */}
                  {isEssay && (
                    <div className="space-y-3 mb-4">
                      <div className="rounded-lg bg-slate-50 dark:bg-slate-900 p-3 border border-border">
                        <span className="text-[11px] font-bold text-muted-foreground uppercase">Jawaban Anda:</span>
                        <p className="text-xs text-foreground mt-1 whitespace-pre-line">
                          {q.studentAnswer.answerText || "(Tidak dijawab)"}
                        </p>
                      </div>
                      {q.studentAnswer.feedback && (
                        <div className="rounded-lg bg-blue-50 dark:bg-blue-950/40 p-3 border border-blue-200 dark:border-blue-900">
                          <span className="text-[11px] font-bold text-blue-800 dark:text-blue-300 uppercase">Catatan Guru:</span>
                          <p className="text-xs text-blue-950 dark:text-blue-200 mt-1">
                            {q.studentAnswer.feedback}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Explanation / Pembahasan */}
                  {q.explanation && (
                    <div className="rounded-xl bg-slate-100 dark:bg-slate-900/60 p-3.5 border border-slate-200 dark:border-slate-800 text-xs">
                      <span className="font-bold text-primary flex items-center gap-1 mb-1">
                        <HelpCircle className="h-3.5 w-3.5" />
                        Pembahasan:
                      </span>
                      <p className="text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                        {q.explanation}
                      </p>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
