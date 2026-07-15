import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { BookingRequestError, createBookingRequest } from "@/lib/booking/create-booking";
import { BookingValidationError } from "@/lib/booking/domain";
import { bookingRequestSchema } from "@/lib/booking/request-validation";
import { prisma } from "@/lib/prisma";

function errorResponse(status: number, code: string, message: string, fieldErrors?: Record<string, string[]>) {
  return NextResponse.json({ error: { code, message, ...(fieldErrors ? { fieldErrors } : {}) } }, { status });
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(400, "INVALID_JSON", "A kérés törzse nem érvényes JSON.");
  }

  const idempotencyKey = request.headers.get("Idempotency-Key")?.trim();
  if (idempotencyKey && (idempotencyKey.length > 100 || !/^[A-Za-z0-9._:-]+$/.test(idempotencyKey))) {
    return errorResponse(400, "INVALID_IDEMPOTENCY_KEY", "Az Idempotency-Key formátuma érvénytelen.");
  }

  try {
    const input = bookingRequestSchema.parse(body);
    const response = await createBookingRequest(prisma, input, idempotencyKey);
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse(422, "VALIDATION_ERROR", "A megadott adatok hibásak.", error.flatten().fieldErrors);
    }
    if (error instanceof BookingValidationError) {
      return errorResponse(422, "VALIDATION_ERROR", error.message);
    }
    if (error instanceof BookingRequestError) {
      return errorResponse(error.status, error.code, error.message);
    }
    return errorResponse(500, "INTERNAL_ERROR", "A foglalási igény feldolgozása sikertelen.");
  }
}
