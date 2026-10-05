import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, signUserToken } from "@/lib/auth";
import { nanoid } from "nanoid";

function decodeGoogleIdToken(token: string) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf-8"));
    return payload;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { credential, email, name, picture } = body;

    let userEmail = "";
    let userName = "";

    if (credential) {
      // Decode Google ID Token from Google Identity Services
      const googleData = decodeGoogleIdToken(credential);
      if (googleData && googleData.email) {
        userEmail = googleData.email.toLowerCase().trim();
        userName = googleData.name || googleData.given_name || userEmail.split("@")[0];
      }
    } else if (email) {
      userEmail = String(email).toLowerCase().trim();
      userName = name ? String(name).trim() : userEmail.split("@")[0];
    }

    if (!userEmail || !userEmail.includes("@")) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_GMAIL", message: "Alamat email Gmail tidak valid." } },
        { status: 400 }
      );
    }

    // Check if email format is standard email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_EMAIL_FORMAT", message: "Format email tidak valid." } },
        { status: 400 }
      );
    }

    // 1. Check if user already exists
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: userEmail },
          { username: userEmail },
        ],
      },
      include: { school: true },
    });

    let isNewUser = false;

    if (!user) {
      // 2. New Teacher Registration via Gmail
      isNewUser = true;

      // Find primary school in the system or create default if none exists
      let school = await prisma.school.findFirst();
      if (!school) {
        school = await prisma.school.create({
          data: {
            name: process.env.NEXT_PUBLIC_APP_NAME || "WhiteBee School of Life",
            timezone: "Asia/Jakarta",
          },
        });
      }

      // Generate a clean and unique username
      const baseUsername = userEmail
        .split("@")[0]
        .toLowerCase()
        .replace(/[^a-z0-9_.]/g, "") || `guru_${nanoid(5)}`;
      
      let uniqueUsername = baseUsername;
      let suffix = 1;
      while (await prisma.user.findUnique({ where: { username: uniqueUsername } })) {
        uniqueUsername = `${baseUsername}${suffix++}`;
      }

      // Generate secure random password hash
      const randomPassword = nanoid(24);
      const passwordHash = await hashPassword(randomPassword);

      // Create new Teacher user
      user = await prisma.user.create({
        data: {
          schoolId: school.id,
          name: userName || "Guru Baru",
          email: userEmail,
          username: uniqueUsername,
          passwordHash,
          role: "TEACHER",
          status: "ACTIVE",
        },
        include: { school: true },
      });

      // Record audit log
      await prisma.auditLog.create({
        data: {
          schoolId: school.id,
          userId: user.id,
          action: "TEACHER_REGISTERED_VIA_GMAIL",
          details: `Pendaftaran akun guru baru via Gmail: ${user.name} (${user.email})`,
        },
      }).catch(() => {});
    }

    if (user.status !== "ACTIVE") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "ACCOUNT_INACTIVE",
            message: "Akun guru Anda telah dinonaktifkan oleh administrator sekolah.",
          },
        },
        { status: 403 }
      );
    }

    // 3. Generate Auth Session Token
    const token = await signUserToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role as "ADMIN" | "TEACHER",
      schoolId: user.schoolId,
    });

    const response = NextResponse.json({
      success: true,
      data: {
        isNewUser,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          username: user.username,
          role: user.role,
          schoolName: user.school?.name,
        },
      },
      message: isNewUser
        ? `Akun Guru Baru berhasil dibuat! Selamat datang, ${user.name}.`
        : `Selamat datang kembali, ${user.name}.`,
    });

    // 4. Set secure HTTP-only cookie
    response.cookies.set("examcode_auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Google/Gmail login error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Gagal memproses autentikasi Gmail." } },
      { status: 500 }
    );
  }
}
