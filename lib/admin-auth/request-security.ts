import type { NextRequest } from "next/server";

export function validateAuthRequest(request: NextRequest) {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return { status: 400, code: "INVALID_CONTENT_TYPE" };
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) return { status: 403, code: "CROSS_ORIGIN_REQUEST" };
  return null;
}
export const noStoreHeaders = { "Cache-Control": "no-store, max-age=0" };
