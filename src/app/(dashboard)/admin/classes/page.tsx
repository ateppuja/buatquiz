"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  Layers,
  PlusCircle,
  Users,
  GraduationCap,
  Edit2,
  Trash2,
  Search,
  BookOpen,
  FileText,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

export default function AdminClassesPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [gradeLevel, setGradeLevel] = useState<number | string>(7);
  const [isCustomGrade, setIsCustomGrade] = useState(false);
  const [customGradeInput, setCustomGradeInput] = useState("");

  // Edit Modal
  const [editingClass, setEditingClass] = useState<any>(null);
  const [editName, setEditName] = useState("");
  const [editGradeLevel, setEditGradeLevel] = useState<number | string>(7);
  const [editIsCustomGrade, setEditIsCustomGrade] = useState(false);
  const [editCustomGradeInput, setEditCustomGradeInput] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  // Delete Modal
  const [deletingClass, setDeletingClass] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadClasses = async () => {
    try {
      const res = await fetch(`/api/v1/admin/classes?_t=${Date.now()}`, { cache: "no-store" });
      const data = await res.json();
      if (data.success) setClasses(data.data);
    } catch {
      toast.error("Gagal memuat data kelas.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadClasses();
  }, []);

  const getGradeDisplay = (lvl: number) => {
    if (lvl === 0) return "PAUD / TK";
    if (lvl >= 1 && lvl <= 6) return `Tingkat SD (${lvl})`;
    if (lvl >= 7 && lvl <= 9) return `Tingkat SMP (${lvl})`;
    if (lvl >= 10 && lvl <= 12) return `Tingkat SMA (${lvl})`;
    return `Tingkat ${lvl}`;
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Nama kelas wajib diisi.");
      return;
    }

    const finalGrade = isCustomGrade
      ? parseInt(customGradeInput || "0", 10)
      : parseInt(String(gradeLevel), 10);

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/v1/admin/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          gradeLevel: isNaN(finalGrade) ? 0 : finalGrade,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Kelas ${name} berhasil ditambahkan!`);
        setShowCreateModal(false);
        setName("");
        setGradeLevel(7);
        setIsCustomGrade(false);
        setCustomGradeInput("");
        await loadClasses();
      } else {
        toast.error(data.error?.message || "Gagal membuat kelas.");
      }
    } catch {
      toast.error("Terjadi kesalahan sistem saat membuat kelas.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (c: any) => {
    setEditingClass(c);
    setEditName(c.name);
    if (c.gradeLevel >= 0 && c.gradeLevel <= 12) {
      setEditGradeLevel(c.gradeLevel);
      setEditIsCustomGrade(false);
      setEditCustomGradeInput("");
    } else {
      setEditIsCustomGrade(true);
      setEditCustomGradeInput(String(c.gradeLevel));
    }
  };

  const handleUpdateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClass) return;
    if (!editName.trim()) {
      toast.error("Nama kelas wajib diisi.");
      return;
    }

    const finalGrade = editIsCustomGrade
      ? parseInt(editCustomGradeInput || "0", 10)
      : parseInt(String(editGradeLevel), 10);

    setIsEditing(true);
    try {
      const res = await fetch(`/api/v1/admin/classes/${editingClass.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          gradeLevel: isNaN(finalGrade) ? 0 : finalGrade,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Kelas ${editName} berhasil diperbarui!`);
        setEditingClass(null);
        await loadClasses();
      } else {
        toast.error(data.error?.message || "Gagal memperbarui kelas.");
      }
    } catch {
      toast.error("Terjadi kesalahan saat memperbarui kelas.");
    } finally {
      setIsEditing(false);
    }
  };

  const handleDeleteClass = async () => {
    if (!deletingClass) return;
    const idToDelete = deletingClass.id;
    const nameToDelete = deletingClass.name;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/v1/admin/classes/${idToDelete}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Kelas ${nameToDelete} berhasil dihapus.`);
        setClasses((prev) => prev.filter((c) => c.id !== idToDelete));
        setDeletingClass(null);
        await loadClasses();
      } else {
        toast.error(data.error?.message || "Gagal menghapus kelas.");
      }
    } catch {
      toast.error("Terjadi kesalahan saat menghapus kelas.");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredClasses = classes.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalStudents = classes.reduce((sum, c) => sum + (c._count?.students || 0), 0);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Daftar Kelas Sekolah</h1>
            <Badge variant="outline" className="bg-primary/5 text-primary text-xs font-bold border-primary/20">
              {classes.length} Kelas
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Kelola tingkatan, rombel belajar kustom, penugasan ujian, serta data murid terdaftar
          </p>
        </div>

        <Button onClick={() => setShowCreateModal(true)} className="gap-2 font-bold shadow text-xs">
          <PlusCircle className="h-4 w-4" />
          <span>Tambah Kelas Baru</span>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 shadow-sm border-border flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Total Rombel Kelas</p>
            <p className="text-lg font-bold text-foreground">{classes.length} Kelas</p>
          </div>
        </Card>

        <Card className="p-4 shadow-sm border-border flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Total Murid Terdaftar</p>
            <p className="text-lg font-bold text-foreground">{totalStudents} Murid</p>
          </div>
        </Card>

        <Card className="p-4 shadow-sm border-border flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Tahun Ajaran Aktif</p>
            <p className="text-lg font-bold text-foreground">2026/2027 (Ganjil)</p>
          </div>
        </Card>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari kelas (contoh: VII A, Toddler, Primary 1)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 text-xs"
          />
        </div>
      </div>

      {/* Classes Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <p className="text-xs text-muted-foreground">Memuat daftar kelas...</p>
        </div>
      ) : filteredClasses.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-2 border-border">
          <Layers className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-foreground mb-1">Tidak ada kelas ditemukan</h3>
          <p className="text-xs text-muted-foreground mb-4">
            {searchQuery ? "Tidak ada nama kelas yang cocok dengan pencarian." : "Belum ada kelas yang dibuat di sekolah ini."}
          </p>
          <Button onClick={() => setShowCreateModal(true)} size="sm" className="gap-1.5 font-semibold text-xs">
            <PlusCircle className="h-3.5 w-3.5" />
            <span>Tambah Kelas Sekarang</span>
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {filteredClasses.map((c) => (
            <Card key={c.id} className="p-5 shadow-sm border-border hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="outline" className="text-xs font-bold bg-muted/40">
                    {getGradeDisplay(c.gradeLevel)}
                  </Badge>
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    T.A. 2026/2027
                  </span>
                </div>

                <h3 className="text-xl font-extrabold text-foreground mb-1">
                  {c.name.toLowerCase().startsWith("kelas") ? c.name : `Kelas ${c.name}`}
                </h3>

                <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-border/80 text-xs">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <GraduationCap className="h-4 w-4 text-primary shrink-0" />
                    <span><strong>{c._count?.students || 0}</strong> Murid</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <BookOpen className="h-4 w-4 text-blue-500 shrink-0" />
                    <span><strong>{c._count?.teacherClasses || 0}</strong> Pengajar</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenEdit(c)}
                  className="h-8 px-2.5 text-xs gap-1.5 text-foreground hover:text-primary hover:border-primary/40 font-medium"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  <span>Edit</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeletingClass(c)}
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
          <DialogTitle>Tambah Kelas Baru</DialogTitle>
          <DialogDescription>
            Masukkan nama kelas kustom dan pilih tingkatan rombongan belajar.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleCreateClass} className="space-y-4 my-2 text-xs">
          <div>
            <label className="block font-semibold uppercase text-muted-foreground mb-1">
              Nama Kelas <span className="text-destructive">*</span>
            </label>
            <Input
              placeholder="Contoh: VII A, IX C, Bee Toddler, Grade 1..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="h-10 text-xs"
              autoFocus
            />
          </div>

          <div>
            <label className="block font-semibold uppercase text-muted-foreground mb-1">
              Tingkat Kelas (Grade Level)
            </label>
            {!isCustomGrade ? (
              <select
                value={gradeLevel}
                onChange={(e) => {
                  if (e.target.value === "custom") {
                    setIsCustomGrade(true);
                  } else {
                    setGradeLevel(parseInt(e.target.value, 10));
                  }
                }}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs"
              >
                <optgroup label="Taman Kanak-kanak / PAUD">
                  <option value="0">PAUD / TK (Tingkat 0)</option>
                </optgroup>
                <optgroup label="Sekolah Dasar (SD / Primary)">
                  <option value="1">Tingkat 1 (Kelas 1 SD)</option>
                  <option value="2">Tingkat 2 (Kelas 2 SD)</option>
                  <option value="3">Tingkat 3 (Kelas 3 SD)</option>
                  <option value="4">Tingkat 4 (Kelas 4 SD)</option>
                  <option value="5">Tingkat 5 (Kelas 5 SD)</option>
                  <option value="6">Tingkat 6 (Kelas 6 SD)</option>
                </optgroup>
                <optgroup label="Sekolah Menengah Pertama (SMP)">
                  <option value="7">Tingkat 7 (Kelas 7 SMP)</option>
                  <option value="8">Tingkat 8 (Kelas 8 SMP)</option>
                  <option value="9">Tingkat 9 (Kelas 9 SMP)</option>
                </optgroup>
                <optgroup label="Sekolah Menengah Atas/Kejuruan (SMA/SMK)">
                  <option value="10">Tingkat 10 (Kelas 10 SMA)</option>
                  <option value="11">Tingkat 11 (Kelas 11 SMA)</option>
                  <option value="12">Tingkat 12 (Kelas 12 SMA)</option>
                </optgroup>
                <optgroup label="Lainnya / Kustom">
                  <option value="custom">✏️ Masukkan Angka Tingkat Kustom...</option>
                </optgroup>
              </select>
            ) : (
              <div className="space-y-1.5">
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min="0"
                    max="99"
                    placeholder="Contoh: 1, 2, 7, 13..."
                    value={customGradeInput}
                    onChange={(e) => setCustomGradeInput(e.target.value)}
                    required
                    className="h-10 text-xs flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsCustomGrade(false);
                      setGradeLevel(7);
                    }}
                    className="h-10 text-xs px-3"
                  >
                    Pilihan Standar
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Masukkan angka tingkat rombel (0 untuk PAUD/TK, 1-6 SD, 7-9 SMP, 10-12 SMA, dsb.)
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
              Batal
            </Button>
            <Button type="submit" isLoading={isSubmitting} className="font-bold">
              Buat Kelas
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* EDIT MODAL */}
      <Dialog open={Boolean(editingClass)} onOpenChange={(open) => !open && setEditingClass(null)}>
        <DialogHeader>
          <DialogTitle>Edit Data Kelas</DialogTitle>
          <DialogDescription>
            Ubah nama kelas atau tingkatan rombongan belajar.
          </DialogDescription>
        </DialogHeader>

        {editingClass && (
          <form onSubmit={handleUpdateClass} className="space-y-4 my-2 text-xs">
            <div>
              <label className="block font-semibold uppercase text-muted-foreground mb-1">
                Nama Kelas <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="Contoh: VII A, Bee Toddler, Grade 1..."
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
                className="h-10 text-xs"
                autoFocus
              />
            </div>

            <div>
              <label className="block font-semibold uppercase text-muted-foreground mb-1">
                Tingkat Kelas (Grade Level)
              </label>
              {!editIsCustomGrade ? (
                <select
                  value={editGradeLevel}
                  onChange={(e) => {
                    if (e.target.value === "custom") {
                      setEditIsCustomGrade(true);
                    } else {
                      setEditGradeLevel(parseInt(e.target.value, 10));
                    }
                  }}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs"
                >
                  <optgroup label="Taman Kanak-kanak / PAUD">
                    <option value="0">PAUD / TK (Tingkat 0)</option>
                  </optgroup>
                  <optgroup label="Sekolah Dasar (SD / Primary)">
                    <option value="1">Tingkat 1 (Kelas 1 SD)</option>
                    <option value="2">Tingkat 2 (Kelas 2 SD)</option>
                    <option value="3">Tingkat 3 (Kelas 3 SD)</option>
                    <option value="4">Tingkat 4 (Kelas 4 SD)</option>
                    <option value="5">Tingkat 5 (Kelas 5 SD)</option>
                    <option value="6">Tingkat 6 (Kelas 6 SD)</option>
                  </optgroup>
                  <optgroup label="Sekolah Menengah Pertama (SMP)">
                    <option value="7">Tingkat 7 (Kelas 7 SMP)</option>
                    <option value="8">Tingkat 8 (Kelas 8 SMP)</option>
                    <option value="9">Tingkat 9 (Kelas 9 SMP)</option>
                  </optgroup>
                  <optgroup label="Sekolah Menengah Atas/Kejuruan (SMA/SMK)">
                    <option value="10">Tingkat 10 (Kelas 10 SMA)</option>
                    <option value="11">Tingkat 11 (Kelas 11 SMA)</option>
                    <option value="12">Tingkat 12 (Kelas 12 SMA)</option>
                  </optgroup>
                  <optgroup label="Lainnya / Kustom">
                    <option value="custom">✏️ Masukkan Angka Tingkat Kustom...</option>
                  </optgroup>
                </select>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min="0"
                      max="99"
                      placeholder="Contoh: 1, 2, 7, 13..."
                      value={editCustomGradeInput}
                      onChange={(e) => setEditCustomGradeInput(e.target.value)}
                      required
                      className="h-10 text-xs flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setEditIsCustomGrade(false);
                        setEditGradeLevel(7);
                      }}
                      className="h-10 text-xs px-3"
                    >
                      Pilihan Standar
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingClass(null)}>
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
      <Dialog open={Boolean(deletingClass)} onOpenChange={(open) => !open && setDeletingClass(null)}>
        <DialogHeader>
          <div className="flex items-center gap-2 text-destructive mb-1">
            <AlertTriangle className="h-5 w-5" />
            <DialogTitle>Konfirmasi Hapus Kelas</DialogTitle>
          </div>
          <DialogDescription>
            Apakah Anda yakin ingin menghapus kelas{" "}
            <strong className="text-foreground">{deletingClass?.name}</strong>?
          </DialogDescription>
        </DialogHeader>

        {deletingClass && (
          <div className="my-3 p-3.5 bg-destructive/10 border border-destructive/20 rounded-lg text-xs space-y-2">
            <p className="font-semibold text-destructive">
              ⚠️ Perhatian: Tindakan ini bersifat permanen!
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Kelas ini saat ini memiliki{" "}
              <strong className="text-foreground">{deletingClass._count?.students || 0} murid terdaftar</strong>,{" "}
              <strong className="text-foreground">{deletingClass._count?.teacherClasses || 0} penugasan guru</strong>, dan{" "}
              <strong className="text-foreground">{deletingClass._count?.examClasses || 0} ujian</strong>.
              Semua relasi kelas ini akan ikut terhapus.
            </p>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setDeletingClass(null)}>
            Batal
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDeleteClass}
            isLoading={isDeleting}
            className="font-bold"
          >
            Ya, Hapus Kelas
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
