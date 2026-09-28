import { NextResponse } from "next/server";
import { getCurrentUser, verifyPassword, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: Request) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Sesi telah berakhir. Silakan login kembali." } },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { currentPassword, newPassword, confirmPassword, name, username } = body;

    // Find current user in DB
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Akun pengguna tidak ditemukan." } },
        { status: 404 }
      );
    }

    const updateData: any = {};

    // If updating name or username
    if (name && name.trim().length > 0) {
      updateData.name = name.trim();
    }

    if (username && username.trim().length > 0 && username.trim() !== user.username) {
      // Check if username already taken
      const existingUser = await prisma.user.findFirst({
        where: {
          username: username.trim(),
          id: { not: user.id },
        },
      });

      if (existingUser) {
        return NextResponse.json(
          { success: false, error: { code: "USERNAME_EXISTS", message: `Username "${username}" sudah digunakan akun lain.` } },
          { status: 400 }
        );
      }
      updateData.username = username.trim();
    }

    // If changing password
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { success: false, error: { code: "INVALID_INPUT", message: "Masukkan password saat ini untuk keamanan." } },
          { status: 400 }
        );
      }

      // Verify current password
      const isValid = await verifyPassword(currentPassword, user.passwordHash);
      if (!isValid) {
        return NextResponse.json(
          { success: false, error: { code: "WRONG_PASSWORD", message: "Password saat ini salah." } },
          { status: 400 }
        );
      }

      if (newPassword.length < 6) {
        return NextResponse.json(
          { success: false, error: { code: "INVALID_INPUT", message: "Password baru minimal harus 6 karakter." } },
          { status: 400 }
        );
      }

      if (newPassword !== confirmPassword) {
        return NextResponse.json(
          { success: false, error: { code: "PASSWORD_MISMATCH", message: "Konfirmasi password baru tidak cocok." } },
          { status: 400 }
        );
      }

      updateData.passwordHash = await hashPassword(newPassword);
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: { code: "NO_CHANGES", message: "Tidak ada perubahan data yang dimasukkan." } },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });

    await prisma.auditLog.create({
      data: {
        schoolId: user.schoolId,
        userId: user.id,
        action: newPassword ? "CHANGE_PASSWORD" : "UPDATE_PROFILE",
        details: JSON.stringify({
          userId: user.id,
          username: updatedUser.username,
          passwordChanged: Boolean(newPassword),
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Akun dan password berhasil diperbarui!",
      data: {
        id: updatedUser.id,
        name: updatedUser.name,
        username: updatedUser.username,
        role: updatedUser.role,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Gagal memperbarui password." } },
      { status: 500 }
    );
  }
}
