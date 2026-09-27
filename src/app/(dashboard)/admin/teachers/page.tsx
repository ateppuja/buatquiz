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
  PowerOff,
  KeyRound,
  BookOpen,
  Layers,
  ShieldCheck,
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

  // Form states
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);

  // Edit / Reset Modal state
  const [editingTeacher, setEditingTeacher] = useState<any>(null);
  const [newPassword, setNewPassword] = useState("");

  const loadData = async () => {
    try {
      const [resT, resC] = await Promise.all([
        fetch("/api/v1/admin/teachers"),
        fetch("/api/v1/admin/classes"),
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
        loadData();
      } else {
        toast.error(data.error?.message || "Gagal membuat guru.");
      }
    } catch {
      toast.error("Terjadi kesalahan.");
    } finally {
      setIsSubmitting(false);
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
    if (!editingTeacher || !newPassword) {
      toast.error("Masukkan kata sandi baru.");
      return;
    }

    try {
      const res = await fetch(`/api/v1/admin/teachers/${editingTeacher.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Kata sandi untuk ${editingTeacher.name} berhasil direset!`);
        setEditingTeacher(null);
        setNewPassword("");
      }
    } catch {
      toast.error("Gagal mereset kata sandi.");
    }
  };

  const filteredTeachers = teachers.filter((t) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return t.name.toLowerCase().includes(q) || t.email.toLowerCase().includes(q) || t.username.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Kelola Akun Guru</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Daftar guru pengampu yang berwenang membuat dan menyelenggarakan ujian sekolah
          </p>
        </div>

        <Button onClick={() => setShowCreateModal(true)} className="gap-2 font-bold shadow">
          <PlusCircle className="h-4 w-4" />
          <span>Tambah Akun Guru</span>
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama atau username guru..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 text-xs"
          />
        </div>
      </div>

      {/* Teachers Table */}
      <Card className="shadow-sm border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/60 text-muted-foreground uppercase font-semibold border-b border-border">
              <tr>
                <th className="py-3 px-4">Nama Lengkap</th>
                <th className="py-3 px-4">Username</th>
                <th className="py-3 px-4">Kelas Mengajar</th>
                <th className="py-3 px-4">Ujian</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    Memuat data guru...
                  </td>
                </tr>
              ) : filteredTeachers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    Tidak ada data guru yang ditemukan.
                  </td>
                </tr>
              ) : (
                filteredTeachers.map((teacher) => (
                  <tr key={teacher.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 font-bold text-foreground">{teacher.name}</td>
                    <td className="py-3 px-4 font-semibold text-foreground">{teacher.username}</td>
                    <td className="py-3 px-4 max-w-xs truncate text-muted-foreground">
                      {Array.from(new Set(teacher.teacherClasses?.map((tc: any) => `Kelas ${tc.class.name}`) || [])).join(", ") || "Semua Kelas"}
                    </td>
                    <td className="py-3 px-4 font-semibold text-foreground">
                      {teacher._count?.exams || 0} Ujian
                    </td>
                    <td className="py-3 px-4">
                      {teacher.status === "ACTIVE" ? (
                        <Badge variant="success" className="text-[10px]">Aktif</Badge>
                      ) : (
                        <Badge variant="destructive" className="text-[10px]">Nonaktif</Badge>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingTeacher(teacher)}
                          className="h-8 text-xs gap-1"
                          title="Reset Kata Sandi"
                        >
                          <KeyRound className="h-3.5 w-3.5" />
                          <span>Reset Password</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleStatus(teacher)}
                          className={teacher.status === "ACTIVE" ? "h-8 text-xs text-destructive hover:text-destructive" : "h-8 text-xs text-emerald-600 hover:text-emerald-700"}
                        >
                          <PowerOff className="h-3.5 w-3.5" />
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
          <DialogTitle>Tambah Akun Guru Baru</DialogTitle>
          <DialogDescription>
            Masukkan nama, username, password, dan pilih kelas yang diajar oleh guru.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleCreateTeacher} className="space-y-4 my-2 text-xs">
          <div>
            <label className="block font-semibold uppercase text-muted-foreground mb-1">
              Nama Lengkap Guru <span className="text-destructive">*</span>
            </label>
            <Input
              placeholder="Contoh: Pak Budi Santoso, S.Pd."
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="h-10 text-xs"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold uppercase text-muted-foreground mb-1">
                Username Login <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="Contoh: budi"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="h-10 text-xs font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold uppercase text-muted-foreground mb-1">
                Password Awal <span className="text-destructive">*</span>
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-10 text-xs"
              />
            </div>
          </div>

          {/* Classes Assignment */}
          <div>
            <label className="block font-semibold uppercase text-muted-foreground mb-1.5">
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
                    className={isSelected ? "px-3 py-1.5 rounded-lg text-xs font-bold bg-primary text-primary-foreground shadow-sm transition-all" : "px-3 py-1.5 rounded-lg text-xs border border-border bg-card text-muted-foreground hover:bg-muted transition-all"}
                  >
                    Kelas {cls.name}
                  </button>
                );
              })}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
              Batal
            </Button>
            <Button type="submit" isLoading={isSubmitting} className="font-bold">
              Buat Akun Guru
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Reset Password Modal */}
      <Dialog open={Boolean(editingTeacher)} onOpenChange={() => setEditingTeacher(null)}>
        <DialogHeader>
          <DialogTitle>Reset Kata Sandi Guru</DialogTitle>
          <DialogDescription>
            Guru: <strong>{editingTeacher?.name}</strong> ({editingTeacher?.email})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 my-2 text-xs">
          <div>
            <label className="block font-semibold uppercase text-muted-foreground mb-1">
              Kata Sandi Baru
            </label>
            <Input
              type="password"
              placeholder="Masukkan password baru..."
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="h-10 text-xs"
              autoFocus
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setEditingTeacher(null)}>
            Batal
          </Button>
          <Button onClick={handleResetPassword} className="font-bold">
            Simpan Password Baru
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
