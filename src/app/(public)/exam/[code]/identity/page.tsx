"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/layouts/Navbar";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  UserCheck,
  BookOpen,
  Clock,
  RotateCcw,
  Building2,
  ArrowRight,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { toast } from "sonner";

export default function ExamIdentityPage() {
  const params = useParams();
  const router = useRouter();
  const code = (params?.code as string)?.toUpperCase();

  const [examData, setExamData] = useState<any>(null);
  const [isLoadingExam, setIsLoadingExam] = useState(true);

  const [name, setName] = useState("");
  const [classId, setClassId] = useState("");
  const [pin, setPin] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchExam() {
      try {
        const res = await fetch("/api/v1/student/exams/lookup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          toast.error(data.error?.message || "Ujian tidak ditemukan.");
          router.push("/join");
          return;
        }

        setExamData(data.data);
        if (data.data.eligibleClasses?.length === 1) {
          setClassId(data.data.eligibleClasses[0].id);
        }
      } catch {
        toast.error("Gagal memuat informasi ujian.");
        router.push("/join");
      } finally {
        setIsLoadingExam(false);
      }
    }

    if (code) fetchExam();
  }, [code, router]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !classId) {
      toast.error("Mohon lengkapi nama dan pilih kelas Anda.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/v1/student/exams/verify-identity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          name: name.trim(),
          classId,
          pin: pin.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.error?.message || "Verifikasi identitas gagal.");
        setIsSubmitting(false);
        return;
      }

      // Save student verification info in sessionStorage for instruction page
      sessionStorage.setItem("exam_student_data", JSON.stringify(data.data));

      if (data.data.hasActiveAttempt) {
        toast.info("Anda memiliki sesi ujian yang sedang berjalan. Mengarahkan kembali...");
        router.push(`/exam/${code}/attempt`);
      } else {
        router.push(`/exam/${code}/instructions`);
      }
    } catch {
      toast.error("Terjadi kesalahan saat memverifikasi identitas.");
      setIsSubmitting(false);
    }
  };

  if (isLoadingExam) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center space-y-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
            <p className="text-sm text-muted-foreground">Memuat informasi ujian...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      <Navbar />

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-xl space-y-6">
          {/* Exam Summary Banner */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3 mb-3">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-md">
                  {examData.examCode}
                </span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5" />
                  {examData.schoolName}
                </span>
              </div>
              <Badge variant="outline" className="text-xs">
                {examData.subjectName}
              </Badge>
            </div>

            <h1 className="text-xl font-bold text-foreground mb-2">{examData.title}</h1>
            {examData.description && (
              <p className="text-xs text-muted-foreground mb-3">{examData.description}</p>
            )}

            <div className="flex flex-wrap gap-4 text-xs font-medium text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-primary" />
                <span>Durasi: <strong>{examData.durationMinutes} Menit</strong></span>
              </span>
              <span className="flex items-center gap-1.5">
                <RotateCcw className="h-4 w-4 text-primary" />
                <span>Maks. Percobaan: <strong>{examData.maxAttempts}x</strong></span>
              </span>
            </div>
          </div>

          {/* Identity Form */}
          <Card className="shadow-lg border-slate-200 dark:border-slate-800">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <UserCheck className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">Verifikasi Identitas Peserta</CardTitle>
                  <CardDescription>Masukkan data Anda yang terdaftar di sekolah</CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleVerify} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Nama Lengkap Siswa <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="Masukkan nama lengkap sesuai absen"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoFocus
                    className="h-11"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Kelas Peserta <span className="text-destructive">*</span>
                  </label>
                  <select
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                    required
                    className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">-- Pilih Kelas Anda --</option>
                    {examData.eligibleClasses?.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        Kelas {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {examData.requiresPin && (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                      PIN Akses Ujian <span className="text-destructive">*</span>
                    </label>
                    <Input
                      type="password"
                      placeholder="Masukkan PIN yang diberikan guru"
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      required
                      className="h-11 font-mono text-center tracking-widest"
                    />
                  </div>
                )}

                {/* Demo Helper Pill */}
                <div className="rounded-lg bg-slate-100 dark:bg-slate-900 p-3 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex items-center justify-between">
                  <span>
                    Contoh Siswa Kelas IX A: <strong>Ahmad Fauzi</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setName("Ahmad Fauzi");
                      if (examData.eligibleClasses?.length > 0) {
                        setClassId(examData.eligibleClasses[0].id);
                      }
                    }}
                    className="text-primary font-bold hover:underline"
                  >
                    Isi Otomatis
                  </button>
                </div>

                <Button type="submit" size="lg" isLoading={isSubmitting} className="w-full font-semibold gap-2 mt-4">
                  <span>Verifikasi & Lanjutkan</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
