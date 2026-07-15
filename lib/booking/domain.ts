import { BookingStatus, PrismaClient } from "@prisma/client";

export const BLOCKING_BOOKING_STATUSES = [
  BookingStatus.PENDING,
  BookingStatus.QUOTED,
  BookingStatus.AWAITING_APPROVAL,
  BookingStatus.CONFIRMED,
  BookingStatus.ICAL_IMPORTED,
] as const;

export type BookingValidationInput = {
  checkInDate: Date;
  checkOutDate: Date;
  adultCount: number;
  childCount: number;
  childAges: readonly number[];
};

export class BookingValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BookingValidationError";
  }
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function calculateNumberOfNights(checkInDate: Date, checkOutDate: Date): number {
  return Math.round((startOfUtcDay(checkOutDate).getTime() - startOfUtcDay(checkInDate).getTime()) / 86_400_000);
}

export function doBookingIntervalsOverlap(
  firstStart: Date,
  firstEnd: Date,
  secondStart: Date,
  secondEnd: Date,
): boolean {
  return firstStart < secondEnd && secondStart < firstEnd;
}

export function validateBookingDates(input: BookingValidationInput, now = new Date()): void {
  const checkIn = startOfUtcDay(input.checkInDate);
  const checkOut = startOfUtcDay(input.checkOutDate);

  if (checkOut <= checkIn || calculateNumberOfNights(checkIn, checkOut) < 1) {
    throw new BookingValidationError("A távozás dátumának legalább egy nappal későbbinek kell lennie az érkezésnél.");
  }
  if (checkIn < startOfUtcDay(now)) {
    throw new BookingValidationError("Múltbeli érkezési dátum nem engedélyezett.");
  }
  if (!Number.isInteger(input.adultCount) || input.adultCount < 1) {
    throw new BookingValidationError("Legalább egy felnőtt vendég szükséges.");
  }
  if (!Number.isInteger(input.childCount) || input.childCount < 0) {
    throw new BookingValidationError("A gyermekek száma nem lehet negatív.");
  }
  if (input.childCount !== input.childAges.length) {
    throw new BookingValidationError("A gyermekek száma és a gyermekkor rekordok száma nem egyezik.");
  }
  if (input.childAges.some((age) => !Number.isInteger(age) || age < 0)) {
    throw new BookingValidationError("A gyermekek életkora csak nem negatív egész szám lehet.");
  }
}

type AvailabilityClient = Pick<PrismaClient, "booking" | "calendarBlock">;

export type AvailabilityInput = {
  unitId: string;
  checkInDate: Date;
  checkOutDate: Date;
  excludeBookingId?: string;
};

export type AvailabilityResult =
  | { available: true }
  | { available: false; blockedBy: "BOOKING" | "CALENDAR_BLOCK"; conflictId: string };

/** Server-side availability check using half-open interval predicates in PostgreSQL. */
export async function checkAvailability(
  prisma: AvailabilityClient,
  input: AvailabilityInput,
): Promise<AvailabilityResult> {
  if (input.checkOutDate <= input.checkInDate) {
    throw new BookingValidationError("Érvénytelen foglalási intervallum.");
  }

  const overlap = {
    unitId: input.unitId,
    checkInDate: { lt: input.checkOutDate },
    checkOutDate: { gt: input.checkInDate },
    status: { in: [...BLOCKING_BOOKING_STATUSES] },
    ...(input.excludeBookingId ? { id: { not: input.excludeBookingId } } : {}),
  };

  const [booking, calendarBlock] = await Promise.all([
    prisma.booking.findFirst({ where: overlap, select: { id: true } }),
    prisma.calendarBlock.findFirst({
      where: {
        unitId: input.unitId,
        startDate: { lt: input.checkOutDate },
        endDate: { gt: input.checkInDate },
      },
      select: { id: true },
    }),
  ]);

  if (booking) return { available: false, blockedBy: "BOOKING", conflictId: booking.id };
  if (calendarBlock) return { available: false, blockedBy: "CALENDAR_BLOCK", conflictId: calendarBlock.id };
  return { available: true };
}
