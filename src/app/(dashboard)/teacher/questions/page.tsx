"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  FolderKanban,
  Search,
  BookOpen,
  PlusCircle,
  HelpCircle,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function TeacherQuestionsBankPage() {
  const [exams, setExams] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");

  useEffect(() => {
    async function loadQuestions() {
      try {
        const res = await fetch("/api/v1/teacher/exams");
        const data = await res.json();
        if (data.success) {
          // Fetch full details of exams to get all questions
          const detailedExams = await Promise.all(
            data.data.map(async (e: any) => {
              const resEx = await fetch(`/api/v1/teacher/exams/${e.id}`);
              const dataEx = await resEx.json();
              return dataEx.data;
            })
          );
          setExams(detailedExams.filter(Boolean));
        }
      } catch {
        toast.error("Gagal memuat bank soal.");
      } finally {
        setIsLoading(false);
      }
    }
    loadQuestions();
  }, []);

  // Collect all questions with their exam context
  const allQuestions: any[] = [];
  exams.forEach((ex) => {
    ex.questions?.forEach((q: any) => {
      allQuestions.push({
        ...q,
        examTitle: ex.title,
        examId: ex.id,
        subjectName: ex.subject?.name,
      });
    });
  });

  const filteredQuestions = allQuestions.filter((q) => {
    if (typeFilter !== "ALL" && q.type !== typeFilter) return false;
    if (searchQuery) {
      const s = searchQuery.toLowerCase();
      return (
        q.questionText.toLowerCase().includes(s) ||
        q.examTitle.toLowerCase().includes(s) ||
        q.subjectName?.toLowerCase().includes(s)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Bank Soal Guru</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Kumpulan seluruh butir soal ujian (Pilihan Ganda, Benar/Salah, dan Esai) yang telah Anda buat
          </p>
        </div>

        <Link href="/teacher/exams/create">
          <Button className="font-bold gap-2 shadow-sm">
            <PlusCircle className="h-4 w-4" />
            <span>Buat Ujian Baru</span>
          </Button>
        </Link>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari teks soal atau materi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {[
            { id: "ALL", label: "Semua Tipe" },
            { id: "MULTIPLE_CHOICE", label: "Pilihan Ganda" },
            { id: "TRUE_FALSE", label: "Benar / Salah" },
            { id: "ESSAY", label: "Esai / Uraian" },
          ].map((f) => (
            <Button
              key={f.id}
              variant={typeFilter === f.id ? "default" : "outline"}
              size="sm"
              onClick={() => setTypeFilter(f.id)}
              className="text-xs font-semibold shrink-0"
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Questions Feed */}
      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <p className="text-xs text-muted-foreground">Memuat bank soal...</p>
        </div>
      ) : filteredQuestions.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground text-sm">
          Tidak ada butir soal yang ditemukan.
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredQuestions.map((q) => (
            <Card key={q.id} className="p-5 shadow-sm border-border space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2.5">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs font-bold">
                    {q.type === "MULTIPLE_CHOICE"
                      ? "Pilihan Ganda"
                      : q.type === "TRUE_FALSE"
                      ? "Benar / Salah"
                      : "Esai"}
                  </Badge>
                  <span className="text-xs font-semibold text-muted-foreground">
                    {q.subjectName} • {q.examTitle}
                  </span>
                </div>
                <span className="text-xs font-bold text-foreground">Bobot: {q.points} Poin</span>
              </div>

              <p className="text-sm font-medium text-foreground whitespace-pre-line leading-relaxed">
                {q.questionText}
              </p>

              {q.options && q.options.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                  {q.options.map((opt: any) => (
                    <div
                      key={opt.id}
                      className={cn(
                        "p-2 rounded-lg border",
                        opt.isCorrect
                          ? "border-emerald-500 bg-emerald-50/50 text-emerald-800 font-bold dark:bg-emerald-950/40 dark:text-emerald-300"
                          : "border-border text-muted-foreground"
                      )}
                    >
                      {opt.optionKey}. {opt.optionText} {opt.isCorrect && "✓ (Kunci Jawaban)"}
                    </div>
                  ))}
                </div>
              )}

              {q.explanation && (
                <div className="rounded-lg bg-slate-50 dark:bg-slate-900 p-2.5 text-xs text-muted-foreground">
                  <strong>Pembahasan:</strong> {q.explanation}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
