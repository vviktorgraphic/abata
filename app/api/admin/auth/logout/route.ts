import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { revokeAdminSession } from "@/lib/admin-auth/service";
import { getAuthConfig } from "@/lib/admin-auth/security";
import { noStoreHeaders, validateAuthRequest } from "@/lib/admin-auth/request-security";
export async function POST(request: NextRequest) {
  const rejected = validateAuthRequest(request); if (rejected) return NextResponse.json({ error: { code: rejected.code, message: "A kérés nem fogadható el." } }, { status: rejected.status, headers: noStoreHeaders });
  const config = getAuthConfig(); await revokeAdminSession(prisma, request.cookies.get(config.cookieName)?.value);
  const response = NextResponse.json({ authenticated: false }, { headers: noStoreHeaders });
  response.cookies.set(config.cookieName, "", { httpOnly: true, sameSite: "lax", secure: config.secureCookie, path: "/", expires: new Date(0) });
  return response;
}
