import { NextResponse, NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const origin = process.env.NEXT_PUBLIC_APP_URL || `${url.protocol}//${url.host}`;
    const redirectUri = `${origin}/api/v1/auth/google/callback`;

    const clientId =
      process.env.GOOGLE_CLIENT_ID ||
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    if (!clientId || clientId.startsWith("YOUR_")) {
      return NextResponse.redirect(new URL("/login?error=google_client_not_configured", origin));
    }

    // Google OAuth 2.0 Authorization Endpoint with prompt=select_account for account chooser
    const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    googleAuthUrl.searchParams.set("client_id", clientId);
    googleAuthUrl.searchParams.set("redirect_uri", redirectUri);
    googleAuthUrl.searchParams.set("response_type", "code");
    googleAuthUrl.searchParams.set("scope", "openid email profile");
    googleAuthUrl.searchParams.set("access_type", "online");
    googleAuthUrl.searchParams.set("prompt", "select_account"); // Forces Account Chooser (Pilih Akun)
    googleAuthUrl.searchParams.set("state", Buffer.from(JSON.stringify({ origin, timestamp: Date.now() })).toString("base64"));

    return NextResponse.redirect(googleAuthUrl.toString());
  } catch (error) {
    console.error("Failed to generate Google OAuth URL:", error);
    return NextResponse.redirect(new URL("/login?error=oauth_init_failed", req.url));
  }
}
