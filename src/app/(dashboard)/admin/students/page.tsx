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
  Edit,
  Trash2,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
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

  // Edit Student Modal state
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [editNis, setEditNis] = useState("");
  const [editName, setEditName] = useState("");
  const [editClassId, setEditClassId] = useState("");
  const [editGender, setEditGender] = useState("L");
  const [editPin, setEditPin] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete Student Modal state
  const [deletingStudent, setDeletingStudent] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Import file
  const [importFile, setImportFile] = useState<File | null>(null);

  const loadData = async () => {
    try {
      const [resS, resC] = await Promise.all([
        fetch(`/api/v1/admin/students?_t=${Date.now()}`, { cache: "no-store" }),
        fetch(`/api/v1/admin/classes?_t=${Date.now()}`, { cache: "no-store" }),
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
    if (!name.trim() || !classId) {
      toast.error("Nama dan Kelas wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/v1/admin/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nis: nis.trim(), name: name.trim(), classId, gender, pin: pin.trim() }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`Murid ${name} berhasil ditambahkan!`);
        setShowAddModal(false);
        setNis("");
        setName("");
        setPin("");
        await loadData();
      } else {
        toast.error(data.error?.message || "Gagal menambahkan murid.");
      }
    } catch {
      toast.error("Terjadi kesalahan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (student: any) => {
    setEditingStudent(student);
    setEditName(student.name || "");
    setEditNis(student.nis || "");
    setEditClassId(student.classId || (classes[0]?.id || ""));
    setEditGender(student.gender || "L");
    setEditPin(student.pin || "");
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent || !editName.trim() || !editClassId) {
      toast.error("Nama dan Kelas murid wajib diisi.");
      return;
    }

    setIsUpdating(true);
    try {
      const res = await fetch(`/api/v1/admin/students/${editingStudent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          nis: editNis.trim(),
          classId: editClassId,
          gender: editGender,
          pin: editPin.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`Data murid ${editName} berhasil diperbarui!`);
        // Optimistic UI update
        setStudents((prev) =>
          prev.map((s) =>
            s.id === editingStudent.id
              ? {
                  ...s,
                  name: editName.trim(),
                  nis: editNis.trim(),
                  classId: editClassId,
                  gender: editGender,
                  pin: editPin.trim(),
                  class: classes.find((c) => c.id === editClassId) || s.class,
                }
              : s
          )
        );
        setEditingStudent(null);
        await loadData();
      } else {
        toast.error(data.error?.message || "Gagal memperbarui data murid.");
      }
    } catch {
      toast.error("Terjadi kesalahan.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteStudent = async () => {
    if (!deletingStudent) return;

    const idToDelete = deletingStudent.id;
    const nameToDelete = deletingStudent.name;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/v1/admin/students/${idToDelete}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`Data murid ${nameToDelete} berhasil dihapus.`);
        // Optimistic UI update
        setStudents((prev) => prev.filter((s) => s.id !== idToDelete));
        setDeletingStudent(null);
        await loadData();
      } else {
        toast.error(data.error?.message || "Gagal menghapus data murid.");
      }
    } catch {
      toast.error("Terjadi kesalahan saat menghapus data murid.");
    } finally {
      setIsDeleting(false);
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E0F2C2] pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Kelola Data Murid</h1>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">
            Daftar seluruh murid sekolah yang terdaftar untuk mengikuti ujian online
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowImportModal(true)}
            className="gap-1.5 text-xs font-bold border-[#D5EFA9] text-[#4B7914] bg-[#F4FBEB] hover:bg-[#EBF7D9] rounded-2xl"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Import Excel Murid</span>
          </Button>

          <Button onClick={() => setShowAddModal(true)} className="gap-2 font-black shadow-md text-xs bg-[#7AB82A] hover:bg-[#6AA421] text-white rounded-2xl">
            <PlusCircle className="h-4 w-4" />
            <span>Tambah Murid Manual</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Cari NIS atau nama murid..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 text-xs rounded-2xl border-2 border-[#D5EFA9] focus-visible:ring-[#7AB82A]"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1">
          <Button
            variant={selectedClassFilter === "ALL" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedClassFilter("ALL")}
            className={selectedClassFilter === "ALL" ? "text-xs font-black shrink-0 rounded-xl bg-[#7AB82A] hover:bg-[#6AA421] text-white" : "text-xs font-bold shrink-0 rounded-xl border-[#D5EFA9]"}
          >
            Semua Kelas ({students.length})
          </Button>
          {classes.map((c) => (
            <Button
              key={c.id}
              variant={selectedClassFilter === c.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedClassFilter(c.id)}
              className={selectedClassFilter === c.id ? "text-xs font-black shrink-0 rounded-xl bg-[#7AB82A] hover:bg-[#6AA421] text-white" : "text-xs font-bold shrink-0 rounded-xl border-[#D5EFA9]"}
            >
              Kelas {c.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Students Table */}
      <Card className="shadow-md border-2 border-[#D8EEB6] rounded-[28px] overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F4FBEB] text-[#4B7914] uppercase font-black border-b border-[#D8EEB6]">
              <tr>
                <th className="py-3.5 px-4">No</th>
                <th className="py-3.5 px-4">NIS</th>
                <th className="py-3.5 px-4">Nama Lengkap</th>
                <th className="py-3.5 px-4">Kelas</th>
                <th className="py-3.5 px-4">L/P</th>
                <th className="py-3.5 px-4">PIN Akses</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E0F2C2]">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 font-medium">
                    Memuat data murid...
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 font-medium">
                    Tidak ada data murid yang sesuai.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student, idx) => (
                  <tr key={student.id} className="hover:bg-[#F9FCF5] transition-colors">
                    <td className="py-3.5 px-4 text-slate-400 font-semibold">{idx + 1}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-700">{student.nis || "-"}</td>
                    <td className="py-3.5 px-4 font-black text-slate-900">{student.name}</td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EBF7D9] text-[#4B7914] border border-[#D5EFA9]">
                        Kelas {student.class?.name}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-600">{student.gender || "-"}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-500 font-semibold">{student.pin || "-"}</td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Aktif
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(student)}
                          className="h-8 text-xs gap-1 text-[#578A1A] hover:text-[#416812] hover:bg-[#EBF7D9] rounded-xl font-bold"
                          title="Edit Murid"
                        >
                          <Edit className="h-3.5 w-3.5" />
                          <span>Edit</span>
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeletingStudent(student)}
                          className="h-8 text-xs text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl font-bold"
                          title="Hapus Murid"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Hapus</span>
                        </Button>
                      </div>
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
          <DialogTitle className="text-xl font-black text-slate-900">Tambah Data Murid Manual</DialogTitle>
          <DialogDescription className="text-xs text-slate-500 font-semibold">
            Masukkan identitas murid yang valid agar dapat mengakses ujian berbasis kode.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleAddStudent} className="space-y-4 my-2 text-xs">
          <div>
            <label className="block font-black uppercase tracking-wider text-[#4B7914] mb-1">
              Nama Lengkap Murid <span className="text-rose-500">*</span>
            </label>
            <Input
              placeholder="Masukkan nama lengkap siswa"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="h-11 text-xs rounded-xl border-2 border-[#D5EFA9] focus-visible:ring-[#7AB82A]"
              autoFocus
            />
          </div>

          <div>
            <label className="block font-black uppercase tracking-wider text-[#4B7914] mb-1">
              NIS (Opsional)
            </label>
            <Input
              placeholder="Contoh: 1009 (opsional)"
              value={nis}
              onChange={(e) => setNis(e.target.value)}
              className="h-11 text-xs font-mono rounded-xl border-2 border-[#D5EFA9] focus-visible:ring-[#7AB82A]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-black uppercase tracking-wider text-[#4B7914] mb-1">
                Kelas <span className="text-rose-500">*</span>
              </label>
              <select
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                required
                className="flex h-11 w-full rounded-xl border-2 border-[#D5EFA9] bg-white px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#7AB82A]"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    Kelas {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-black uppercase tracking-wider text-[#4B7914] mb-1">
                Jenis Kelamin
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="flex h-11 w-full rounded-xl border-2 border-[#D5EFA9] bg-white px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#7AB82A]"
              >
                <option value="L">Laki-laki (L)</option>
                <option value="P">Perempuan (P)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-black uppercase tracking-wider text-[#4B7914] mb-1">
              PIN Individual (Opsional)
            </label>
            <Input
              placeholder="Contoh: 1234"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="h-11 text-xs font-mono rounded-xl border-2 border-[#D5EFA9] focus-visible:ring-[#7AB82A]"
            />
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowAddModal(false)} className="rounded-xl">
              Batal
            </Button>
            <Button type="submit" isLoading={isSubmitting} className="font-black bg-[#7AB82A] hover:bg-[#6AA421] text-white rounded-xl shadow-md">
              Simpan Murid
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Edit Student Modal */}
      <Dialog open={Boolean(editingStudent)} onOpenChange={() => setEditingStudent(null)}>
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-slate-900">Edit Data Murid</DialogTitle>
          <DialogDescription className="text-xs text-slate-500 font-semibold">
            Perbarui nama, NIS, kelas, atau PIN akses murid.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleUpdateStudent} className="space-y-4 my-2 text-xs">
          <div>
            <label className="block font-black uppercase tracking-wider text-[#4B7914] mb-1">
              Nama Lengkap Murid <span className="text-rose-500">*</span>
            </label>
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              required
              className="h-11 text-xs rounded-xl border-2 border-[#D5EFA9] focus-visible:ring-[#7AB82A]"
              autoFocus
            />
          </div>

          <div>
            <label className="block font-black uppercase tracking-wider text-[#4B7914] mb-1">
              NIS (Nomor Induk Siswa)
            </label>
            <Input
              placeholder="Contoh: 1009"
              value={editNis}
              onChange={(e) => setEditNis(e.target.value)}
              className="h-11 text-xs font-mono rounded-xl border-2 border-[#D5EFA9] focus-visible:ring-[#7AB82A]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-black uppercase tracking-wider text-[#4B7914] mb-1">
                Kelas <span className="text-rose-500">*</span>
              </label>
              <select
                value={editClassId}
                onChange={(e) => setEditClassId(e.target.value)}
                required
                className="flex h-11 w-full rounded-xl border-2 border-[#D5EFA9] bg-white px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#7AB82A]"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    Kelas {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-black uppercase tracking-wider text-[#4B7914] mb-1">
                Jenis Kelamin
              </label>
              <select
                value={editGender}
                onChange={(e) => setEditGender(e.target.value)}
                className="flex h-11 w-full rounded-xl border-2 border-[#D5EFA9] bg-white px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#7AB82A]"
              >
                <option value="L">Laki-laki (L)</option>
                <option value="P">Perempuan (P)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-black uppercase tracking-wider text-[#4B7914] mb-1">
              PIN Individual (Opsional)
            </label>
            <Input
              placeholder="Contoh: 1234"
              value={editPin}
              onChange={(e) => setEditPin(e.target.value)}
              className="h-11 text-xs font-mono rounded-xl border-2 border-[#D5EFA9] focus-visible:ring-[#7AB82A]"
            />
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setEditingStudent(null)} className="rounded-xl">
              Batal
            </Button>
            <Button type="submit" isLoading={isUpdating} className="font-black bg-[#7AB82A] hover:bg-[#6AA421] text-white rounded-xl shadow-md">
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Delete Student Modal */}
      <Dialog open={Boolean(deletingStudent)} onOpenChange={() => setDeletingStudent(null)}>
        <DialogHeader>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 mb-2 mx-auto">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <DialogTitle className="text-center text-xl font-black text-slate-900">
            Hapus Data Murid?
          </DialogTitle>
          <DialogDescription className="text-center text-xs text-slate-500 font-semibold">
            Apakah Anda yakin ingin menghapus data murid <strong>{deletingStudent?.name}</strong> (Kelas {deletingStudent?.class?.name})? Seluruh riwayat ujian murid ini akan dihapus.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 pt-2 sm:justify-between">
          <Button variant="outline" onClick={() => setDeletingStudent(null)} className="rounded-xl">
            Batal
          </Button>
          <Button
            onClick={handleDeleteStudent}
            isLoading={isDeleting}
            className="font-black bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-md"
          >
            Ya, Hapus Data Murid
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Import Excel Modal (FR-003) */}
      <Dialog open={showImportModal} onOpenChange={setShowImportModal}>
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-slate-900">Import Data Murid dari Excel (.xlsx)</DialogTitle>
          <DialogDescription className="text-xs text-slate-500 font-semibold">
            Unggah file Excel berisi daftar NIS, Nama, Kelas, dan Jenis Kelamin.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-2 text-xs">
          {/* Download Template Banner */}
          <div className="rounded-2xl bg-[#F4FBEB] p-4 border border-[#D8EEB6] flex items-center justify-between">
            <div>
              <p className="font-bold text-[#4B7914]">Gunakan Template Resmi</p>
              <p className="text-[11px] text-slate-500">Kolom: nis, nama, kelas, jenis_kelamin, pin</p>
            </div>
            <a href="/templates/template_siswa_examcode.xlsx" download>
              <Button variant="outline" size="sm" className="text-xs font-bold gap-1.5 h-9 rounded-xl border-[#D5EFA9] hover:bg-white">
                <Download className="h-3.5 w-3.5 text-[#7AB82A]" />
                <span>Unduh Template</span>
              </Button>
            </a>
          </div>

          <div>
            <label className="block font-black uppercase tracking-wider text-[#4B7914] mb-1.5">
              Pilih File Excel (.xlsx)
            </label>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              className="block w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-[#7AB82A] file:text-white hover:file:bg-[#6AA421] cursor-pointer"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 pt-2">
          <Button variant="outline" onClick={() => setShowImportModal(false)} className="rounded-xl">
            Batal
          </Button>
          <Button
            onClick={handleImportExcel}
            isLoading={isImporting}
            className="font-black bg-[#7AB82A] hover:bg-[#6AA421] text-white rounded-xl shadow-md"
          >
            Mulai Import Data Murid
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
