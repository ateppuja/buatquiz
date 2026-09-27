"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
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
  Volume2,
  VolumeX,
  Headphones,
  Square,
  Sparkles,
  Award,
  Layers,
  Check,
  X,
  Flag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { sounds } from "@/lib/sound-effects";
import { narrator } from "@/lib/tts-narrator";
import { ConfettiCanvas } from "@/components/ui/confetti";

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

  // Active filter category: 'ALL' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'ESSAY' | 'FLAGGED'
  const [activeFilter, setActiveFilter] = useState<string>("ALL");

  // Answers state: { [questionId]: { selectedOptionId?: string; answerText?: string; revision: number } }
  const [answers, setAnswers] = useState<Record<string, { selectedOptionId: string | null; answerText: string | null; revision: number }>>({});
  // Flagged questions for review
  const [flagged, setFlagged] = useState<Record<string, boolean>>({});

  // Autosave status: 'saved' | 'saving' | 'error'
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "error">("saved");

  // Timer state
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  // Sound enabled
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Audio Question Narrator (TTS)
  const [isNarrating, setIsNarrating] = useState<boolean>(false);

  // Modals
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showTimeExpiredDialog, setShowTimeExpiredDialog] = useState(false);
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  const [showMobileGrid, setShowMobileGrid] = useState(false);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize sound state & narrator listener
  useEffect(() => {
    setSoundEnabled(sounds.isEnabled());
    narrator.onStateChange((speaking) => {
      setIsNarrating(speaking);
    });

    return () => {
      narrator.stop();
    };
  }, []);

  const toggleSound = () => {
    const next = sounds.toggle();
    setSoundEnabled(next);
    toast.info(next ? "Suara diaktifkan 🔊" : "Suara dimatikan 🔇", { duration: 1500 });
  };

  const toggleNarrator = () => {
    if (isNarrating) {
      narrator.stop();
      toast.info("Pembacaan soal dihentikan ⏹️", { duration: 1500 });
    } else {
      narrator.speakQuestion(currentIdx + 1, currentQ.questionText, currentQ.options);
      toast.info("Membacakan soal... 🔊", { duration: 1500 });
    }
  };

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

  // Keyboard navigation shortcuts (ArrowLeft / ArrowRight)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't navigate if user is actively typing in a textarea or input
      if (
        document.activeElement?.tagName === "TEXTAREA" ||
        document.activeElement?.tagName === "INPUT"
      ) {
        return;
      }

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goToPrevQuestion();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goToNextQuestion();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIdx, questions.length]);

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

    sounds.playSelect();

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
    sounds.playFlag();
    setFlagged((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  // Question navigation with audio
  const goToQuestion = (idx: number) => {
    if (idx < 0 || idx >= questions.length || idx === currentIdx) return;
    narrator.stop();
    sounds.playNavigate();
    setCurrentIdx(idx);
  };

  const goToPrevQuestion = () => {
    if (currentIdx > 0) {
      goToQuestion(currentIdx - 1);
    }
  };

  const goToNextQuestion = () => {
    if (currentIdx < questions.length - 1) {
      goToQuestion(currentIdx + 1);
    }
  };

  // 7. Submit Handlers
  const handleAutoSubmit = async () => {
    narrator.stop();
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
    narrator.stop();
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
      sounds.playCelebrate();
      setShowCelebration(true);
      toast.success("Ujian berhasil dikumpulkan!");
      setTimeout(() => {
        router.push(`/exam/${code}/result`);
      }, 1800);
    } catch {
      toast.error("Terjadi kesalahan saat mengumpulkan ujian.");
      setIsSubmitting(false);
    }
  };

  if (isLoading || !attemptData || questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#EBF7D9] via-[#F4FBEB] to-[#EFFDF4]">
        <div className="text-center space-y-4 bg-white/90 backdrop-blur-md p-8 rounded-3xl shadow-xl border border-white">
          <div className="relative flex items-center justify-center">
            <div className="h-16 w-16 rounded-2xl overflow-hidden bg-white p-1 shadow-md border border-[#E0F2C2] mx-auto">
              <img
                src="/whitebee-logo.png"
                alt="White Bee Logo"
                className="h-full w-full object-contain"
              />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-800">Menyiapkan Ruang Ujian Ceria</h3>
            <p className="text-xs font-bold text-[#578A1A] mt-1">White Bee School of Life</p>
          </div>
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
  const flaggedCount = Object.values(flagged).filter(Boolean).length;

  // Breakdown for timer flip boxes
  const hours = Math.floor(timeRemaining / 3600);
  const totalMins = Math.floor((timeRemaining % 3600) / 60);
  const secs = timeRemaining % 60;

  const minStr = String(totalMins).padStart(2, "0");
  const secStr = String(secs).padStart(2, "0");

  // Category counts
  const mcqCount = questions.filter((q) => q.type === "MULTIPLE_CHOICE").length;
  const tfCount = questions.filter((q) => q.type === "TRUE_FALSE").length;
  const essayCount = questions.filter((q) => q.type === "ESSAY").length;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#DDF3FD] via-[#E5F7FD] to-[#EAF9EC] text-slate-800 select-none relative overflow-x-hidden font-sans pb-8">
      {showCelebration && <ConfettiCanvas duration={3500} />}

      {/* Decorative Cloud & Bubble Background Accents */}
      <div className="absolute top-4 left-8 w-32 h-14 bg-white/40 rounded-full blur-sm pointer-events-none" />
      <div className="absolute top-12 right-12 w-44 h-16 bg-white/35 rounded-full blur-sm pointer-events-none" />
      <div className="absolute bottom-16 left-1/4 w-56 h-20 bg-[#7AB82A]/15 rounded-full blur-xl pointer-events-none" />

      {/* TOP FLOATING APP BAR */}
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 pt-3 sm:pt-5 pb-2">
        <div className="flex items-center justify-between gap-2">
          {/* Brand & Mascot Badge */}
          <div className="flex items-center gap-2.5 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-2xl shadow-sm border border-white">
            <div className="relative h-8 w-8 shrink-0 rounded-xl overflow-hidden bg-white p-0.5 border border-[#E0F2C2] shadow-xs">
              <img
                src="/whitebee-logo.png"
                alt="White Bee Logo"
                className="h-full w-full object-contain"
              />
            </div>
            <div className="leading-tight hidden sm:block">
              <span className="font-black text-xs tracking-tight text-slate-900 block">
                White<span className="text-[#7AB82A]">Bee</span>
              </span>
              <span className="text-[10px] font-bold text-[#578A1A] block">
                {attemptData.exam.title}
              </span>
            </div>
          </div>

          {/* Student Info & Audio Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleSound}
              title={soundEnabled ? "Matikan Suara" : "Nyalakan Suara"}
              className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/90 backdrop-blur-md text-slate-700 hover:text-primary hover:bg-white shadow-sm border border-white/80 transition-all active:scale-90"
            >
              {soundEnabled ? (
                <Volume2 className="h-4 w-4 text-emerald-600" />
              ) : (
                <VolumeX className="h-4 w-4 text-slate-400" />
              )}
            </button>

            <button
              onClick={() => setShowHelpDialog(true)}
              title="Petunjuk & Bantuan Ujian"
              className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/90 backdrop-blur-md text-slate-700 hover:text-primary hover:bg-white shadow-sm border border-white/80 transition-all active:scale-90"
            >
              <HelpCircle className="h-4 w-4 text-[#00C0FA]" />
            </button>

            <div className="flex items-center gap-2 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-2xl shadow-sm border border-white/80">
              <div className="h-6 w-6 rounded-lg bg-[#00C0FA]/15 flex items-center justify-center text-[#0093BE]">
                <User className="h-3.5 w-3.5" />
              </div>
              <div className="text-left hidden md:block">
                <span className="text-xs font-bold text-slate-800 leading-none block">
                  {attemptData.student.name}
                </span>
                <span className="text-[10px] font-semibold text-slate-500">
                  Kelas {attemptData.student.className}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN GAMIFIED CONSOLE CARD (Inspired by Reference Design) */}
      <div className="flex-1 flex flex-col max-w-7xl w-full mx-auto px-2 sm:px-6 pt-1 sm:pt-3">
        <div className="rounded-[28px] sm:rounded-[40px] md:rounded-[48px] bg-gradient-to-r from-[#00C0FA] via-[#00B4D8] to-[#80D235] p-2.5 sm:p-5 shadow-2xl border-4 border-white/70 relative flex flex-col flex-1">
          
          {/* FLOATING TOP CONSOLE HEADER: [Question Progress] | [DIGITAL FLIP TIMER & SUBMIT] | [AUTOSAVE STATUS] */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3 sm:mb-5 px-1 sm:px-2">
            
            {/* Left Pill: Question Number & Progress Badge */}
            <div className="flex items-center gap-2 bg-white/95 backdrop-blur-md px-4 py-2 rounded-2xl shadow-md border border-white">
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-tr from-[#00C0FA] to-[#0093BE] text-white font-black text-xs shadow-sm">
                {currentIdx + 1}
              </div>
              <div className="text-xs font-bold text-slate-800">
                <span>Soal {currentIdx + 1}</span>
                <span className="text-slate-400 font-normal"> / {questions.length}</span>
              </div>
              <div className="hidden sm:flex items-center gap-1 ml-2 pl-2 border-l border-slate-200 text-[11px] font-bold text-emerald-600">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>{answeredCount} Terjawab</span>
              </div>
            </div>

            {/* Center: Digital Flip-Card Timer & Submit Pill */}
            <div className="flex items-center gap-2 sm:gap-3 mx-auto sm:mx-0">
              {/* Digit Flip Boxes */}
              <div
                className={cn(
                  "flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-1.5 rounded-2xl bg-white/95 backdrop-blur-md shadow-md border border-white transition-all",
                  timeRemaining <= 300 && "ring-2 ring-red-400 animate-pulse bg-red-50/95"
                )}
              >
                <Timer
                  className={cn(
                    "h-4 w-4 mr-0.5 sm:mr-1",
                    timeRemaining <= 300 ? "text-red-500 animate-spin" : "text-[#00B4D8]"
                  )}
                />
                {hours > 0 && (
                  <>
                    <div className="flex items-center justify-center h-8 w-6 sm:h-9 sm:w-7 rounded-lg bg-slate-100 text-slate-800 font-mono font-black text-base sm:text-lg shadow-inner border border-slate-200/80">
                      {hours}
                    </div>
                    <span className="font-mono font-black text-slate-500 text-sm">:</span>
                  </>
                )}
                {/* Min digits */}
                <div className="flex items-center justify-center h-8 w-6 sm:h-9 sm:w-7 rounded-lg bg-slate-100 text-slate-800 font-mono font-black text-base sm:text-lg shadow-inner border border-slate-200/80">
                  {minStr[0]}
                </div>
                <div className="flex items-center justify-center h-8 w-6 sm:h-9 sm:w-7 rounded-lg bg-slate-100 text-slate-800 font-mono font-black text-base sm:text-lg shadow-inner border border-slate-200/80">
                  {minStr[1]}
                </div>

                <span className="font-mono font-black text-slate-400 text-base animate-pulse">:</span>

                {/* Sec digits */}
                <div className="flex items-center justify-center h-8 w-6 sm:h-9 sm:w-7 rounded-lg bg-slate-100 text-slate-800 font-mono font-black text-base sm:text-lg shadow-inner border border-slate-200/80">
                  {secStr[0]}
                </div>
                <div className="flex items-center justify-center h-8 w-6 sm:h-9 sm:w-7 rounded-lg bg-slate-100 text-slate-800 font-mono font-black text-base sm:text-lg shadow-inner border border-slate-200/80">
                  {secStr[1]}
                </div>
              </div>

              {/* Submit / Selesai Button */}
              <button
                type="button"
                onClick={() => setShowSubmitDialog(true)}
                className="flex items-center gap-1.5 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-2xl bg-[#80D235] hover:bg-[#72BE2E] active:scale-95 text-white font-black text-xs sm:text-sm shadow-lg border-2 border-white/80 transition-all"
              >
                <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>Kumpulkan</span>
              </button>
            </div>

            {/* Right: Autosave Status & Mobile Grid Trigger */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-md border border-white text-xs font-semibold">
                {saveStatus === "saving" && (
                  <span className="flex items-center gap-1.5 text-amber-600">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span className="hidden sm:inline">Menyimpan...</span>
                  </span>
                )}
                {saveStatus === "saved" && (
                  <span className="flex items-center gap-1.5 text-emerald-600">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Tersimpan</span>
                  </span>
                )}
                {saveStatus === "error" && (
                  <span className="flex items-center gap-1.5 text-red-500">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Gagal Simpan</span>
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => setShowMobileGrid(true)}
                className="lg:hidden flex items-center justify-center h-9 w-9 rounded-2xl bg-white/95 text-slate-700 shadow-md border border-white active:scale-90"
                title="Buka Nomor Soal"
              >
                <Grid className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* INNER WORKSPACE: Category Pills + Center Card + Floating Arrows */}
          <div className="flex-1 flex flex-col justify-between relative">
            
            {/* Left/Top Filter Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-2 scrollbar-none px-1">
              <button
                type="button"
                onClick={() => setActiveFilter("ALL")}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl font-bold text-xs shadow-sm transition-all whitespace-nowrap",
                  activeFilter === "ALL"
                    ? "bg-white text-slate-800 shadow-md scale-105"
                    : "bg-white/40 hover:bg-white/60 text-white font-medium"
                )}
              >
                Semua Soal ({questions.length})
              </button>

              {mcqCount > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveFilter("MULTIPLE_CHOICE")}
                  className={cn(
                    "px-3.5 py-1.5 rounded-xl font-bold text-xs shadow-sm transition-all whitespace-nowrap",
                    activeFilter === "MULTIPLE_CHOICE"
                      ? "bg-white text-slate-800 shadow-md scale-105"
                      : "bg-white/40 hover:bg-white/60 text-white font-medium"
                  )}
                >
                  Pilihan Ganda ({mcqCount})
                </button>
              )}

              {tfCount > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveFilter("TRUE_FALSE")}
                  className={cn(
                    "px-3.5 py-1.5 rounded-xl font-bold text-xs shadow-sm transition-all whitespace-nowrap",
                    activeFilter === "TRUE_FALSE"
                      ? "bg-white text-slate-800 shadow-md scale-105"
                      : "bg-white/40 hover:bg-white/60 text-white font-medium"
                  )}
                >
                  Benar / Salah ({tfCount})
                </button>
              )}

              {essayCount > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveFilter("ESSAY")}
                  className={cn(
                    "px-3.5 py-1.5 rounded-xl font-bold text-xs shadow-sm transition-all whitespace-nowrap",
                    activeFilter === "ESSAY"
                      ? "bg-white text-slate-800 shadow-md scale-105"
                      : "bg-white/40 hover:bg-white/60 text-white font-medium"
                  )}
                >
                  Uraian ({essayCount})
                </button>
              )}

              {/* RAGU-RAGU PILL (Special Orange Accent) */}
              <button
                type="button"
                onClick={() => toggleFlag(currentQ.id)}
                className={cn(
                  "ml-auto flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold text-xs shadow-md transition-all whitespace-nowrap active:scale-95",
                  isFlagged
                    ? "bg-[#F97316] text-white ring-2 ring-white"
                    : "bg-[#FB923C]/80 hover:bg-[#F97316] text-white"
                )}
              >
                <Flag className="h-3.5 w-3.5" />
                <span>{isFlagged ? "🚩 Ditandai Ragu" : "Ragu-ragu"}</span>
                {flaggedCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full bg-white/30 text-[10px]">
                    {flaggedCount}
                  </span>
                )}
              </button>
            </div>

            {/* QUESTION CARD WITH LEFT & RIGHT ARROWS */}
            <div className="relative flex items-center w-full my-auto py-1">
              {/* Left Arrow Button */}
              <button
                type="button"
                disabled={currentIdx === 0}
                onClick={goToPrevQuestion}
                aria-label="Soal Sebelumnya"
                className={cn(
                  "hidden sm:flex absolute -left-4 md:-left-6 z-20 h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-full bg-white shadow-2xl border-2 border-slate-100 text-[#0093BE] hover:text-[#80D235] hover:scale-110 active:scale-95 transition-all",
                  currentIdx === 0 && "opacity-40 cursor-not-allowed hover:scale-100"
                )}
              >
                <ChevronLeft className="h-7 w-7 stroke-[3]" />
              </button>

              {/* Main Crisp White Question Card */}
              <div className="w-full bg-white rounded-[24px] sm:rounded-[36px] p-5 sm:p-8 md:p-10 shadow-xl border border-slate-100 flex flex-col justify-between min-h-[360px] sm:min-h-[420px]">
                
                <div>
                  {/* Top Question Info Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3.5 mb-5">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-[#00C0FA] to-[#80D235] text-white font-black text-sm shadow-sm">
                        {currentIdx + 1}
                      </span>
                      <span className="font-extrabold text-sm text-slate-800 tracking-tight">
                        Soal Nomor {currentIdx + 1}
                      </span>
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {currentQ.type === "MULTIPLE_CHOICE"
                          ? "Pilihan Ganda"
                          : currentQ.type === "TRUE_FALSE"
                          ? "Benar / Salah"
                          : "Uraian / Esai"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={toggleNarrator}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs shadow-sm transition-all active:scale-95 cursor-pointer",
                          isNarrating
                            ? "bg-amber-500 text-white animate-pulse ring-2 ring-amber-300"
                            : "bg-[#EBF7D9] text-[#4B7914] hover:bg-[#D5EFA9] border border-[#D5EFA9]"
                        )}
                        title={isNarrating ? "Hentikan pembacaan audio" : "Bacakan soal dan pilihan jawaban"}
                      >
                        {isNarrating ? (
                          <>
                            <Square className="h-3.5 w-3.5 fill-current" />
                            <span>Hentikan Suara</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="h-3.5 w-3.5" />
                            <span>Bacakan Soal</span>
                          </>
                        )}
                      </button>

                      <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                        💎 {currentQ.points} Poin
                      </span>
                    </div>
                  </div>

                  {/* Question Text Prompt */}
                  <div className="text-base sm:text-lg md:text-xl font-bold text-slate-800 mb-6 leading-relaxed whitespace-pre-line">
                    {currentQ.questionText}
                  </div>

                  {/* Question Image */}
                  {currentQ.questionImage && (
                    <div className="mb-6 max-w-lg mx-auto rounded-2xl overflow-hidden border-2 border-slate-100 shadow-md bg-slate-50">
                      <img
                        src={currentQ.questionImage}
                        alt="Ilustrasi Soal"
                        className="w-full h-auto object-contain max-h-72"
                      />
                    </div>
                  )}

                  {/* MULTIPLE CHOICE: 2x2 Joyful Grid Option Buttons */}
                  {currentQ.type === "MULTIPLE_CHOICE" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4 mt-4">
                      {currentQ.options.map((opt) => {
                        const isSelected = currentAns?.selectedOptionId === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => handleSelectOption(opt.id)}
                            className={cn(
                              "w-full flex items-center gap-3.5 p-3.5 sm:p-4 rounded-2xl border-2 text-left transition-all duration-200 active:scale-98 cursor-pointer shadow-sm group",
                              isSelected
                                ? "bg-[#80D235] hover:bg-[#77C630] border-[#6EBB2C] text-white shadow-lg scale-[1.01] ring-4 ring-[#80D235]/25"
                                : "bg-[#EEFADC] hover:bg-[#E3F8C5] border-[#D4F1A5] text-slate-800"
                            )}
                          >
                            <div
                              className={cn(
                                "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-black text-sm uppercase shadow-sm transition-all",
                                isSelected
                                  ? "bg-white text-[#569818]"
                                  : "bg-white text-[#569818] group-hover:scale-105"
                              )}
                            >
                              {opt.key}
                            </div>
                            <span
                              className={cn(
                                "text-sm sm:text-base font-semibold leading-relaxed",
                                isSelected ? "text-white" : "text-slate-800"
                              )}
                            >
                              {opt.text}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* TRUE / FALSE: 2 Large Joyful Cards */}
                  {currentQ.type === "TRUE_FALSE" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 max-w-2xl mx-auto">
                      {currentQ.options.map((opt) => {
                        const isSelected = currentAns?.selectedOptionId === opt.id;
                        const isBenar = opt.text.toLowerCase().includes("benar");
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => handleSelectOption(opt.id)}
                            className={cn(
                              "flex items-center justify-center gap-3 p-5 sm:p-6 rounded-2xl border-2 text-base sm:text-lg font-black transition-all duration-200 active:scale-95 shadow-md",
                              isSelected
                                ? isBenar
                                  ? "bg-[#80D235] border-[#6EBB2C] text-white ring-4 ring-[#80D235]/30 shadow-lg scale-105"
                                  : "bg-[#F43F5E] border-[#E11D48] text-white ring-4 ring-rose-300 shadow-lg scale-105"
                                : isBenar
                                ? "bg-[#EEFADC] hover:bg-[#E3F8C5] border-[#D4F1A5] text-slate-800"
                                : "bg-rose-50 hover:bg-rose-100/80 border-rose-200 text-slate-800"
                            )}
                          >
                            {isBenar ? (
                              <Check className="h-6 w-6 stroke-[3]" />
                            ) : (
                              <X className="h-6 w-6 stroke-[3]" />
                            )}
                            <span>{opt.text}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* ESSAY: Clean Textarea with Autosave status */}
                  {currentQ.type === "ESSAY" && (
                    <div className="space-y-2 mt-4">
                      <Textarea
                        value={currentAns?.answerText || ""}
                        onChange={(e) => handleEssayChange(e.target.value)}
                        placeholder="Ketik jawaban lengkap dan rapi Anda di sini..."
                        rows={7}
                        className="w-full text-base sm:text-lg p-4 leading-relaxed resize-y focus-visible:ring-[#00C0FA] border-2 border-slate-200 rounded-2xl bg-slate-50 focus:bg-white transition-all font-sans"
                      />
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-500 px-1">
                        <span className="flex items-center gap-1 text-emerald-600">
                          <Sparkles className="h-3.5 w-3.5" />
                          Jawaban tersimpan otomatis saat Anda berhenti mengetik.
                        </span>
                        <span>{(currentAns?.answerText || "").length} Karakter</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Mobile Prev/Next Inline Buttons */}
                <div className="flex sm:hidden items-center justify-between gap-3 pt-6 mt-6 border-t border-slate-100">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentIdx === 0}
                    onClick={goToPrevQuestion}
                    className="flex-1 font-bold rounded-xl"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Sebelumnya
                  </Button>

                  {currentIdx < questions.length - 1 ? (
                    <Button
                      size="sm"
                      onClick={goToNextQuestion}
                      className="flex-1 font-bold bg-[#00C0FA] hover:bg-[#00A8DE] rounded-xl text-white"
                    >
                      Selanjutnya
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => setShowSubmitDialog(true)}
                      className="flex-1 font-bold bg-[#80D235] hover:bg-[#72BE2E] rounded-xl text-white"
                    >
                      Kumpulkan
                    </Button>
                  )}
                </div>
              </div>

              {/* Right Arrow Button */}
              <button
                type="button"
                disabled={currentIdx === questions.length - 1}
                onClick={goToNextQuestion}
                aria-label="Soal Selanjutnya"
                className={cn(
                  "hidden sm:flex absolute -right-4 md:-right-6 z-20 h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-full bg-white shadow-2xl border-2 border-slate-100 text-[#0093BE] hover:text-[#80D235] hover:scale-110 active:scale-95 transition-all",
                  currentIdx === questions.length - 1 && "opacity-40 cursor-not-allowed hover:scale-100"
                )}
              >
                <ChevronRight className="h-7 w-7 stroke-[3]" />
              </button>
            </div>

            {/* BOTTOM HORIZONTAL QUESTION MATRIX / PALETTE STRIP */}
            <div className="mt-3 sm:mt-4 pt-2">
              <div className="flex items-center gap-2 overflow-x-auto py-2 px-1 scrollbar-thin scrollbar-thumb-white/40">
                {questions.map((q, idx) => {
                  const ans = answers[q.id];
                  const isAnswered =
                    Boolean(ans?.selectedOptionId) ||
                    (Boolean(ans?.answerText) && ans.answerText!.trim().length > 0);
                  const isFlag = Boolean(flagged[q.id]);
                  const isCurrent = idx === currentIdx;

                  // Filter check
                  if (activeFilter === "MULTIPLE_CHOICE" && q.type !== "MULTIPLE_CHOICE") return null;
                  if (activeFilter === "TRUE_FALSE" && q.type !== "TRUE_FALSE") return null;
                  if (activeFilter === "ESSAY" && q.type !== "ESSAY") return null;
                  if (activeFilter === "FLAGGED" && !isFlag) return null;

                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => goToQuestion(idx)}
                      className={cn(
                        "relative flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl font-black text-xs sm:text-sm shadow-md transition-all active:scale-90",
                        isCurrent
                          ? "ring-4 ring-white shadow-2xl scale-110 -translate-y-0.5 z-10"
                          : "hover:scale-105",
                        isFlag
                          ? "bg-[#F97316] text-white border-2 border-white/60"
                          : isAnswered
                          ? "bg-[#80D235] text-white border-2 border-white/60"
                          : "bg-white/90 hover:bg-white text-slate-700 border border-slate-200/60"
                      )}
                    >
                      <span>{idx + 1}</span>
                      {isFlag && (
                        <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-white flex items-center justify-center shadow">
                          <span className="h-2 w-2 rounded-full bg-[#F97316]" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Palette Legend */}
              <div className="flex flex-wrap items-center justify-center gap-4 text-white text-[11px] font-bold mt-1">
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-md bg-[#80D235] shadow" />
                  <span>Sudah Terjawab ({answeredCount})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-md bg-[#F97316] shadow" />
                  <span>Ragu-ragu ({flaggedCount})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-md bg-white shadow text-slate-700" />
                  <span>Belum Terjawab ({unansweredCount})</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* MODAL: Question Matrix for Mobile Drawer */}
      <Dialog open={showMobileGrid} onOpenChange={setShowMobileGrid}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Grid className="h-5 w-5 text-[#00C0FA]" />
            <span>Daftar Nomor Soal</span>
          </DialogTitle>
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
                  goToQuestion(idx);
                  setShowMobileGrid(false);
                }}
                className={cn(
                  "relative flex h-12 w-full items-center justify-center rounded-xl font-bold text-sm transition-all",
                  isCurrent ? "ring-2 ring-[#00C0FA] ring-offset-2 scale-105 z-10" : "",
                  isFlag
                    ? "bg-[#F97316] text-white"
                    : isAnswered
                    ? "bg-[#80D235] text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
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

      {/* MODAL: Help / Tutorial Dialog (❓) */}
      <Dialog open={showHelpDialog} onOpenChange={setShowHelpDialog}>
        <DialogHeader>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#00C0FA]/10 text-[#00C0FA] mb-2 mx-auto">
            <HelpCircle className="h-6 w-6" />
          </div>
          <DialogTitle className="text-center text-xl font-bold">
            Petunjuk & Bantuan Ujian
          </DialogTitle>
          <DialogDescription className="text-center text-xs">
            Quiz White Bee School of Life
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2 text-xs sm:text-sm text-slate-600">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#80D235] text-white font-bold text-xs">
              ✓
            </span>
            <div>
              <p className="font-bold text-slate-800">Menjawab Soal</p>
              <p className="text-xs text-slate-500">
                Klik pada opsi jawaban (A, B, C, D, E) untuk memilih. Jawaban tersimpan otomatis ke server (Autosave).
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#F97316] text-white font-bold text-xs">
              🚩
            </span>
            <div>
              <p className="font-bold text-slate-800">Menandai Ragu-ragu</p>
              <p className="text-xs text-slate-500">
                Gunakan tombol "Ragu-ragu" di pojok kanan atas untuk menandai soal yang ingin ditinjau kembali sebelum dikumpulkan.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#00C0FA] text-white font-bold text-xs">
              ↔
            </span>
            <div>
              <p className="font-bold text-slate-800">Navigasi Soal</p>
              <p className="text-xs text-slate-500">
                Klik tombol panah di samping kiri/kanan atau gunakan tombol panah keyboard ← → untuk berpindah soal.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={() => setShowHelpDialog(false)}
            className="w-full bg-[#00C0FA] hover:bg-[#0093BE] font-bold text-white rounded-xl"
          >
            Mengerti, Lanjutkan Mengerjakan
          </Button>
        </DialogFooter>
      </Dialog>

      {/* MODAL: Submit Confirmation */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogHeader>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 mb-2 mx-auto">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <DialogTitle className="text-center text-xl font-bold text-slate-800">
            Kumpulkan Ujian Sekarang?
          </DialogTitle>
          <DialogDescription className="text-center text-xs">
            Pastikan Anda telah memeriksa kembali seluruh jawaban sebelum mengumpulkan.
          </DialogDescription>
        </DialogHeader>

        <div className="my-3 rounded-2xl bg-slate-50 p-4 border border-slate-100 space-y-2 text-xs">
          <div className="flex justify-between font-semibold">
            <span className="text-slate-500">Total Soal:</span>
            <span className="text-slate-800 font-bold">{questions.length} Butir</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span className="text-emerald-600">Sudah Terjawab:</span>
            <span className="text-emerald-600 font-bold">{answeredCount} Soal</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span className="text-rose-500">Belum Terjawab:</span>
            <span className="text-rose-500 font-bold">{unansweredCount} Soal</span>
          </div>
          {flaggedCount > 0 && (
            <div className="flex justify-between font-semibold">
              <span className="text-[#F97316]">Masih Ditandai Ragu:</span>
              <span className="text-[#F97316] font-bold">{flaggedCount} Soal</span>
            </div>
          )}
          {unansweredCount > 0 && (
            <p className="pt-2 text-rose-500 font-bold border-t border-slate-200">
              ⚠️ Terdapat {unansweredCount} soal yang belum Anda jawab.
            </p>
          )}
        </div>

        <DialogFooter className="sm:justify-between gap-2">
          <Button
            variant="outline"
            disabled={isSubmitting}
            onClick={() => setShowSubmitDialog(false)}
            className="w-full sm:w-auto rounded-xl font-semibold"
          >
            Periksa Lagi
          </Button>
          <Button
            onClick={handleManualSubmit}
            isLoading={isSubmitting}
            className="w-full sm:w-auto font-black bg-[#80D235] hover:bg-[#72BE2E] text-white rounded-xl shadow-md"
          >
            Ya, Kumpulkan Sekarang
          </Button>
        </DialogFooter>
      </Dialog>

      {/* MODAL: Time Expired */}
      <Dialog open={showTimeExpiredDialog} onOpenChange={() => {}}>
        <DialogHeader>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-600 mb-3 mx-auto">
            <Timer className="h-6 w-6" />
          </div>
          <DialogTitle className="text-center text-xl font-bold">Waktu Ujian Telah Habis</DialogTitle>
          <DialogDescription className="text-center text-xs">
            Waktu pengerjaan ujian Anda telah berakhir. Sistem secara otomatis mengumpulkan jawaban terakhir Anda.
          </DialogDescription>
        </DialogHeader>
        <div className="text-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-[#00C0FA] mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-medium">Sedang memproses hasil ujian...</p>
        </div>
      </Dialog>
    </div>
  );
}
