import { describe, expect, it } from "vitest";
import { getCalendarDayAvailability, isSelectableBookingInterval, parseDateOnly } from "@/lib/booking/calendar";
import { synchronizeChildAges } from "@/lib/booking/validation";

const intervals = [{ start: "2030-07-05", end: "2030-07-10", type: "BOOKING" as const }];
const now = parseDateOnly("2030-07-01");

describe("calendar day availability", () => {
  it("returns a fully free day", () => {
    expect(getCalendarDayAvailability(parseDateOnly("2030-07-04"), intervals, now)).toMatchObject({ canCheckIn: true, canCheckOut: true, isFullyBlocked: false });
  });

  it("returns a fully blocked interior day", () => {
    expect(getCalendarDayAvailability(parseDateOnly("2030-07-07"), intervals, now)).toMatchObject({ canCheckIn: false, canCheckOut: false, isFullyBlocked: true });
  });

  it("marks the departure boundary as check-in only", () => {
    expect(getCalendarDayAvailability(parseDateOnly("2030-07-10"), intervals, now)).toMatchObject({ canCheckIn: true, canCheckOut: false, hasDepartureBoundary: true });
  });

  it("marks the arrival boundary as check-out only", () => {
    expect(getCalendarDayAvailability(parseDateOnly("2030-07-05"), intervals, now)).toMatchObject({ canCheckIn: false, canCheckOut: true, hasArrivalBoundary: true });
  });

  it("allows a new arrival on an existing departure day", () => {
    expect(isSelectableBookingInterval(parseDateOnly("2030-07-10"), parseDateOnly("2030-07-12"), intervals, now)).toBe(true);
  });

  it("rejects a selection crossing a blocked interval", () => {
    expect(isSelectableBookingInterval(parseDateOnly("2030-07-04"), parseDateOnly("2030-07-11"), intervals, now)).toBe(false);
  });

  it("rejects a zero-night selection", () => {
    expect(isSelectableBookingInterval(parseDateOnly("2030-07-04"), parseDateOnly("2030-07-04"), intervals, now)).toBe(false);
  });

  it("rejects a past day", () => {
    expect(getCalendarDayAvailability(parseDateOnly("2030-06-30"), intervals, now).isPast).toBe(true);
  });
});

describe("child age synchronization", () => {
  it("adds and removes slots while preserving remaining ages", () => {
    expect(synchronizeChildAges([4], 3)).toEqual([4, undefined, undefined]);
    expect(synchronizeChildAges([4, 8, 12], 1)).toEqual([4]);
  });
});
