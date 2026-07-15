import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { InvalidCodeError, verifyAdminCode } from "@/lib/admin-auth/service";
import { getAuthConfig } from "@/lib/admin-auth/security";
import { noStoreHeaders, validateAuthRequest } from "@/lib/admin-auth/request-security";

const schema = z.object({ challengeToken: z.string().min(32).max(100), code: z.string().regex(/^\d{6}$/) });
const fail = (status: number, code: string, message: string) => NextResponse.json({ error: { code, message } }, { status, headers: noStoreHeaders });
export async function POST(request: NextRequest) {
  const rejected = validateAuthRequest(request); if (rejected) return fail(rejected.status, rejected.code, "A kérés nem fogadható el.");
  let body: unknown; try { body = await request.json(); } catch { return fail(400, "INVALID_JSON", "A kérés nem értelmezhető."); }
  const parsed = schema.safeParse(body); if (!parsed.success) return fail(422, "VALIDATION_ERROR", "Ellenőrizd a megadott adatokat.");
  try {
    const session = await verifyAdminCode(prisma, parsed.data); const config = getAuthConfig();
    const response = NextResponse.json({ authenticated: true }, { headers: noStoreHeaders });
    response.cookies.set(config.cookieName, session.sessionToken, { httpOnly: true, sameSite: "lax", secure: config.secureCookie, path: "/", expires: session.expiresAt });
    return response;
  } catch (caught) {
    if (caught instanceof InvalidCodeError) return fail(401, "INVALID_OR_EXPIRED_CODE", "A kód hibás vagy lejárt.");
    return fail(500, "INTERNAL_ERROR", "Az ellenőrzés átmenetileg nem érhető el.");
  }
}
