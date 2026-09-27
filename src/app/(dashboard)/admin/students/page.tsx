"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  GraduationCap,
  PlusCircle,
  Upload,
  Download,
  Search,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
} from "lucide-react";
import { toast } from "sonner";

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClassFilter, setSelectedClassFilter] = useState("ALL");

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Add Student Form state
  const [nis, setNis] = useState("");
  const [name, setName] = useState("");
  const [classId, setClassId] = useState("");
  const [gender, setGender] = useState("L");
  const [pin, setPin] = useState("");

  // Import file
  const [importFile, setImportFile] = useState<File | null>(null);

  const loadData = async () => {
    try {
      const [resS, resC] = await Promise.all([
        fetch("/api/v1/admin/students"),
        fetch("/api/v1/admin/classes"),
      ]);
      const [dataS, dataC] = await Promise.all([resS.json(), resC.json()]);

      if (dataS.success) setStudents(dataS.data);
      if (dataC.success) {
        setClasses(dataC.data);
        if (dataC.data.length > 0 && !classId) setClassId(dataC.data[0].id);
      }
    } catch {
      toast.error("Gagal memuat data murid.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !classId) {
      toast.error("Nama dan Kelas wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/v1/admin/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nis, name, classId, gender, pin }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`Murid ${name} berhasil ditambahkan!`);
        setShowAddModal(false);
        setNis("");
        setName("");
        setPin("");
        loadData();
      } else {
        toast.error(data.error?.message || "Gagal menambahkan murid.");
      }
    } catch {
      toast.error("Terjadi kesalahan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImportExcel = async () => {
    if (!importFile) {
      toast.error("Pilih file Excel (.xlsx).");
      return;
    }

    setIsImporting(true);
    try {
      const formData = new FormData();
      formData.append("file", importFile);

      const res = await fetch("/api/v1/admin/students/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        toast.success(
          `Import selesai! Berhasil mengimpor ${data.data.importedCount} murid (Dilewati: ${data.data.skippedCount}).`
        );
        setShowImportModal(false);
        setImportFile(null);
        loadData();
      } else {
        toast.error(data.error?.message || "Gagal mengimpor file.");
      }
    } catch {
      toast.error("Terjadi kesalahan saat mengimpor data murid.");
    } finally {
      setIsImporting(false);
    }
  };

  const filteredStudents = students.filter((s) => {
    if (selectedClassFilter !== "ALL" && s.classId !== selectedClassFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return s.name.toLowerCase().includes(q) || (s.nis && s.nis.includes(q)) || s.class?.name.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Kelola Data Murid</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Daftar seluruh murid sekolah yang terdaftar untuk mengikuti ujian online
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowImportModal(true)}
            className="gap-1.5 text-xs font-semibold border-emerald-300 text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/40"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Import Excel Murid</span>
          </Button>

          <Button onClick={() => setShowAddModal(true)} className="gap-2 font-bold shadow text-xs">
            <PlusCircle className="h-4 w-4" />
            <span>Tambah Murid Manual</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari NIS atau nama murid..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          <Button
            variant={selectedClassFilter === "ALL" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedClassFilter("ALL")}
            className="text-xs font-semibold shrink-0"
          >
            Semua Kelas
          </Button>
          {classes.map((c) => (
            <Button
              key={c.id}
              variant={selectedClassFilter === c.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedClassFilter(c.id)}
              className="text-xs font-semibold shrink-0"
            >
              Kelas {c.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Students Table */}
      <Card className="shadow-sm border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/60 text-muted-foreground uppercase font-semibold border-b border-border">
              <tr>
                <th className="py-3 px-4">No</th>
                <th className="py-3 px-4">NIS</th>
                <th className="py-3 px-4">Nama Lengkap</th>
                <th className="py-3 px-4">Kelas</th>
                <th className="py-3 px-4">L/P</th>
                <th className="py-3 px-4">PIN Akses</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted-foreground">
                    Memuat data murid...
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted-foreground">
                    Tidak ada data murid yang sesuai.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student, idx) => (
                  <tr key={student.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 text-muted-foreground">{idx + 1}</td>
                    <td className="py-3 px-4 font-mono font-bold text-foreground">{student.nis}</td>
                    <td className="py-3 px-4 font-semibold text-foreground">{student.name}</td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className="text-[11px] font-semibold">
                        Kelas {student.class?.name}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 font-medium">{student.gender || "-"}</td>
                    <td className="py-3 px-4 font-mono text-muted-foreground">{student.pin || "-"}</td>
                    <td className="py-3 px-4">
                      <Badge variant="success" className="text-[10px]">Aktif</Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Single Student Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogHeader>
          <DialogTitle>Tambah Data Murid Manual</DialogTitle>
          <DialogDescription>
            Masukkan identitas murid yang valid agar dapat mengakses ujian berbasis kode.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleAddStudent} className="space-y-4 my-2 text-xs">
          <div>
            <label className="block font-semibold uppercase text-muted-foreground mb-1">
              Nama Lengkap Murid <span className="text-destructive">*</span>
            </label>
            <Input
              placeholder="Masukkan nama lengkap siswa"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="h-10 text-xs"
              autoFocus
            />
          </div>

          <div>
            <label className="block font-semibold uppercase text-muted-foreground mb-1">
              NIS (Opsional)
            </label>
            <Input
              placeholder="Contoh: 1009 (opsional)"
              value={nis}
              onChange={(e) => setNis(e.target.value)}
              className="h-10 text-xs font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold uppercase text-muted-foreground mb-1">
                Kelas <span className="text-destructive">*</span>
              </label>
              <select
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                required
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    Kelas {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold uppercase text-muted-foreground mb-1">
                Jenis Kelamin
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs"
              >
                <option value="L">Laki-laki (L)</option>
                <option value="P">Perempuan (P)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold uppercase text-muted-foreground mb-1">
              PIN Individual (Opsional)
            </label>
            <Input
              placeholder="Contoh: 1234"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="h-10 text-xs font-mono"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
              Batal
            </Button>
            <Button type="submit" isLoading={isSubmitting} className="font-bold">
              Simpan Murid
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Import Excel Modal (FR-003) */}
      <Dialog open={showImportModal} onOpenChange={setShowImportModal}>
        <DialogHeader>
          <DialogTitle>Import Data Murid dari Excel (.xlsx)</DialogTitle>
          <DialogDescription>
            Unggah file Excel berisi daftar NIS, Nama, Kelas, dan Jenis Kelamin.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-2 text-xs">
          {/* Download Template Banner */}
          <div className="rounded-xl bg-blue-50 dark:bg-blue-950/40 p-3.5 border border-blue-100 dark:border-blue-900 flex items-center justify-between">
            <div>
              <p className="font-bold text-blue-900 dark:text-blue-200">Gunakan Template Resmi</p>
              <p className="text-[11px] text-blue-700 dark:text-blue-400">Kolom: nis, nama, kelas, jenis_kelamin, pin</p>
            </div>
            <a href="/templates/template_siswa_examcode.xlsx" download>
              <Button variant="outline" size="sm" className="text-xs gap-1 h-8">
                <Download className="h-3.5 w-3.5" />
                <span>Unduh Template (.xlsx)</span>
              </Button>
            </a>
          </div>

          <div>
            <label className="block font-semibold uppercase text-muted-foreground mb-1.5">
              Pilih File Excel (.xlsx)
            </label>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setShowImportModal(false)}>
            Batal
          </Button>
          <Button
            onClick={handleImportExcel}
            isLoading={isImporting}
            className="font-bold bg-emerald-600 hover:bg-emerald-700"
          >
            Mulai Import Data Murid
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
