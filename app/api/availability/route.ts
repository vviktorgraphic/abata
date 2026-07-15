import { NextRequest, NextResponse } from "next/server";
import { getPublicAvailabilityIntervals } from "@/lib/booking/availability";
import { prisma } from "@/lib/prisma";

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function parseRangeDate(value: string | null): Date | null {
  if (!value || !DATE_ONLY_PATTERN.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year!, month! - 1, day!));
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : date;
}

function addUtcMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setUTCMonth(result.getUTCMonth() + months);
  return result;
}

export async function GET(request: NextRequest) {
  const fromValue = request.nextUrl.searchParams.get("from");
  const toValue = request.nextUrl.searchParams.get("to");
  const from = parseRangeDate(fromValue);
  const to = parseRangeDate(toValue);

  if (!from || !to || to <= from) {
    return NextResponse.json(
      { error: { code: "INVALID_DATE_RANGE", message: "A from és to paraméterek érvényes YYYY-MM-DD dátumok legyenek, és to legyen későbbi." } },
      { status: 400 },
    );
  }
  if (to > addUtcMonths(from, 12)) {
    return NextResponse.json(
      { error: { code: "RANGE_TOO_LARGE", message: "Legfeljebb 12 hónapos időszak kérhető le." } },
      { status: 400 },
    );
  }

  // `to` is an exclusive API boundary, matching the booking domain.
  const intervals = await getPublicAvailabilityIntervals(prisma, from, to);
  return NextResponse.json({ range: { from: fromValue, to: toValue }, intervals });
}
