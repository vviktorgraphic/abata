import type { PrismaClient } from "@prisma/client";
import { BLOCKING_BOOKING_STATUSES } from "./domain";

export type PublicAvailabilityInterval = {
  start: string;
  end: string;
  type: "BOOKING" | "BLOCK";
};

type AvailabilityReader = Pick<PrismaClient, "accommodationUnit" | "booking" | "calendarBlock">;

export function formatDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export async function getPublicAvailabilityIntervals(
  client: AvailabilityReader,
  from: Date,
  to: Date,
): Promise<PublicAvailabilityInterval[]> {
  const unit = await client.accommodationUnit.findFirst({ select: { id: true } });
  if (!unit) return [];

  const [bookings, blocks] = await Promise.all([
    client.booking.findMany({
      where: {
        unitId: unit.id,
        status: { in: [...BLOCKING_BOOKING_STATUSES] },
        checkInDate: { lt: to },
        checkOutDate: { gt: from },
      },
      select: { checkInDate: true, checkOutDate: true },
    }),
    client.calendarBlock.findMany({
      where: { unitId: unit.id, startDate: { lt: to }, endDate: { gt: from } },
      select: { startDate: true, endDate: true },
    }),
  ]);

  return [
    ...bookings.map((booking) => ({
      start: formatDateOnly(booking.checkInDate),
      end: formatDateOnly(booking.checkOutDate),
      type: "BOOKING" as const,
    })),
    ...blocks.map((block) => ({
      start: formatDateOnly(block.startDate),
      end: formatDateOnly(block.endDate),
      type: "BLOCK" as const,
    })),
  ].sort((a, b) => a.start.localeCompare(b.start));
}
