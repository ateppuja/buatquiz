import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Sesi tidak valid atau telah berakhir." } },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        school: true,
        teacherClasses: {
          include: {
            class: true,
            subject: true,
          },
        },
      },
    });

    if (!user || user.status !== "ACTIVE") {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Pengguna tidak ditemukan atau tidak aktif." } },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role,
        schoolName: user.school?.name,
        teacherClasses: user.teacherClasses,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Gagal mengambil data profil." } },
      { status: 500 }
    );
  }
}
