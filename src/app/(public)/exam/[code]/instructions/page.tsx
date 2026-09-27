"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/layouts/Navbar";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Clock,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  Play,
  ArrowLeft,
  User,
  ShieldAlert,
  Zap,
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
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#DDF3FD] via-[#E8F8FE] to-[#EFFDF4] text-slate-800">
      <Navbar />

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 my-4">
        <div className="w-full max-w-2xl bg-white/95 backdrop-blur-md rounded-[32px] sm:rounded-[40px] shadow-2xl border-4 border-white p-6 sm:p-8">
          {/* Header Badge */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="relative h-9 w-9 shrink-0 rounded-xl overflow-hidden bg-white p-0.5 border border-[#E0F2C2] shadow-xs">
                <img
                  src="/whitebee-logo.png"
                  alt="White Bee Logo"
                  className="h-full w-full object-contain"
                />
              </div>
              <span className="font-mono font-black text-xs bg-[#EBF7D9] text-[#4B7914] px-3 py-1.5 rounded-xl border border-[#D5EFA9]">
                KODE: {studentData.exam.examCode}
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl">
              <User className="h-4 w-4 text-[#00C0FA]" />
              <span>
                {studentData.student.name} • Kelas {studentData.student.className}
              </span>
            </div>
          </div>

          {/* Exam Title */}
          <div className="mb-6 text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
              {studentData.exam.title}
            </h1>
            <p className="text-sm font-semibold text-[#0093BE] mt-1">
              Mata Pelajaran: {studentData.exam.subjectName}
            </p>
          </div>

          {/* Key Parameters 3-Col Box */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            <div className="rounded-2xl border-2 border-sky-100 bg-[#F0F9FF] p-4 text-center shadow-sm">
              <div className="h-8 w-8 rounded-xl bg-[#00C0FA]/15 text-[#0093BE] flex items-center justify-center mx-auto mb-1.5 font-bold">
                <Clock className="h-4 w-4" />
              </div>
              <p className="text-xs font-semibold text-slate-500">Durasi Waktu</p>
              <p className="text-lg font-black text-slate-800">{studentData.exam.durationMinutes} Menit</p>
            </div>

            <div className="rounded-2xl border-2 border-emerald-100 bg-[#F0FDF4] p-4 text-center shadow-sm">
              <div className="h-8 w-8 rounded-xl bg-[#80D235]/20 text-[#549714] flex items-center justify-center mx-auto mb-1.5 font-bold">
                <RotateCcw className="h-4 w-4" />
              </div>
              <p className="text-xs font-semibold text-slate-500">Sisa Percobaan</p>
              <p className="text-lg font-black text-slate-800">
                {studentData.remainingAttempts} dari {studentData.exam.maxAttempts}x
              </p>
            </div>

            <div className="rounded-2xl border-2 border-indigo-100 bg-[#EEF2FF] p-4 text-center shadow-sm">
              <div className="h-8 w-8 rounded-xl bg-indigo-500/15 text-indigo-600 flex items-center justify-center mx-auto mb-1.5 font-bold">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <p className="text-xs font-semibold text-slate-500">Penilaian</p>
              <p className="text-sm font-black text-slate-800 mt-1">{gradingMethodLabel}</p>
            </div>
          </div>

          {/* Teacher's Special Instructions */}
          {studentData.exam.instructions && (
            <div className="rounded-2xl bg-amber-50/80 p-4 border-2 border-amber-200/70 mb-6">
              <h4 className="text-xs font-black uppercase tracking-wider text-amber-900 mb-1.5 flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-amber-600" />
                Pesan & Petunjuk Khusus Guru:
              </h4>
              <p className="text-sm font-medium text-amber-950 whitespace-pre-line leading-relaxed">
                {studentData.exam.instructions}
              </p>
            </div>
          )}

          {/* Rules / Helpful Tips */}
          <div className="space-y-2.5 text-xs text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-6">
            <p className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-[#00C0FA]" />
              Tips & Ketentuan Pengerjaan Ujian:
            </p>
            <ul className="space-y-1.5 list-disc list-inside font-medium leading-relaxed">
              <li>Waktu pengerjaan akan mulai berjalan begitu tombol <strong>Mulai Ujian</strong> ditekan.</li>
              <li>Jawaban Anda otomatis tersimpan (<strong>Autosave</strong>) ke sistem setiap detik.</li>
              <li>Jika koneksi internet putus atau halaman ter-refresh, Anda dapat langsung melanjutkan kembali.</li>
              <li>Periksa kembali nomor soal yang ditandai <strong>Ragu-ragu (🚩)</strong> sebelum mengumpulkan.</li>
            </ul>
          </div>

          {/* Action Footer */}
          <div className="flex flex-col sm:flex-row justify-between gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => router.push(`/exam/${code}/identity`)}
              className="w-full sm:w-auto gap-2 rounded-2xl font-bold"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Ganti Identitas</span>
            </Button>

            <Button
              onClick={handleStartExam}
              size="lg"
              isLoading={isStarting}
              className="w-full sm:w-auto font-black gap-2 px-8 bg-[#80D235] hover:bg-[#72BE2E] text-white rounded-2xl shadow-lg active:scale-95 text-base"
            >
              <Play className="h-5 w-5 fill-current" />
              <span>Mulai Ujian Sekarang</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
