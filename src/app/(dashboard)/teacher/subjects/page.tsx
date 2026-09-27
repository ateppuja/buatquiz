"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  BookOpen,
  PlusCircle,
  Search,
  Edit2,
  Trash2,
  FileCheck2,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

export default function TeacherSubjectsPage() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  // Edit Modal
  const [editingSubject, setEditingSubject] = useState<any>(null);
  const [editName, setEditName] = useState("");
  const [editCode, setEditCode] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  // Delete Modal
  const [deletingSubject, setDeletingSubject] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadSubjects = async () => {
    try {
      const res = await fetch("/api/v1/teacher/subjects");
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

  const handleNameChange = (val: string) => {
    setName(val);
    if (!code || code === autoGenerateCode(name)) {
      setCode(autoGenerateCode(val));
    }
  };

  const autoGenerateCode = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return "";
    const words = trimmed.split(/\s+/);
    if (words.length >= 2) {
      return words.map((w) => w[0]).join("").toUpperCase().slice(0, 5);
    }
    return trimmed.slice(0, 3).toUpperCase();
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Nama mata pelajaran wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/v1/teacher/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          code: (code || autoGenerateCode(name)).trim().toUpperCase(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Mata pelajaran ${name} berhasil ditambahkan!`);
        setShowCreateModal(false);
        setName("");
        setCode("");
        loadSubjects();
      } else {
        toast.error(data.error?.message || "Gagal membuat mata pelajaran.");
      }
    } catch {
      toast.error("Terjadi kesalahan sistem saat membuat mata pelajaran.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (sub: any) => {
    setEditingSubject(sub);
    setEditName(sub.name);
    setEditCode(sub.code);
  };

  const handleUpdateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubject) return;
    if (!editName.trim()) {
      toast.error("Nama mata pelajaran wajib diisi.");
      return;
    }

    setIsEditing(true);
    try {
      const res = await fetch(`/api/v1/teacher/subjects/${editingSubject.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          code: (editCode || autoGenerateCode(editName)).trim().toUpperCase(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Mata pelajaran ${editName} berhasil diperbarui!`);
        setEditingSubject(null);
        loadSubjects();
      } else {
        toast.error(data.error?.message || "Gagal memperbarui mata pelajaran.");
      }
    } catch {
      toast.error("Terjadi kesalahan saat memperbarui mata pelajaran.");
    } finally {
      setIsEditing(false);
    }
  };

  const handleDeleteSubject = async () => {
    if (!deletingSubject) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/v1/teacher/subjects/${deletingSubject.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Mata pelajaran ${deletingSubject.name} berhasil dihapus.`);
        setDeletingSubject(null);
        loadSubjects();
      } else {
        toast.error(data.error?.message || "Gagal menghapus mata pelajaran.");
      }
    } catch {
      toast.error("Terjadi kesalahan saat menghapus mata pelajaran.");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredSubjects = subjects.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalExams = subjects.reduce((sum, s) => sum + (s._count?.exams || 0), 0);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Kelola Mata Pelajaran</h1>
            <Badge variant="outline" className="bg-primary/5 text-primary text-xs font-bold border-primary/20">
              {subjects.length} Mapel
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Tambah dan atur mata pelajaran kustom untuk pelaksanaan ujian dan bank soal guru
          </p>
        </div>

        <Button onClick={() => setShowCreateModal(true)} className="gap-2 font-bold shadow text-xs">
          <PlusCircle className="h-4 w-4" />
          <span>Tambah Mata Pelajaran</span>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="p-4 shadow-sm border-border flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Total Mata Pelajaran</p>
            <p className="text-lg font-bold text-foreground">{subjects.length} Mapel</p>
          </div>
        </Card>

        <Card className="p-4 shadow-sm border-border flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <FileCheck2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Total Ujian Terhubung</p>
            <p className="text-lg font-bold text-foreground">{totalExams} Ujian Dibuat</p>
          </div>
        </Card>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari mata pelajaran atau kode (contoh: MTK, IPA, Coding, Life Skills)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 text-xs"
          />
        </div>
      </div>

      {/* Subjects Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <p className="text-xs text-muted-foreground">Memuat daftar mata pelajaran...</p>
        </div>
      ) : filteredSubjects.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-2 border-border">
          <BookOpen className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-foreground mb-1">Tidak ada mata pelajaran ditemukan</h3>
          <p className="text-xs text-muted-foreground mb-4">
            {searchQuery ? "Tidak ada mapel yang cocok dengan pencarian." : "Belum ada mata pelajaran yang dibuat."}
          </p>
          <Button onClick={() => setShowCreateModal(true)} size="sm" className="gap-1.5 font-semibold text-xs">
            <PlusCircle className="h-3.5 w-3.5" />
            <span>Tambah Mapel Sekarang</span>
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {filteredSubjects.map((sub) => (
            <Card key={sub.id} className="p-5 shadow-sm border-border hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="outline" className="font-mono text-xs font-bold bg-primary/5 text-primary border-primary/20">
                    {sub.code}
                  </Badge>
                  <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <BookOpen className="h-4 w-4" />
                  </div>
                </div>

                <h3 className="text-lg font-bold text-foreground mb-1">{sub.name}</h3>

                <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-3 pt-3 border-t border-border">
                  <FileCheck2 className="h-3.5 w-3.5 text-primary" />
                  <span><strong>{sub._count?.exams || 0}</strong> Ujian dibuat</span>
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenEdit(sub)}
                  className="h-8 px-2.5 text-xs gap-1.5 text-foreground hover:text-primary font-medium"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  <span>Edit</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeletingSubject(sub)}
                  className="h-8 px-2.5 text-xs gap-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 font-medium"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Hapus</span>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* CREATE MODAL */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogHeader>
          <DialogTitle>Tambah Mata Pelajaran Baru</DialogTitle>
          <DialogDescription>
            Masukkan nama mata pelajaran kustom dan kode singkatannya.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleCreateSubject} className="space-y-4 my-2 text-xs">
          <div>
            <label className="block font-semibold uppercase text-muted-foreground mb-1">
              Nama Mata Pelajaran <span className="text-destructive">*</span>
            </label>
            <Input
              placeholder="Contoh: Coding & Robotika, Life Skills, Al-Qur'an Hadits..."
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
              className="h-10 text-xs"
              autoFocus
            />
          </div>

          <div>
            <label className="block font-semibold uppercase text-muted-foreground mb-1">
              Kode Singkatan (Maks. 10 Karakter)
            </label>
            <Input
              placeholder="Contoh: COD, LS, AQH..."
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              maxLength={10}
              className="h-10 text-xs font-mono uppercase"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Kode akan otomatis dibuatkan dari singkatan nama jika dikosongkan.
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
              Batal
            </Button>
            <Button type="submit" isLoading={isSubmitting} className="font-bold">
              Simpan Mapel
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* EDIT MODAL */}
      <Dialog open={Boolean(editingSubject)} onOpenChange={(open) => !open && setEditingSubject(null)}>
        <DialogHeader>
          <DialogTitle>Edit Mata Pelajaran</DialogTitle>
          <DialogDescription>
            Ubah nama atau kode singkatan mata pelajaran.
          </DialogDescription>
        </DialogHeader>

        {editingSubject && (
          <form onSubmit={handleUpdateSubject} className="space-y-4 my-2 text-xs">
            <div>
              <label className="block font-semibold uppercase text-muted-foreground mb-1">
                Nama Mata Pelajaran <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="Contoh: Coding & Robotika..."
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
                className="h-10 text-xs"
                autoFocus
              />
            </div>

            <div>
              <label className="block font-semibold uppercase text-muted-foreground mb-1">
                Kode Singkatan Mapel <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="Contoh: COD"
                value={editCode}
                onChange={(e) => setEditCode(e.target.value.toUpperCase())}
                required
                maxLength={10}
                className="h-10 text-xs font-mono uppercase"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingSubject(null)}>
                Batal
              </Button>
              <Button type="submit" isLoading={isEditing} className="font-bold">
                Simpan Perubahan
              </Button>
            </DialogFooter>
          </form>
        )}
      </Dialog>

      {/* DELETE CONFIRMATION MODAL */}
      <Dialog open={Boolean(deletingSubject)} onOpenChange={(open) => !open && setDeletingSubject(null)}>
        <DialogHeader>
          <div className="flex items-center gap-2 text-destructive mb-1">
            <AlertTriangle className="h-5 w-5" />
            <DialogTitle>Konfirmasi Hapus Mata Pelajaran</DialogTitle>
          </div>
          <DialogDescription>
            Apakah Anda yakin ingin menghapus mata pelajaran{" "}
            <strong className="text-foreground">{deletingSubject?.name} ({deletingSubject?.code})</strong>?
          </DialogDescription>
        </DialogHeader>

        {deletingSubject && (
          <div className="my-3 p-3.5 bg-destructive/10 border border-destructive/20 rounded-lg text-xs space-y-2">
            <p className="font-semibold text-destructive">
              ⚠️ Perhatian:
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Mata pelajaran ini saat ini terhubung dengan{" "}
              <strong className="text-foreground">{deletingSubject._count?.exams || 0} ujian</strong>.
              Ujian yang terhubung akan ikut terhapus jika mata pelajaran ini dihapus.
            </p>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setDeletingSubject(null)}>
            Batal
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDeleteSubject}
            isLoading={isDeleting}
            className="font-bold"
          >
            Ya, Hapus Mapel
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
