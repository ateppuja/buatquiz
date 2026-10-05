import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, signUserToken } from "@/lib/auth";
import { nanoid } from "nanoid";

export const dynamic = "force-dynamic";

function decodeJwtPayload(token: string) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf-8"));
    return payload;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  const proto = req.headers.get("x-forwarded-proto") || url.protocol.replace(":", "");
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || url.host;
  const origin = process.env.NEXT_PUBLIC_APP_URL || `${proto}://${host}`;
  const redirectUri = `${origin}/api/v1/auth/google/callback`;

  if (error || !code) {
    console.warn("Google OAuth was cancelled or returned an error:", error);
    return NextResponse.redirect(new URL("/login?error=google_cancelled", origin));
  }

  const clientId =
    process.env.GOOGLE_CLIENT_ID ||
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    "";
  
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";

  try {
    let userEmail = "";
    let userName = "";

    // 1. Exchange code with Google
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenRes.json();

    if (tokenData.id_token) {
      const decoded = decodeJwtPayload(tokenData.id_token);
      if (decoded && decoded.email) {
        userEmail = String(decoded.email).toLowerCase().trim();
        userName = decoded.name || decoded.given_name || userEmail.split("@")[0];
      }
    }

    if (!userEmail && tokenData.access_token) {
      // Fetch user profile from Google UserInfo API
      const profileRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      if (profileRes.ok) {
        const profile = await profileRes.json();
        userEmail = String(profile.email || "").toLowerCase().trim();
        userName = profile.name || profile.given_name || userEmail.split("@")[0];
      }
    }

    if (!userEmail) {
      console.error("Failed to get Google user email from token data:", tokenData);
      return NextResponse.redirect(new URL("/login?error=google_email_not_found", origin));
    }

    // 2. Lookup or Auto-Register Teacher in Database
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
      isNewUser = true;

      // Find or create default school
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

      const randomPassword = nanoid(24);
      const passwordHash = await hashPassword(randomPassword);

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

      // Audit Log
      await prisma.auditLog.create({
        data: {
          schoolId: school.id,
          userId: user.id,
          action: "TEACHER_REGISTERED_VIA_GOOGLE_OAUTH",
          details: `Pendaftaran akun guru baru via Google OAuth: ${user.name} (${user.email})`,
        },
      }).catch(() => {});
    }

    if (user.status !== "ACTIVE") {
      return NextResponse.redirect(new URL("/login?error=account_inactive", origin));
    }

    // 3. Generate Auth Session Token
    const token = await signUserToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role as "ADMIN" | "TEACHER",
      schoolId: user.schoolId,
    });

    // 4. Redirect to Teacher/Admin Dashboard with Auth Cookie
    const targetUrl = user.role === "ADMIN" ? `${origin}/admin/dashboard` : `${origin}/teacher/dashboard`;
    const response = NextResponse.redirect(new URL(targetUrl));

    response.cookies.set("examcode_auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("Error handling Google OAuth Callback:", err);
    return NextResponse.redirect(new URL("/login?error=google_server_error", origin));
  }
}
