"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Users,
  CheckCircle2,
  Clock,
  PlusCircle,
  ArrowRight,
  Copy,
  BarChart3,
  Edit,
  Eye,
  ExternalLink,
  BookOpen,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

export default function TeacherDashboardPage() {
  const [exams, setExams] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadExams() {
      try {
        const res = await fetch("/api/v1/teacher/exams");
        const data = await res.json();
        if (data.success) {
          setExams(data.data);
        }
      } catch {
        toast.error("Gagal memuat data ujian.");
      } finally {
        setIsLoading(false);
      }
    }
    loadExams();
  }, []);

  const totalExams = exams.length;
  const activeExams = exams.filter((e) => e.status === "PUBLISHED").length;
  const closedExams = exams.filter((e) => e.status === "CLOSED").length;
  const totalAttempts = exams.reduce((acc, e) => acc + (e._count?.attempts || 0), 0);

  const copyExamCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Kode ujian ${code} berhasil disalin ke clipboard!`);
  };

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Dashboard Guru Pengampu
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola pembuatan soal, pantau ujian yang sedang berlangsung, dan rekap nilai murid.
          </p>
        </div>

        <Link href="/teacher/exams/create">
          <Button size="lg" className="font-bold gap-2 shadow-sm">
            <PlusCircle className="h-5 w-5" />
            <span>Buat Ujian Baru</span>
          </Button>
        </Link>
      </div>

      {/* KPI Stats Grid (FR-004) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="p-5 shadow-sm border-border bg-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Total Ujian</span>
            <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-foreground">{totalExams}</span>
            <p className="text-xs text-muted-foreground mt-0.5">Ujian telah dibuat</p>
          </div>
        </Card>

        <Card className="p-5 shadow-sm border-border bg-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Total Peserta</span>
            <div className="h-8 w-8 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-foreground">{totalAttempts}</span>
            <p className="text-xs text-muted-foreground mt-0.5">Sesi pengerjaan</p>
          </div>
        </Card>

        <Card className="p-5 shadow-sm border-border bg-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Ujian Aktif</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-emerald-600">{activeExams}</span>
            <p className="text-xs text-muted-foreground mt-0.5">Dapat diakses murid</p>
          </div>
        </Card>

        <Card className="p-5 shadow-sm border-border bg-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Ujian Selesai</span>
            <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-foreground">{closedExams}</span>
            <p className="text-xs text-muted-foreground mt-0.5">Ujian telah ditutup</p>
          </div>
        </Card>
      </div>

      {/* Recent Exams Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Daftar Ujian Terbaru</h2>
          <Link href="/teacher/exams" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
            <span>Lihat Semua Ujian</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {exams.length === 0 ? (
          <Card className="p-12 text-center border-dashed border-2">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-base font-semibold text-foreground">Belum Ada Ujian Dibuat</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1 mb-4">
              Mulai buat ujian baru dengan memasukkan soal secara manual atau import dari Word & Excel.
            </p>
            <Link href="/teacher/exams/create">
              <Button size="sm" className="gap-2">
                <PlusCircle className="h-4 w-4" />
                <span>Buat Ujian Sekarang</span>
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {exams.slice(0, 6).map((exam) => {
              const isPublished = exam.status === "PUBLISHED";
              const isClosed = exam.status === "CLOSED";
              const isDraft = exam.status === "DRAFT";

              return (
                <Card key={exam.id} className="flex flex-col justify-between shadow-sm border-border p-5 hover:shadow-md transition-shadow">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-xs font-semibold text-muted-foreground">
                        {exam.subject.name}
                      </span>
                      {isPublished && <Badge variant="success" className="text-[10px]">Aktif</Badge>}
                      {isClosed && <Badge variant="secondary" className="text-[10px]">Selesai</Badge>}
                      {isDraft && <Badge variant="outline" className="text-[10px]">Draft</Badge>}
                    </div>

                    <h3 className="text-base font-bold text-foreground mb-1 line-clamp-2">
                      {exam.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-4">
                      Kelas: {exam.examClasses?.map((ec: any) => ec.class.name).join(", ") || "-"}
                    </p>

                    {/* Exam Code Display */}
                    {exam.examCode && (
                      <div className="flex items-center justify-between rounded-lg bg-slate-100 dark:bg-slate-900 p-2.5 mb-4 border border-border">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-muted-foreground block">Kode Ujian:</span>
                          <span className="font-mono font-extrabold text-sm text-primary tracking-wider">
                            {exam.examCode}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copyExamCode(exam.examCode)}
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          title="Salin Kode Ujian"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border">
                      <span>{exam._count?.questions || 0} Soal</span>
                      <span>{exam._count?.attempts || 0} Percobaan Peserta</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-5 pt-3 border-t border-border">
                    {isDraft ? (
                      <Link href={`/teacher/exams/${exam.id}/edit`} className="w-full">
                        <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs">
                          <Edit className="h-3.5 w-3.5" />
                          <span>Lanjutkan Edit Draft</span>
                        </Button>
                      </Link>
                    ) : (
                      <>
                        <Link href={`/teacher/exams/${exam.id}/monitor`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full gap-1 text-xs">
                            <Users className="h-3.5 w-3.5" />
                            <span>Monitoring</span>
                          </Button>
                        </Link>
                        <Link href={`/teacher/exams/${exam.id}/results`} className="flex-1">
                          <Button size="sm" className="w-full gap-1 text-xs">
                            <BarChart3 className="h-3.5 w-3.5" />
                            <span>Hasil</span>
                          </Button>
                        </Link>
                      </>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
