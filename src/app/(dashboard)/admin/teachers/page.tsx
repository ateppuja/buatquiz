"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  Users,
  PlusCircle,
  Search,
  Edit,
  Trash2,
  PowerOff,
  KeyRound,
  BookOpen,
  Layers,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

export default function AdminTeachersPage() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states for Create
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);

  // Edit Teacher Modal state
  const [editingTeacher, setEditingTeacher] = useState<any>(null);
  const [editName, setEditName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editClassIds, setEditClassIds] = useState<string[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete Teacher Modal state
  const [deletingTeacher, setDeletingTeacher] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Reset Password Modal state
  const [passwordResetTeacher, setPasswordResetTeacher] = useState<any>(null);
  const [newPassword, setNewPassword] = useState("");

  const loadData = async () => {
    try {
      const [resT, resC] = await Promise.all([
        fetch(`/api/v1/admin/teachers?_t=${Date.now()}`, { cache: "no-store" }),
        fetch(`/api/v1/admin/classes?_t=${Date.now()}`, { cache: "no-store" }),
      ]);

      const [dataT, dataC] = await Promise.all([
        resT.json(),
        resC.json(),
      ]);

      if (dataT.success) setTeachers(dataT.data);
      if (dataC.success) setClasses(dataC.data);
    } catch {
      toast.error("Gagal memuat data guru.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !username.trim() || !password) {
      toast.error("Nama, username, dan password wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/v1/admin/teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          username: username.trim(),
          password,
          classIds: selectedClassIds,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Akun guru berhasil dibuat!");
        setShowCreateModal(false);
        // Reset form
        setName("");
        setUsername("");
        setPassword("");
        setSelectedClassIds([]);
        await loadData();
      } else {
        toast.error(data.error?.message || "Gagal membuat guru.");
      }
    } catch {
      toast.error("Terjadi kesalahan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (teacher: any) => {
    setEditingTeacher(teacher);
    setEditName(teacher.name || "");
    setEditUsername(teacher.username || "");
    setEditPassword("");
    const currentClassIds = teacher.teacherClasses?.map((tc: any) => tc.classId) || [];
    setEditClassIds(currentClassIds);
  };

  const handleUpdateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher || !editName.trim() || !editUsername.trim()) {
      toast.error("Nama dan username guru wajib diisi.");
      return;
    }

    setIsUpdating(true);
    try {
      const payload: any = {
        name: editName.trim(),
        username: editUsername.trim(),
        classIds: editClassIds,
      };
      if (editPassword && editPassword.trim().length > 0) {
        payload.password = editPassword.trim();
      }

      const res = await fetch(`/api/v1/admin/teachers/${editingTeacher.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`Data guru ${editName} berhasil diperbarui!`);
        setEditingTeacher(null);
        await loadData();
      } else {
        toast.error(data.error?.message || "Gagal memperbarui data guru.");
      }
    } catch {
      toast.error("Terjadi kesalahan.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteTeacher = async () => {
    if (!deletingTeacher) return;

    const idToDelete = deletingTeacher.id;
    const nameToDelete = deletingTeacher.name;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/v1/admin/teachers/${idToDelete}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`Akun guru ${nameToDelete} berhasil dihapus.`);
        setTeachers((prev) => prev.filter((t) => t.id !== idToDelete));
        setDeletingTeacher(null);
        await loadData();
      } else {
        toast.error(data.error?.message || "Gagal menghapus akun guru.");
      }
    } catch {
      toast.error("Terjadi kesalahan saat menghapus guru.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleStatus = async (teacher: any) => {
    const nextStatus = teacher.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      const res = await fetch(`/api/v1/admin/teachers/${teacher.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Status akun ${teacher.name} diubah menjadi ${nextStatus === "ACTIVE" ? "Aktif" : "Nonaktif"}.`);
        loadData();
      }
    } catch {
      toast.error("Gagal mengubah status guru.");
    }
  };

  const handleResetPassword = async () => {
    if (!passwordResetTeacher || !newPassword) {
      toast.error("Masukkan kata sandi baru.");
      return;
    }

    try {
      const res = await fetch(`/api/v1/admin/teachers/${passwordResetTeacher.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Kata sandi untuk ${passwordResetTeacher.name} berhasil direset!`);
        setPasswordResetTeacher(null);
        setNewPassword("");
      }
    } catch {
      toast.error("Gagal mereset kata sandi.");
    }
  };

  const filteredTeachers = teachers.filter((t) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return t.name.toLowerCase().includes(q) || (t.email && t.email.toLowerCase().includes(q)) || t.username.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E0F2C2] pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Kelola Akun Guru</h1>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">
            Daftar guru pengampu yang berwenang membuat dan menyelenggarakan ujian sekolah
          </p>
        </div>

        <Button onClick={() => setShowCreateModal(true)} className="gap-2 font-black shadow-md bg-[#7AB82A] hover:bg-[#6AA421] text-white rounded-2xl">
          <PlusCircle className="h-4 w-4" />
          <span>Tambah Akun Guru</span>
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Cari nama atau username guru..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 text-xs rounded-2xl border-2 border-[#D5EFA9] focus-visible:ring-[#7AB82A]"
          />
        </div>
      </div>

      {/* Teachers Table */}
      <Card className="shadow-md border-2 border-[#D8EEB6] rounded-[28px] overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F4FBEB] text-[#4B7914] uppercase font-black border-b border-[#D8EEB6]">
              <tr>
                <th className="py-3.5 px-4">Nama Lengkap</th>
                <th className="py-3.5 px-4">Username</th>
                <th className="py-3.5 px-4">Kelas Mengajar</th>
                <th className="py-3.5 px-4">Ujian</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E0F2C2]">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                    Memuat data guru...
                  </td>
                </tr>
              ) : filteredTeachers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                    Tidak ada data guru yang ditemukan.
                  </td>
                </tr>
              ) : (
                filteredTeachers.map((teacher) => (
                  <tr key={teacher.id} className="hover:bg-[#F9FCF5] transition-colors">
                    <td className="py-3.5 px-4 font-black text-slate-900">{teacher.name}</td>
                    <td className="py-3.5 px-4 font-bold text-[#578A1A] font-mono">{teacher.username}</td>
                    <td className="py-3.5 px-4 max-w-xs truncate text-slate-600 font-medium">
                      {Array.from(new Set(teacher.teacherClasses?.map((tc: any) => `Kelas ${tc.class.name}`) || [])).join(", ") || "Semua Kelas"}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-700">
                      {teacher._count?.exams || 0} Ujian
                    </td>
                    <td className="py-3.5 px-4">
                      {teacher.status === "ACTIVE" ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-200">
                          Nonaktif
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(teacher)}
                          className="h-8 text-xs gap-1 text-[#578A1A] hover:text-[#416812] hover:bg-[#EBF7D9] rounded-xl font-bold"
                          title="Edit Guru"
                        >
                          <Edit className="h-3.5 w-3.5" />
                          <span>Edit</span>
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPasswordResetTeacher(teacher)}
                          className="h-8 text-xs gap-1 text-slate-600 hover:bg-slate-100 rounded-xl"
                          title="Reset Password"
                        >
                          <KeyRound className="h-3.5 w-3.5 text-amber-600" />
                          <span className="hidden sm:inline">Password</span>
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleStatus(teacher)}
                          className={teacher.status === "ACTIVE" ? "h-8 text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-xl" : "h-8 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl"}
                          title={teacher.status === "ACTIVE" ? "Nonaktifkan Guru" : "Aktifkan Guru"}
                        >
                          <PowerOff className="h-3.5 w-3.5" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeletingTeacher(teacher)}
                          className="h-8 text-xs text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl font-bold"
                          title="Hapus Guru"
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

      {/* Create Teacher Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-slate-900">Tambah Akun Guru Baru</DialogTitle>
          <DialogDescription className="text-xs text-slate-500 font-semibold">
            Masukkan nama, username, password, dan pilih kelas yang diajar oleh guru.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleCreateTeacher} className="space-y-4 my-2 text-xs">
          <div>
            <label className="block font-black uppercase tracking-wider text-[#4B7914] mb-1">
              Nama Lengkap Guru <span className="text-rose-500">*</span>
            </label>
            <Input
              placeholder="Contoh: Pak Budi Santoso, S.Pd."
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="h-11 text-xs rounded-xl border-2 border-[#D5EFA9] focus-visible:ring-[#7AB82A]"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-black uppercase tracking-wider text-[#4B7914] mb-1">
                Username Login <span className="text-rose-500">*</span>
              </label>
              <Input
                placeholder="Contoh: budi"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="h-11 text-xs font-mono rounded-xl border-2 border-[#D5EFA9] focus-visible:ring-[#7AB82A]"
              />
            </div>
            <div>
              <label className="block font-black uppercase tracking-wider text-[#4B7914] mb-1">
                Password Awal <span className="text-rose-500">*</span>
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11 text-xs rounded-xl border-2 border-[#D5EFA9] focus-visible:ring-[#7AB82A]"
              />
            </div>
          </div>

          {/* Classes Assignment */}
          <div>
            <label className="block font-black uppercase tracking-wider text-[#4B7914] mb-1.5">
              Pilih Kelas yang Diajar:
            </label>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {classes.map((cls) => {
                const isSelected = selectedClassIds.includes(cls.id);
                return (
                  <button
                    key={cls.id}
                    type="button"
                    onClick={() =>
                      setSelectedClassIds((prev) =>
                        isSelected ? prev.filter((id) => id !== cls.id) : [...prev, cls.id]
                      )
                    }
                    className={isSelected ? "px-3 py-1.5 rounded-xl text-xs font-black bg-[#7AB82A] text-white shadow-sm transition-all" : "px-3 py-1.5 rounded-xl text-xs font-bold border border-[#D5EFA9] bg-[#F4FBEB] text-slate-700 hover:bg-[#EBF7D9] transition-all"}
                  >
                    Kelas {cls.name}
                  </button>
                );
              })}
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)} className="rounded-xl">
              Batal
            </Button>
            <Button type="submit" isLoading={isSubmitting} className="font-black bg-[#7AB82A] hover:bg-[#6AA421] text-white rounded-xl shadow-md">
              Buat Akun Guru
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Edit Teacher Modal */}
      <Dialog open={Boolean(editingTeacher)} onOpenChange={() => setEditingTeacher(null)}>
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-slate-900">Edit Data Akun Guru</DialogTitle>
          <DialogDescription className="text-xs text-slate-500 font-semibold">
            Ubah nama, username login, kata sandi, atau penugasan kelas untuk guru ini.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleUpdateTeacher} className="space-y-4 my-2 text-xs">
          <div>
            <label className="block font-black uppercase tracking-wider text-[#4B7914] mb-1">
              Nama Lengkap Guru <span className="text-rose-500">*</span>
            </label>
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              required
              className="h-11 text-xs rounded-xl border-2 border-[#D5EFA9] focus-visible:ring-[#7AB82A]"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-black uppercase tracking-wider text-[#4B7914] mb-1">
                Username Login <span className="text-rose-500">*</span>
              </label>
              <Input
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
                required
                className="h-11 text-xs font-mono rounded-xl border-2 border-[#D5EFA9] focus-visible:ring-[#7AB82A]"
              />
            </div>
            <div>
              <label className="block font-black uppercase tracking-wider text-[#4B7914] mb-1">
                Ganti Password (Opsional)
              </label>
              <Input
                type="password"
                placeholder="Kosongkan jika tidak diubah"
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
                className="h-11 text-xs rounded-xl border-2 border-[#D5EFA9] focus-visible:ring-[#7AB82A]"
              />
            </div>
          </div>

          {/* Classes Assignment in Edit */}
          <div>
            <label className="block font-black uppercase tracking-wider text-[#4B7914] mb-1.5">
              Pilih Kelas yang Diajar:
            </label>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {classes.map((cls) => {
                const isSelected = editClassIds.includes(cls.id);
                return (
                  <button
                    key={cls.id}
                    type="button"
                    onClick={() =>
                      setEditClassIds((prev) =>
                        isSelected ? prev.filter((id) => id !== cls.id) : [...prev, cls.id]
                      )
                    }
                    className={isSelected ? "px-3 py-1.5 rounded-xl text-xs font-black bg-[#7AB82A] text-white shadow-sm transition-all" : "px-3 py-1.5 rounded-xl text-xs font-bold border border-[#D5EFA9] bg-[#F4FBEB] text-slate-700 hover:bg-[#EBF7D9] transition-all"}
                  >
                    Kelas {cls.name}
                  </button>
                );
              })}
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setEditingTeacher(null)} className="rounded-xl">
              Batal
            </Button>
            <Button type="submit" isLoading={isUpdating} className="font-black bg-[#7AB82A] hover:bg-[#6AA421] text-white rounded-xl shadow-md">
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Delete Teacher Modal */}
      <Dialog open={Boolean(deletingTeacher)} onOpenChange={() => setDeletingTeacher(null)}>
        <DialogHeader>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 mb-2 mx-auto">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <DialogTitle className="text-center text-xl font-black text-slate-900">
            Hapus Akun Guru?
          </DialogTitle>
          <DialogDescription className="text-center text-xs text-slate-500 font-semibold">
            Apakah Anda yakin ingin menghapus akun guru <strong>{deletingTeacher?.name}</strong> (@{deletingTeacher?.username})? Tindakan ini tidak dapat dibatalkan.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 pt-2 sm:justify-between">
          <Button variant="outline" onClick={() => setDeletingTeacher(null)} className="rounded-xl">
            Batal
          </Button>
          <Button
            onClick={handleDeleteTeacher}
            isLoading={isDeleting}
            className="font-black bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-md"
          >
            Ya, Hapus Akun Guru
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Reset Password Modal */}
      <Dialog open={Boolean(passwordResetTeacher)} onOpenChange={() => setPasswordResetTeacher(null)}>
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-slate-900">Reset Kata Sandi Guru</DialogTitle>
          <DialogDescription className="text-xs text-slate-500 font-semibold">
            Guru: <strong>{passwordResetTeacher?.name}</strong> (@{passwordResetTeacher?.username})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 my-2 text-xs">
          <div>
            <label className="block font-black uppercase tracking-wider text-[#4B7914] mb-1">
              Kata Sandi Baru
            </label>
            <Input
              type="password"
              placeholder="Masukkan password baru..."
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="h-11 text-xs rounded-xl border-2 border-[#D5EFA9] focus-visible:ring-[#7AB82A]"
              autoFocus
            />
          </div>
        </div>

        <DialogFooter className="gap-2 pt-2">
          <Button variant="outline" onClick={() => setPasswordResetTeacher(null)} className="rounded-xl">
            Batal
          </Button>
          <Button onClick={handleResetPassword} className="font-black bg-[#7AB82A] hover:bg-[#6AA421] text-white rounded-xl shadow-md">
            Simpan Password Baru
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
