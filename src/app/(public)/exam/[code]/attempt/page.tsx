"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  Timer,
  CheckCircle2,
  AlertCircle,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Send,
  Loader2,
  Grid,
  User,
  AlertTriangle,
  HelpCircle,
} from "lucide-react";
import { formatTimeRemaining, cn } from "@/lib/utils";
import { toast } from "sonner";

interface Option {
  id: string;
  key: string;
  text: string;
}

interface Question {
  id: string;
  number: number;
  type: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "ESSAY";
  questionText: string;
  questionImage?: string | null;
  points: number;
  options: Option[];
}

export default function ExamAttemptPage() {
  const params = useParams();
  const router = useRouter();
  const code = (params?.code as string)?.toUpperCase();

  const [isLoading, setIsLoading] = useState(true);
  const [attemptData, setAttemptData] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);

  // Answers state: { [questionId]: { selectedOptionId?: string; answerText?: string; revision: number } }
  const [answers, setAnswers] = useState<Record<string, { selectedOptionId: string | null; answerText: string | null; revision: number }>>({});
  // Flagged questions for review
  const [flagged, setFlagged] = useState<Record<string, boolean>>({});

  // Autosave status: 'saved' | 'saving' | 'error'
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "error">("saved");

  // Timer state
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  // Modals
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTimeExpiredDialog, setShowTimeExpiredDialog] = useState(false);
  const [showMobileGrid, setShowMobileGrid] = useState(false);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Fetch Attempt Data
  const loadAttempt = useCallback(async () => {
    try {
      const storedAttemptId = sessionStorage.getItem("exam_active_attempt_id");
      const url = storedAttemptId
        ? `/api/v1/student/attempts/${storedAttemptId}`
        : `/api/v1/student/attempts/session`;

      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.error?.message || "Sesi ujian tidak valid atau telah berakhir.");
        router.push(`/exam/${code}/identity`);
        return;
      }

      const attempt = data.data;

      if (attempt.attempt.status === "SUBMITTED" || attempt.attempt.status === "EXPIRED") {
        router.push(`/exam/${code}/result`);
        return;
      }

      setAttemptData(attempt);
      setQuestions(attempt.questions);
      setAnswers(attempt.answers || {});
      setTimeRemaining(attempt.attempt.timeRemainingSeconds);
    } catch {
      toast.error("Gagal memuat sesi pengerjaan ujian.");
    } finally {
      setIsLoading(false);
    }
  }, [code, router]);

  useEffect(() => {
    loadAttempt();
  }, [loadAttempt]);

  // 2. Server-Synced Countdown Timer
  useEffect(() => {
    if (timeRemaining <= 0 || isLoading) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setShowTimeExpiredDialog(true);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeRemaining, isLoading]);

  // 3. Save Answer to Server
  const saveAnswerToServer = async (
    questionId: string,
    payload: { selectedOptionId?: string | null; answerText?: string | null; revision: number }
  ) => {
    if (!attemptData?.attempt?.id) return;
    setSaveStatus("saving");

    try {
      const res = await fetch(
        `/api/v1/student/attempts/${attemptData.attempt.id}/answers/${questionId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();
      if (!res.ok || !data.success) {
        setSaveStatus("error");
      } else {
        setSaveStatus("saved");
      }
    } catch {
      setSaveStatus("error");
    }
  };

  // 4. Handle Option Select (MCQ / TF)
  const handleSelectOption = (optionId: string) => {
    const q = questions[currentIdx];
    if (!q) return;

    const currentAnswer = answers[q.id] || { selectedOptionId: null, answerText: null, revision: 0 };
    const nextRevision = (currentAnswer.revision || 0) + 1;

    const updated = {
      ...answers,
      [q.id]: {
        selectedOptionId: optionId,
        answerText: null,
        revision: nextRevision,
      },
    };

    setAnswers(updated);
    saveAnswerToServer(q.id, { selectedOptionId: optionId, revision: nextRevision });
  };

  // 5. Handle Essay Text Change (Debounced 2s)
  const handleEssayChange = (text: string) => {
    const q = questions[currentIdx];
    if (!q) return;

    const currentAnswer = answers[q.id] || { selectedOptionId: null, answerText: null, revision: 0 };
    const nextRevision = (currentAnswer.revision || 0) + 1;

    const updated = {
      ...answers,
      [q.id]: {
        selectedOptionId: null,
        answerText: text,
        revision: nextRevision,
      },
    };

    setAnswers(updated);
    setSaveStatus("saving");

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      saveAnswerToServer(q.id, { answerText: text, revision: nextRevision });
    }, 2000);
  };

  // 6. Toggle Flag
  const toggleFlag = (questionId: string) => {
    setFlagged((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  // 7. Submit Handlers
  const handleAutoSubmit = async () => {
    if (!attemptData?.attempt?.id) return;
    setIsSubmitting(true);
    try {
      await fetch(`/api/v1/student/attempts/${attemptData.attempt.id}/submit`, {
        method: "POST",
      });
      router.push(`/exam/${code}/result`);
    } catch {
      router.push(`/exam/${code}/result`);
    }
  };

  const handleManualSubmit = async () => {
    if (!attemptData?.attempt?.id) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/v1/student/attempts/${attemptData.attempt.id}/submit`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.error?.message || "Gagal mengumpulkan ujian.");
        setIsSubmitting(false);
        return;
      }
      toast.success("Ujian berhasil dikumpulkan!");
      router.push(`/exam/${code}/result`);
    } catch {
      toast.error("Terjadi kesalahan saat mengumpulkan ujian.");
      setIsSubmitting(false);
    }
  };

  if (isLoading || !attemptData || questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="text-sm font-medium text-slate-400">Menyiapkan lembar pengerjaan ujian...</p>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIdx];
  const currentAns = answers[currentQ.id];
  const isFlagged = Boolean(flagged[currentQ.id]);

  // Answered questions count
  const answeredCount = Object.values(answers).filter(
    (a) => Boolean(a.selectedOptionId) || (Boolean(a.answerText) && a.answerText!.trim().length > 0)
  ).length;
  const unansweredCount = questions.length - answeredCount;

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 dark:bg-slate-950 select-none">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur px-4 sm:px-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="hidden sm:block">
            <h1 className="text-sm font-bold text-foreground leading-tight">{attemptData.exam.title}</h1>
            <p className="text-xs text-muted-foreground">{attemptData.exam.subjectName}</p>
          </div>
          <div className="sm:hidden font-bold text-sm text-foreground">
            Soal {currentIdx + 1}/{questions.length}
          </div>
        </div>

        {/* Center: Timer & Autosave Status */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Autosave Status Badge */}
          <div className="flex items-center gap-1.5 text-xs">
            {saveStatus === "saving" && (
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span className="hidden sm:inline">Menyimpan...</span>
              </span>
            )}
            {saveStatus === "saved" && (
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Tersimpan</span>
              </span>
            )}
            {saveStatus === "error" && (
              <span className="flex items-center gap-1 text-destructive font-medium">
                <AlertCircle className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Belum tersimpan</span>
              </span>
            )}
          </div>

          {/* Countdown Timer */}
          <div
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-xl font-mono text-sm font-bold shadow-sm transition-colors",
              timeRemaining <= 300
                ? "bg-red-500/10 text-red-600 border border-red-500/30 animate-pulse"
                : "bg-slate-100 dark:bg-slate-800 text-foreground border border-slate-200 dark:border-slate-700"
            )}
          >
            <Timer className="h-4 w-4" />
            <span>{formatTimeRemaining(timeRemaining)}</span>
          </div>
        </div>

        {/* Right: Student Badge & Grid Toggle */}
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-2 text-xs font-semibold px-2.5 py-1 rounded-lg bg-muted text-foreground">
            <User className="h-3.5 w-3.5 text-primary" />
            <span>{attemptData.student.name}</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowMobileGrid(true)}
            className="lg:hidden gap-1.5 text-xs font-semibold"
          >
            <Grid className="h-4 w-4" />
            <span>Nomor Soal</span>
          </Button>
        </div>
      </header>

      {/* Main Examination Workspace */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto p-3 sm:p-6 gap-6">
        {/* Left/Center: Question Pane */}
        <main className="flex-1 flex flex-col justify-between rounded-2xl border border-border bg-card p-4 sm:p-8 shadow-sm">
          <div>
            {/* Question Header */}
            <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-base shadow-sm">
                  {currentIdx + 1}
                </span>
                <div>
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {currentQ.type === "MULTIPLE_CHOICE"
                      ? "Pilihan Ganda"
                      : currentQ.type === "TRUE_FALSE"
                      ? "Benar / Salah"
                      : "Uraian / Esai"}
                  </span>
                  <p className="text-xs text-muted-foreground font-medium">Bobot: {currentQ.points} Poin</p>
                </div>
              </div>

              {/* Flag Toggle Button */}
              <Button
                variant={isFlagged ? "default" : "outline"}
                size="sm"
                onClick={() => toggleFlag(currentQ.id)}
                className={cn(
                  "gap-1.5 text-xs font-semibold",
                  isFlagged ? "bg-amber-500 hover:bg-amber-600 text-white" : "text-muted-foreground"
                )}
              >
                <Bookmark className="h-4 w-4" />
                <span>{isFlagged ? "Ditandai Ragu" : "Ragu-ragu"}</span>
              </Button>
            </div>

            {/* Question Text Prompt */}
            <div className="text-base sm:text-lg font-medium text-foreground mb-6 leading-relaxed whitespace-pre-line">
              {currentQ.questionText}
            </div>

            {/* Question Image if any */}
            {currentQ.questionImage && (
              <div className="mb-6 max-w-md rounded-xl overflow-hidden border border-border">
                <img src={currentQ.questionImage} alt="Soal" className="w-full h-auto object-cover" />
              </div>
            )}

            {/* Multiple Choice Options */}
            {currentQ.type === "MULTIPLE_CHOICE" && (
              <div className="space-y-3">
                {currentQ.options.map((opt) => {
                  const isSelected = currentAns?.selectedOptionId === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSelectOption(opt.id)}
                      className={cn(
                        "w-full flex items-start gap-4 p-4 rounded-xl border text-left transition-all",
                        isSelected
                          ? "border-primary bg-primary/5 text-primary ring-2 ring-primary/20 shadow-sm"
                          : "border-border bg-background hover:bg-muted/50 text-foreground"
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-bold text-xs uppercase transition-colors",
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {opt.key}
                      </div>
                      <span className="text-sm sm:text-base font-normal pt-0.5 leading-relaxed text-foreground">
                        {opt.text}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* True / False Options */}
            {currentQ.type === "TRUE_FALSE" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {currentQ.options.map((opt) => {
                  const isSelected = currentAns?.selectedOptionId === opt.id;
                  const isBenar = opt.text.toLowerCase().includes("benar");
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSelectOption(opt.id)}
                      className={cn(
                        "flex items-center justify-center gap-3 p-5 rounded-xl border text-base font-bold transition-all",
                        isSelected
                          ? isBenar
                            ? "border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20 shadow-sm dark:bg-emerald-950/50 dark:text-emerald-300"
                            : "border-red-600 bg-red-50 text-red-800 ring-2 ring-red-500/20 shadow-sm dark:bg-red-950/50 dark:text-red-300"
                          : "border-border bg-background hover:bg-muted/50 text-foreground"
                      )}
                    >
                      <span>{opt.text}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Essay Input */}
            {currentQ.type === "ESSAY" && (
              <div className="space-y-2">
                <Textarea
                  value={currentAns?.answerText || ""}
                  onChange={(e) => handleEssayChange(e.target.value)}
                  placeholder="Ketik jawaban lengkap Anda di sini..."
                  rows={8}
                  className="w-full text-base p-4 leading-relaxed resize-y focus-visible:ring-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Jawaban tersimpan otomatis saat Anda berhenti mengetik.</span>
                  <span>{(currentAns?.answerText || "").length} Karakter</span>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Navigation Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6 mt-8">
            <Button
              variant="outline"
              disabled={currentIdx === 0}
              onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
              className="gap-2 text-sm font-semibold"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Sebelumnya</span>
            </Button>

            <div className="flex items-center gap-2">
              {currentIdx < questions.length - 1 ? (
                <Button
                  onClick={() => setCurrentIdx((prev) => Math.min(questions.length - 1, prev + 1))}
                  className="gap-2 text-sm font-semibold"
                >
                  <span>Selanjutnya</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={() => setShowSubmitDialog(true)}
                  className="gap-2 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 shadow-md"
                >
                  <Send className="h-4 w-4" />
                  <span>Selesaikan Ujian</span>
                </Button>
              )}
            </div>
          </div>
        </main>

        {/* Right Desktop: Question Navigation Sidebar Grid */}
        <aside className="hidden lg:block w-80 shrink-0 space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
              <h3 className="text-sm font-bold text-foreground">Daftar Nomor Soal</h3>
              <span className="text-xs font-semibold text-primary">
                {answeredCount}/{questions.length} Terjawab
              </span>
            </div>

            {/* Question Grid */}
            <div className="grid grid-cols-5 gap-2 max-h-[360px] overflow-y-auto pr-1">
              {questions.map((q, idx) => {
                const ans = answers[q.id];
                const isAnswered =
                  Boolean(ans?.selectedOptionId) ||
                  (Boolean(ans?.answerText) && ans.answerText!.trim().length > 0);
                const isFlag = Boolean(flagged[q.id]);
                const isCurrent = idx === currentIdx;

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setCurrentIdx(idx)}
                    className={cn(
                      "relative flex h-11 w-full items-center justify-center rounded-xl font-bold text-xs transition-all",
                      isCurrent ? "ring-2 ring-primary ring-offset-2 scale-105 z-10" : "",
                      isFlag
                        ? "bg-amber-500 text-white shadow-sm"
                        : isAnswered
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                  >
                    <span>{idx + 1}</span>
                    {isFlag && (
                      <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-white" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-5 border-t border-border pt-4 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="h-3.5 w-3.5 rounded-md bg-primary" />
                <span>Sudah Dijawab ({answeredCount})</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="h-3.5 w-3.5 rounded-md bg-amber-500" />
                <span>Ragu-ragu ({Object.values(flagged).filter(Boolean).length})</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="h-3.5 w-3.5 rounded-md bg-muted" />
                <span>Belum Dijawab ({unansweredCount})</span>
              </div>
            </div>

            {/* Submit Button */}
            <div className="mt-5 border-t border-border pt-4">
              <Button
                onClick={() => setShowSubmitDialog(true)}
                className="w-full font-bold gap-2 bg-emerald-600 hover:bg-emerald-700 shadow"
              >
                <Send className="h-4 w-4" />
                <span>Selesaikan Ujian</span>
              </Button>
            </div>
          </div>
        </aside>
      </div>

      {/* Mobile Drawer/Modal for Question Grid */}
      <Dialog open={showMobileGrid} onOpenChange={setShowMobileGrid}>
        <DialogHeader>
          <DialogTitle>Daftar Nomor Soal</DialogTitle>
          <DialogDescription>
            Pilih nomor soal yang ingin Anda tuju ({answeredCount}/{questions.length} terjawab)
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-5 gap-2.5 py-4 max-h-[50vh] overflow-y-auto">
          {questions.map((q, idx) => {
            const ans = answers[q.id];
            const isAnswered =
              Boolean(ans?.selectedOptionId) ||
              (Boolean(ans?.answerText) && ans.answerText!.trim().length > 0);
            const isFlag = Boolean(flagged[q.id]);
            const isCurrent = idx === currentIdx;

            return (
              <button
                key={q.id}
                type="button"
                onClick={() => {
                  setCurrentIdx(idx);
                  setShowMobileGrid(false);
                }}
                className={cn(
                  "relative flex h-12 w-full items-center justify-center rounded-xl font-bold text-sm transition-all",
                  isCurrent ? "ring-2 ring-primary ring-offset-2 scale-105 z-10" : "",
                  isFlag
                    ? "bg-amber-500 text-white"
                    : isAnswered
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                <span>{idx + 1}</span>
              </button>
            );
          })}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowMobileGrid(false)} className="w-full">
            Tutup
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Manual Submission Confirmation Modal (FR-018) */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogHeader>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 mb-3 mx-auto">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <DialogTitle className="text-center text-xl font-bold">
            Konfirmasi Selesaikan Ujian
          </DialogTitle>
          <DialogDescription className="text-center text-sm">
            Apakah Anda yakin ingin menyelesaikan dan mengumpulkan lembar jawaban ujian ini?
          </DialogDescription>
        </DialogHeader>

        <div className="my-4 rounded-xl bg-slate-50 dark:bg-slate-900 p-4 border border-border space-y-2 text-xs">
          <div className="flex justify-between font-medium">
            <span className="text-muted-foreground">Total Butir Soal:</span>
            <span className="text-foreground font-bold">{questions.length} Soal</span>
          </div>
          <div className="flex justify-between font-medium">
            <span className="text-emerald-600 font-semibold">Sudah Terjawab:</span>
            <span className="text-emerald-600 font-bold">{answeredCount} Soal</span>
          </div>
          <div className="flex justify-between font-medium">
            <span className="text-destructive font-semibold">Belum Terjawab:</span>
            <span className="text-destructive font-bold">{unansweredCount} Soal</span>
          </div>
          {unansweredCount > 0 && (
            <p className="pt-2 text-destructive font-semibold border-t border-border">
              ⚠️ Peringatan: Masih terdapat {unansweredCount} butir soal yang belum Anda jawab.
            </p>
          )}
        </div>

        <DialogFooter className="sm:justify-between gap-2">
          <Button
            variant="outline"
            disabled={isSubmitting}
            onClick={() => setShowSubmitDialog(false)}
            className="w-full sm:w-auto"
          >
            Kembali Mengerjakan
          </Button>
          <Button
            onClick={handleManualSubmit}
            isLoading={isSubmitting}
            className="w-full sm:w-auto font-bold bg-emerald-600 hover:bg-emerald-700"
          >
            Ya, Kumpulkan Ujian
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Time Expired Modal */}
      <Dialog open={showTimeExpiredDialog} onOpenChange={() => {}}>
        <DialogHeader>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-600 mb-3 mx-auto">
            <Timer className="h-6 w-6" />
          </div>
          <DialogTitle className="text-center text-xl font-bold">Waktu Ujian Telah Habis</DialogTitle>
          <DialogDescription className="text-center text-sm">
            Waktu pengerjaan ujian Anda telah berakhir. Sistem secara otomatis mengumpulkan jawaban terakhir Anda.
          </DialogDescription>
        </DialogHeader>
        <div className="text-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">Sedang memproses hasil ujian...</p>
        </div>
      </Dialog>
    </div>
  );
}
