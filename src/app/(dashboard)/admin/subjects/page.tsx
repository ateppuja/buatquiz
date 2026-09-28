"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { BookOpen, PlusCircle } from "lucide-react";
import { toast } from "sonner";

export default function AdminSubjectsPage() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  const loadSubjects = async () => {
    try {
      const res = await fetch(`/api/v1/admin/subjects?_t=${Date.now()}`, { cache: "no-store" });
      const data = await res.json();
      if (data.success) setSubjects(data.data);
    } catch {
      toast.error("Gagal memuat mata pelajaran.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSubjects();
  }, []);

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code) {
      toast.error("Nama dan kode mata pelajaran wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/v1/admin/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, code: code.toUpperCase() }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Mata pelajaran ${name} berhasil dibuat!`);
        setShowModal(false);
        setName("");
        setCode("");
        loadSubjects();
      } else {
        toast.error(data.error?.message || "Gagal membuat mata pelajaran.");
      }
    } catch {
      toast.error("Terjadi kesalahan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Daftar Mata Pelajaran</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Mata pelajaran yang diajarkan di sekolah dan menjadi kategori pelaksanaan ujian
          </p>
        </div>

        <Button onClick={() => setShowModal(true)} className="gap-2 font-bold shadow text-xs">
          <PlusCircle className="h-4 w-4" />
          <span>Tambah Mata Pelajaran</span>
        </Button>
      </div>

      {/* Subjects Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <p className="text-xs text-muted-foreground">Memuat mata pelajaran...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {subjects.map((sub) => (
            <Card key={sub.id} className="p-5 shadow-sm border-border hover:shadow transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <Badge variant="outline" className="font-mono text-xs font-bold">
                  {sub.code}
                </Badge>
                <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <BookOpen className="h-4 w-4" />
                </div>
              </div>

              <h3 className="text-lg font-bold text-foreground">{sub.name}</h3>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogHeader>
          <DialogTitle>Tambah Mata Pelajaran Baru</DialogTitle>
          <DialogDescription>
            Masukkan nama lengkap mata pelajaran dan singkatan kode uniknya.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleCreateSubject} className="space-y-4 my-2 text-xs">
          <div>
            <label className="block font-semibold uppercase text-muted-foreground mb-1">
              Nama Mata Pelajaran <span className="text-destructive">*</span>
            </label>
            <Input
              placeholder="Contoh: Ilmu Pengetahuan Sosial"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="h-10 text-xs"
              autoFocus
            />
          </div>

          <div>
            <label className="block font-semibold uppercase text-muted-foreground mb-1">
              Kode Mata Pelajaran <span className="text-destructive">*</span>
            </label>
            <Input
              placeholder="Contoh: IPS"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              required
              maxLength={10}
              className="h-10 text-xs font-mono uppercase"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
              Batal
            </Button>
            <Button type="submit" isLoading={isSubmitting} className="font-bold">
              Simpan Mata Pelajaran
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
