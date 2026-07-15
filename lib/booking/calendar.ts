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

export function parseLocalDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year!, month! - 1, day!);
}

export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export const parseDateOnly = parseLocalDate;
export const toDateOnly = formatLocalDate;

export function addLocalDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function startOfLocalToday(now = new Date()): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function getCalendarDayAvailability(
  date: Date,
  intervals: readonly PublicAvailabilityInterval[],
  now = new Date(),
): CalendarDayAvailability {
  const day = formatLocalDate(date);
  const isPast = day < formatLocalDate(startOfLocalToday(now));
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
  if (formatLocalDate(checkIn) < formatLocalDate(startOfLocalToday(now)) || checkOut <= checkIn) return false;
  return !intervals.some((interval) =>
    doBookingIntervalsOverlap(checkIn, checkOut, parseLocalDate(interval.start), parseLocalDate(interval.end)),
  );
}

export function getMonthGrid(month: Date): Array<Date | null> {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const mondayOffset = (first.getDay() + 6) % 7;
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  return [
    ...Array<null>(mondayOffset).fill(null),
    ...Array.from({ length: days }, (_, index) => new Date(month.getFullYear(), month.getMonth(), index + 1)),
  ];
}
