import { BookingStatus } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import {
  BookingValidationError,
  calculateNumberOfNights,
  checkAvailability,
  doBookingIntervalsOverlap,
  validateBookingDates,
} from "@/lib/booking/domain";

const date = (isoDate: string) => new Date(`${isoDate}T00:00:00.000Z`);
const validInput = {
  checkInDate: date("2030-07-05"),
  checkOutDate: date("2030-07-10"),
  adultCount: 2,
  childCount: 1,
  childAges: [8],
};

describe("booking interval rules", () => {
  it("does not overlap for consecutive bookings", () => {
    expect(doBookingIntervalsOverlap(date("2030-07-05"), date("2030-07-10"), date("2030-07-10"), date("2030-07-15"))).toBe(false);
  });

  it("overlaps for partially overlapping bookings", () => {
    expect(doBookingIntervalsOverlap(date("2030-07-05"), date("2030-07-10"), date("2030-07-09"), date("2030-07-15"))).toBe(true);
  });

  it("overlaps when an interval is fully contained", () => {
    expect(doBookingIntervalsOverlap(date("2030-07-05"), date("2030-07-15"), date("2030-07-07"), date("2030-07-10"))).toBe(true);
  });

  it("calculates nights from date boundaries", () => {
    expect(calculateNumberOfNights(date("2030-07-05"), date("2030-07-10"))).toBe(5);
  });
});

describe("validateBookingDates", () => {
  it("rejects identical check-in and check-out dates", () => {
    expect(() => validateBookingDates({ ...validInput, checkOutDate: validInput.checkInDate }, date("2030-01-01"))).toThrow(BookingValidationError);
  });

  it("rejects a past check-in date", () => {
    expect(() => validateBookingDates(validInput, date("2030-07-06"))).toThrow("Múltbeli");
  });

  it("rejects a child count that differs from child records", () => {
    expect(() => validateBookingDates({ ...validInput, childCount: 2 }, date("2030-01-01"))).toThrow("nem egyezik");
  });
});

function prismaMock(booking: { id: string } | null, calendarBlock: { id: string } | null) {
  return {
    booking: { findFirst: vi.fn().mockResolvedValue(booking) },
    calendarBlock: { findFirst: vi.fn().mockResolvedValue(calendarBlock) },
  };
}

describe("checkAvailability", () => {
  const input = { unitId: "unit-1", checkInDate: date("2030-07-10"), checkOutDate: date("2030-07-15") };

  it("does not let CANCELLED bookings block in the database query", async () => {
    const prisma = prismaMock(null, null);
    await expect(checkAvailability(prisma as never, input)).resolves.toEqual({ available: true });
    const where = prisma.booking.findFirst.mock.calls[0]?.[0].where;
    expect(where.status.in).not.toContain(BookingStatus.CANCELLED);
  });

  it("lets CONFIRMED bookings block in the database query", async () => {
    const prisma = prismaMock({ id: "booking-1" }, null);
    await expect(checkAvailability(prisma as never, input)).resolves.toEqual({
      available: false,
      blockedBy: "BOOKING",
      conflictId: "booking-1",
    });
    const where = prisma.booking.findFirst.mock.calls[0]?.[0].where;
    expect(where.status.in).toContain(BookingStatus.CONFIRMED);
    expect(where.checkInDate).toEqual({ lt: input.checkOutDate });
    expect(where.checkOutDate).toEqual({ gt: input.checkInDate });
  });

  it("lets CalendarBlock records block", async () => {
    const prisma = prismaMock(null, { id: "block-1" });
    await expect(checkAvailability(prisma as never, input)).resolves.toEqual({
      available: false,
      blockedBy: "CALENDAR_BLOCK",
      conflictId: "block-1",
    });
  });
});
