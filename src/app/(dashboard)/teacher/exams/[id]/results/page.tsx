"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  BarChart3,
  Download,
  CheckCircle2,
  Clock,
  ArrowLeft,
  FileSpreadsheet,
  Award,
  Edit,
  Save,
  Sparkles,
  Users,
  Search,
} from "lucide-react";
import { toast } from "sonner";

export default function ExamResultsPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params?.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);

  // Grade Modal State
  const [gradingAnswer, setGradingAnswer] = useState<any>(null);
  const [gradingStudent, setGradingStudent] = useState<any>(null);
  const [awardedPoints, setAwardedPoints] = useState<number | string>("");
  const [feedback, setFeedback] = useState("");
  const [isSavingGrade, setIsSavingGrade] = useState(false);

  const fetchResults = async () => {
    try {
      const res = await fetch(`/api/v1/teacher/exams/${examId}/results`);
      const resData = await res.json();
      if (resData.success) {
        setData(resData.data);
      } else {
        toast.error(resData.error?.message || "Gagal memuat hasil ujian.");
      }
    } catch {
      toast.error("Gagal memuat data hasil.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [examId]);

  const handlePublishResults = async () => {
    if (!confirm("Publikasikan hasil ujian ini sekarang? Murid akan dapat melihat nilai mereka.")) return;
    setIsPublishing(true);
    try {
      const res = await fetch(`/api/v1/teacher/exams/${examId}/publish-results`, { method: "POST" });
      const resData = await res.json();
      if (resData.success) {
        toast.success(resData.message);
        fetchResults();
      } else {
        toast.error(resData.error?.message || "Gagal memublikasikan nilai.");
      }
    } catch {
      toast.error("Terjadi kesalahan.");
    } finally {
      setIsPublishing(false);
    }
  };

  const openGradingModal = (student: any, answer: any) => {
    setGradingStudent(student);
    setGradingAnswer(answer);
    setAwardedPoints(answer.awardedPoints !== null ? answer.awardedPoints : "");
    setFeedback(answer.feedback || "");
  };

  const handleSaveGrade = async () => {
    if (awardedPoints === "" || isNaN(Number(awardedPoints))) {
      toast.error("Masukkan poin nilai yang valid.");
      return;
    }

    setIsSavingGrade(true);
    try {
      const res = await fetch(`/api/v1/teacher/answers/${gradingAnswer.id}/grade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          awardedPoints: parseFloat(String(awardedPoints)),
          feedback: feedback.trim(),
        }),
      });

      const resData = await res.json();
      if (resData.success) {
        toast.success("Nilai esai berhasil disimpan!");
        setGradingAnswer(null);
        fetchResults();
      } else {
        toast.error(resData.error?.message || "Gagal menyimpan nilai esai.");
      }
    } catch {
      toast.error("Terjadi kesalahan saat menyimpan nilai.");
    } finally {
      setIsSavingGrade(false);
    }
  };

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-xs text-muted-foreground">Memuat hasil dan rekap nilai ujian...</p>
      </div>
    );
  }

  const { exam, stats, participants } = data;

  const filteredParticipants = participants.filter((p: any) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.className.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/teacher/exams" className="text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1">
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Daftar Ujian</span>
            </Link>
            <span className="text-muted-foreground">•</span>
            <Badge variant="outline" className="text-xs font-mono">{exam.examCode}</Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Hasil & Rekap Nilai Ujian</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{exam.title} ({exam.subjectName})</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Publish Results Button */}
          {exam.resultVisibility !== "IMMEDIATE" && (
            <Button
              variant="outline"
              size="sm"
              isLoading={isPublishing}
              onClick={handlePublishResults}
              className="gap-1.5 text-xs font-semibold border-primary text-primary hover:bg-primary/10"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Publikasikan Nilai</span>
            </Button>
          )}

          {/* Export Excel Button (FR-023) */}
          <a href={`/api/v1/teacher/exams/${examId}/export`} download>
            <Button size="sm" className="gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 shadow">
              <FileSpreadsheet className="h-4 w-4" />
              <span>Unduh Rekap Excel (.xlsx)</span>
            </Button>
          </a>
        </div>
      </div>

      {/* Stats KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 shadow-sm border-border bg-card">
          <span className="text-xs font-semibold text-muted-foreground uppercase">Peserta Mengerjakan</span>
          <p className="text-2xl font-extrabold text-foreground mt-1">{stats.totalParticipants} Murid</p>
        </Card>
        <Card className="p-4 shadow-sm border-border bg-card">
          <span className="text-xs font-semibold text-muted-foreground uppercase">Rata-rata Nilai</span>
          <p className="text-2xl font-extrabold text-primary mt-1">{stats.averageScore}</p>
        </Card>
        <Card className="p-4 shadow-sm border-border bg-card">
          <span className="text-xs font-semibold text-muted-foreground uppercase">Nilai Tertinggi</span>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1">{stats.highestScore}</p>
        </Card>
        <Card className="p-4 shadow-sm border-border bg-card">
          <span className="text-xs font-semibold text-muted-foreground uppercase">Menunggu Koreksi Esai</span>
          <p className="text-2xl font-extrabold text-purple-600 mt-1">{stats.pendingGradingCount} Peserta</p>
        </Card>
      </div>

      {/* Search Bar */}
      <div className="flex justify-between items-center">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama murid atau kelas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 text-xs"
          />
        </div>

        <div className="text-xs text-muted-foreground font-semibold">
          Metode Nilai Akhir: <span className="text-foreground font-bold">{exam.gradingMethod}</span>
        </div>
      </div>

      {/* Participants & Attempts Table */}
      <div className="space-y-4">
        {filteredParticipants.length === 0 ? (
          <Card className="p-12 text-center text-muted-foreground text-sm">
            Belum ada hasil pengerjaan peserta untuk ujian ini.
          </Card>
        ) : (
          filteredParticipants.map((p: any) => (
            <Card key={p.studentId} className="p-5 shadow-sm border-border space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                    {p.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground leading-tight">{p.name}</h3>
                    <p className="text-xs text-muted-foreground font-medium">
                      Kelas {p.className} • {p.totalAttempts}x Percobaan
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                      Nilai Akhir:
                    </span>
                    <span className="text-2xl font-black text-primary">
                      {p.finalScore !== null ? p.finalScore : 0}
                    </span>
                  </div>
                  {p.gradingStatus === "GRADED" ? (
                    <Badge variant="success" className="text-xs">Selesai Dinilai</Badge>
                  ) : (
                    <Badge variant="warning" className="text-xs">Menunggu Koreksi</Badge>
                  )}
                </div>
              </div>

              {/* Attempts breakdown */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Rincian Percobaan & Jawaban:
                </h4>

                {p.attempts.map((att: any) => (
                  <div key={att.id} className="rounded-xl bg-slate-50 dark:bg-slate-900 p-4 border border-border space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-foreground">
                        Percobaan #{att.attemptNumber} — Nilai: <strong>{att.finalScore ?? 0}</strong> ({att.earnedPoints}/{att.maxPoints} Poin)
                      </span>
                      <span className="text-muted-foreground">
                        Selesai: {att.submittedAt ? new Date(att.submittedAt).toLocaleTimeString("id-ID") : "-"}
                      </span>
                    </div>

                    {/* Answers List */}
                    <div className="space-y-2 pt-1">
                      {att.answers.map((ans: any, aIdx: number) => {
                        const isEssay = ans.questionType === "ESSAY";
                        const isGraded = ans.awardedPoints !== null && ans.awardedPoints !== undefined;

                        return (
                          <div
                            key={ans.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg bg-background border border-border text-xs"
                          >
                            <div className="flex-1">
                              <span className="font-semibold text-foreground mr-2">
                                #{aIdx + 1} ({isEssay ? "Esai" : "Pilihan"}):
                              </span>
                              <span className="text-muted-foreground line-clamp-1">{ans.questionText}</span>
                              <div className="mt-1">
                                {isEssay ? (
                                  <p className="text-foreground italic bg-muted/40 p-1.5 rounded">
                                    &ldquo;{ans.answerText || "(Tidak dijawab)"}&rdquo;
                                  </p>
                                ) : (
                                  <p className="text-foreground">
                                    Pilihan Murid: <strong>{ans.selectedOptionText || "-"}</strong>
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                              <span className="font-bold text-foreground">
                                {isGraded ? `${ans.awardedPoints} / ${ans.points} Poin` : `? / ${ans.points} Poin`}
                              </span>
                              {isEssay && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openGradingModal(p, ans)}
                                  className="h-7 text-[11px] gap-1 font-semibold"
                                >
                                  <Edit className="h-3 w-3" />
                                  <span>{isGraded ? "Koreksi Ulang" : "Beri Nilai"}</span>
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Grade Essay Modal */}
      <Dialog open={Boolean(gradingAnswer)} onOpenChange={() => setGradingAnswer(null)}>
        <DialogHeader>
          <DialogTitle>Koreksi & Penilaian Jawaban Esai</DialogTitle>
          <DialogDescription>
            Peserta: <strong>{gradingStudent?.name}</strong> (Kelas {gradingStudent?.className})
          </DialogDescription>
        </DialogHeader>

        {gradingAnswer && (
          <div className="space-y-4 my-2 text-xs">
            {/* Question prompt */}
            <div className="rounded-xl bg-slate-50 dark:bg-slate-900 p-3 border border-border">
              <span className="font-bold text-muted-foreground uppercase text-[10px] block mb-1">
                Pertanyaan Soal (Bobot Maksimal: {gradingAnswer.points} Poin):
              </span>
              <p className="text-sm font-medium text-foreground">{gradingAnswer.questionText}</p>
            </div>

            {/* Student's answer */}
            <div className="rounded-xl bg-blue-50/50 dark:bg-blue-950/30 p-3 border border-blue-200 dark:border-blue-900">
              <span className="font-bold text-blue-900 dark:text-blue-300 uppercase text-[10px] block mb-1">
                Jawaban Murid:
              </span>
              <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">
                {gradingAnswer.answerText || "(Murid tidak mengisi jawaban esai ini)"}
              </p>
            </div>

            {/* Award points input */}
            <div>
              <label className="block font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Poin Nilai yang Diberikan (0 s/d {gradingAnswer.points}) <span className="text-destructive">*</span>
              </label>
              <Input
                type="number"
                min={0}
                max={gradingAnswer.points}
                step={0.5}
                value={awardedPoints}
                onChange={(e) => setAwardedPoints(e.target.value)}
                placeholder={`Maksimal ${gradingAnswer.points}`}
                className="h-10 text-sm font-bold"
                autoFocus
              />
            </div>

            {/* Teacher feedback */}
            <div>
              <label className="block font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Catatan / Umpan Balik untuk Murid (Opsional)
              </label>
              <Textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Tuliskan catatan evaluasi jawaban ini..."
                rows={2}
                className="text-xs"
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setGradingAnswer(null)}>
            Batal
          </Button>
          <Button onClick={handleSaveGrade} isLoading={isSavingGrade} className="font-bold bg-primary">
            Simpan Nilai
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
