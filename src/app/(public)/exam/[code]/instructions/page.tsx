"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/layouts/Navbar";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Clock,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Play,
  ArrowLeft,
  User,
} from "lucide-react";
import { toast } from "sonner";

export default function ExamInstructionsPage() {
  const params = useParams();
  const router = useRouter();
  const code = (params?.code as string)?.toUpperCase();

  const [studentData, setStudentData] = useState<any>(null);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("exam_student_data");
    if (!raw) {
      toast.error("Silakan verifikasi identitas terlebih dahulu.");
      router.push(`/exam/${code}/identity`);
      return;
    }
    setStudentData(JSON.parse(raw));
  }, [code, router]);

  const handleStartExam = async () => {
    if (!studentData) return;

    setIsStarting(true);
    try {
      const res = await fetch(`/api/v1/student/exams/${studentData.exam.id}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: studentData.student.id,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.error?.message || "Gagal memulai sesi ujian.");
        setIsStarting(false);
        return;
      }

      sessionStorage.setItem("exam_active_attempt_id", data.data.attemptId);
      router.push(`/exam/${code}/attempt`);
    } catch {
      toast.error("Terjadi kesalahan saat memulai ujian.");
      setIsStarting(false);
    }
  };

  if (!studentData) return null;

  const gradingMethodLabel =
    studentData.exam.gradingMethod === "HIGHEST"
      ? "Nilai Tertinggi"
      : studentData.exam.gradingMethod === "LATEST"
      ? "Percobaan Terakhir"
      : "Rata-rata Seluruh Percobaan";

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      <Navbar />

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <Card className="w-full max-w-2xl shadow-xl border-slate-200 dark:border-slate-800">
          <CardHeader className="border-b border-border pb-5">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <span className="font-mono font-bold text-xs bg-primary/10 text-primary px-3 py-1 rounded-md">
                KODE: {studentData.exam.examCode}
              </span>
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <User className="h-4 w-4 text-primary" />
                <span>
                  {studentData.student.name} • Kelas {studentData.student.className}
                </span>
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">
              {studentData.exam.title}
            </CardTitle>
            <CardDescription>
              Harap membaca petunjuk pengerjaan di bawah ini dengan teliti sebelum memulai ujian.
            </CardDescription>
          </CardHeader>

          <CardContent className="py-6 space-y-6">
            {/* Exam Parameters Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-xl border border-border bg-slate-50 dark:bg-slate-900 p-4 text-center">
                <Clock className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">Durasi Pengerjaan</p>
                <p className="text-base font-bold text-foreground">{studentData.exam.durationMinutes} Menit</p>
              </div>

              <div className="rounded-xl border border-border bg-slate-50 dark:bg-slate-900 p-4 text-center">
                <RotateCcw className="h-5 w-5 text-emerald-600 mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">Sisa Percobaan</p>
                <p className="text-base font-bold text-foreground">
                  {studentData.remainingAttempts} dari {studentData.exam.maxAttempts}x
                </p>
              </div>

              <div className="rounded-xl border border-border bg-slate-50 dark:bg-slate-900 p-4 text-center">
                <CheckCircle2 className="h-5 w-5 text-indigo-600 mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">Metode Nilai Akhir</p>
                <p className="text-base font-bold text-foreground text-xs sm:text-sm mt-0.5">{gradingMethodLabel}</p>
              </div>
            </div>

            {/* Custom Instructions */}
            {studentData.exam.instructions && (
              <div className="rounded-xl bg-blue-50/70 dark:bg-blue-950/40 p-4 border border-blue-100 dark:border-blue-900">
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-300 mb-1.5 flex items-center gap-1.5">
                  <FileText className="h-4 w-4" />
                  Instruksi Khusus dari Guru:
                </h4>
                <p className="text-sm text-blue-950 dark:text-blue-200 whitespace-pre-line leading-relaxed">
                  {studentData.exam.instructions}
                </p>
              </div>
            )}

            {/* Rules Checklist */}
            <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
              <p className="font-semibold text-foreground text-sm">Ketentuan Pelaksanaan Ujian:</p>
              <ul className="space-y-2 list-disc list-inside">
                <li>Waktu pengerjaan akan mulai berjalan otomatis begitu tombol <strong>Mulai Ujian</strong> ditekan.</li>
                <li>Setiap jawaban yang Anda pilih atau ketik akan disimpan secara otomatis (<strong>Autosave</strong>) ke server.</li>
                <li>Jika koneksi internet terputus atau halaman termuat ulang (refresh), Anda dapat langsung melanjutkan pengerjaan selama batas waktu belum habis.</li>
                <li>Pastikan memeriksa kembali seluruh jawaban sebelum menekan tombol <strong>Selesaikan Ujian</strong>.</li>
              </ul>
            </div>
          </CardContent>

          <CardFooter className="border-t border-border pt-4 flex flex-col sm:flex-row justify-between gap-3">
            <Button
              variant="outline"
              onClick={() => router.push(`/exam/${code}/identity`)}
              className="w-full sm:w-auto gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Ganti Identitas</span>
            </Button>

            <Button
              onClick={handleStartExam}
              size="lg"
              isLoading={isStarting}
              className="w-full sm:w-auto font-bold gap-2 px-8 bg-emerald-600 hover:bg-emerald-700"
            >
              <Play className="h-5 w-5" />
              <span>Mulai Ujian Sekarang</span>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
