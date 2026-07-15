import { doBookingIntervalsOverlap } from "./domain";
import type { PublicAvailabilityInterval } from "./availability";

export type CalendarDayAvailability = {
  canCheckIn: boolean;
  canCheckOut: boolean;
  isFullyBlocked: boolean;
  isPast: boolean;
  hasArrivalBoundary: boolean;
  hasDepartureBoundary: boolean;
};

export function parseDateOnly(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

export function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addUtcDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

export function startOfUtcToday(now = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export function getCalendarDayAvailability(
  date: Date,
  intervals: readonly PublicAvailabilityInterval[],
  now = new Date(),
): CalendarDayAvailability {
  const day = toDateOnly(date);
  const isPast = date < startOfUtcToday(now);
  const hasArrivalBoundary = intervals.some((interval) => interval.start === day);
  const hasDepartureBoundary = intervals.some((interval) => interval.end === day);
  const isFullyBlocked = intervals.some((interval) => day > interval.start && day < interval.end);

  return {
    canCheckIn: !isPast && !isFullyBlocked && !hasArrivalBoundary,
    canCheckOut: !isPast && !isFullyBlocked && !hasDepartureBoundary,
    isFullyBlocked,
    isPast,
    hasArrivalBoundary,
    hasDepartureBoundary,
  };
}

export function isSelectableBookingInterval(
  checkIn: Date,
  checkOut: Date,
  intervals: readonly PublicAvailabilityInterval[],
  now = new Date(),
): boolean {
  if (checkIn < startOfUtcToday(now) || checkOut <= checkIn) return false;
  return !intervals.some((interval) =>
    doBookingIntervalsOverlap(checkIn, checkOut, parseDateOnly(interval.start), parseDateOnly(interval.end)),
  );
}

export function getMonthGrid(month: Date): Array<Date | null> {
  const first = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth(), 1));
  const mondayOffset = (first.getUTCDay() + 6) % 7;
  const days = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 0)).getUTCDate();
  return [
    ...Array<null>(mondayOffset).fill(null),
    ...Array.from({ length: days }, (_, index) => new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth(), index + 1))),
  ];
}
