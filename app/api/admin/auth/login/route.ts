import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { AuthRateLimitError, InvalidCredentialsError, startAdminLogin } from "@/lib/admin-auth/service";
import { noStoreHeaders, validateAuthRequest } from "@/lib/admin-auth/request-security";

const schema = z.object({ email: z.email(), password: z.string().min(1).max(1024) });
const error = (status: number, code: string, message: string) => NextResponse.json({ error: { code, message } }, { status, headers: noStoreHeaders });
export async function POST(request: NextRequest) {
  const rejected = validateAuthRequest(request); if (rejected) return error(rejected.status, rejected.code, "A kérés nem fogadható el.");
  let body: unknown; try { body = await request.json(); } catch { return error(400, "INVALID_JSON", "A kérés nem értelmezhető."); }
  const parsed = schema.safeParse(body); if (!parsed.success) return error(422, "VALIDATION_ERROR", "Ellenőrizd a megadott adatokat.");
  try {
    const result = await startAdminLogin(prisma, parsed.data);
    return NextResponse.json({ ...result, nextStep: "TWO_FACTOR_REQUIRED" }, { headers: noStoreHeaders });
  } catch (caught) {
    if (caught instanceof AuthRateLimitError) return error(429, "TOO_MANY_REQUESTS", "Várj az újabb kód kérése előtt.");
    if (caught instanceof InvalidCredentialsError) return error(401, "INVALID_CREDENTIALS", "A megadott bejelentkezési adatok érvénytelenek.");
    return error(500, "INTERNAL_ERROR", "A bejelentkezés átmenetileg nem érhető el.");
  }
}
