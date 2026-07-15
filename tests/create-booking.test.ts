import { Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { BookingRequestError, createBookingRequest } from "@/lib/booking/create-booking";

const input = {
  checkInDate: "2030-10-10", checkOutDate: "2030-10-13", guestName: "Teszt Elek",
  guestEmail: "teszt@example.test", guestPhone: "+36 30 123 4567", adultCount: 2,
  childAges: [8], notes: "Csendes szoba", privacyAccepted: true as const,
};

function fakeClient(options: { bookingBlocked?: boolean; calendarBlocked?: boolean } = {}) {
  const state = { bookingBlocked: options.bookingBlocked ?? false, calendarBlocked: options.calendarBlocked ?? false, creates: [] as Array<Record<string, unknown>>, outbox: [] as Array<Record<string, unknown>>, idempotency: new Map<string, Record<string, unknown>>() };
  const rule = {
    id: "rule-3-4", unitId: "unit-1", name: "3–4", startDate: null, endDate: null,
    nightlyRate: new Prisma.Decimal(34000), currency: "HUF", minimumNights: 3, maximumNights: 4,
    baseGuestCount: 2, extraAdultFee: new Prisma.Decimal(7000),
    childRates: [{ minAge: 0, maxAge: 5, nightlyFee: 0 }, { minAge: 6, maxAge: 11, nightlyFee: 3000 }, { minAge: 12, maxAge: 17, nightlyFee: 5000 }],
    cleaningFee: new Prisma.Decimal(15000), version: 1, priority: 100, active: true, createdAt: new Date(), updatedAt: new Date(),
  };
  const transaction = {
    accommodationUnit: { findFirst: async () => ({ id: "unit-1" }) },
    $queryRaw: async () => [{ pg_advisory_xact_lock: null }],
    booking: {
      findFirst: async () => state.bookingBlocked ? { id: "existing" } : null,
      create: async ({ data }: { data: Record<string, unknown> }) => { state.creates.push(data); state.bookingBlocked = true; return { id: `booking-${state.creates.length}` }; },
    },
    calendarBlock: { findFirst: async () => state.calendarBlocked ? { id: "block" } : null },
    pricingRule: { findMany: async () => [rule] },
    bookingRequestIdempotency: {
      findUnique: async ({ where }: { where: { key: string } }) => state.idempotency.get(where.key) ?? null,
      delete: async ({ where }: { where: { key: string } }) => state.idempotency.delete(where.key),
      create: async ({ data }: { data: Record<string, unknown> & { key: string } }) => { state.idempotency.set(data.key, data); return data; },
    },
    emailOutbox: {
      createMany: async ({ data }: { data: Array<Record<string, unknown>> }) => { state.outbox.push(...data); return { count: data.length }; },
    },
  };
  let tail = Promise.resolve();
  const client = {
    $transaction: <T>(callback: (tx: typeof transaction) => Promise<T>) => {
      const run = tail.then(() => callback(transaction));
      tail = run.then(() => undefined, () => undefined);
      return run;
    },
  };
  return { client, state };
}

describe("createBookingRequest", () => {
  it("rejects a past check-in before opening a transaction", async () => {
    const { client } = fakeClient();
    await expect(createBookingRequest(client as never, input, undefined, new Date("2031-01-01"))).rejects.toThrow("Múltbeli");
  });

  it("creates a pending booking with snapshot and initial status history", async () => {
    const { client, state } = fakeClient();
    const response = await createBookingRequest(client as never, input, undefined, new Date("2029-01-01"));
    expect(response.booking).toMatchObject({ status: "PENDING", nights: 3, total: 126000, currency: "HUF" });
    expect(JSON.stringify(response)).not.toMatch(/Teszt Elek|example\.test|123 4567|unit-1|booking-1/);
    expect(state.creates).toHaveLength(1);
    const create = state.creates[0] as { childCount: number; priceSnapshot: { create: Record<string, unknown> }; statusHistory: { create: Record<string, unknown> }; privacyAcceptedAt: Date };
    expect(create.childCount).toBe(1);
    expect(create.priceSnapshot.create).toMatchObject({ total: 126000, pricingRuleId: "rule-3-4", pricingRuleVersion: 1 });
    expect(create.statusHistory.create).toMatchObject({ toStatus: "PENDING" });
    expect(create.privacyAcceptedAt).toEqual(new Date("2029-01-01"));
    expect(state.outbox).toHaveLength(2);
    expect(state.outbox.map((email) => email.type)).toEqual(["BOOKING_REQUEST_GUEST", "BOOKING_REQUEST_ADMIN"]);
  });

  it("rejects a booking conflict", async () => {
    const { client } = fakeClient({ bookingBlocked: true });
    await expect(createBookingRequest(client as never, input, undefined, new Date("2029-01-01"))).rejects.toMatchObject({ code: "BOOKING_PERIOD_UNAVAILABLE" });
  });

  it("rejects a CalendarBlock conflict", async () => {
    const { client } = fakeClient({ calendarBlocked: true });
    await expect(createBookingRequest(client as never, input, undefined, new Date("2029-01-01"))).rejects.toMatchObject({ code: "BOOKING_PERIOD_UNAVAILABLE" });
  });

  it("replays the same idempotent request without creating again", async () => {
    const { client, state } = fakeClient();
    const first = await createBookingRequest(client as never, input, "same-key", new Date("2029-01-01"));
    state.bookingBlocked = false;
    const second = await createBookingRequest(client as never, input, "same-key", new Date("2029-01-01"));
    expect(second).toEqual(first);
    expect(state.creates).toHaveLength(1);
    expect(state.outbox).toHaveLength(2);
  });

  it("rejects the same idempotency key with different content", async () => {
    const { client, state } = fakeClient();
    await createBookingRequest(client as never, input, "same-key", new Date("2029-01-01"));
    state.bookingBlocked = false;
    await expect(createBookingRequest(client as never, { ...input, notes: "Más" }, "same-key", new Date("2029-01-01"))).rejects.toBeInstanceOf(BookingRequestError);
  });

  it("allows at most one of two parallel conflicting requests", async () => {
    const { client } = fakeClient();
    const results = await Promise.allSettled([
      createBookingRequest(client as never, input, undefined, new Date("2029-01-01")),
      createBookingRequest(client as never, input, undefined, new Date("2029-01-01")),
    ]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((result) => result.status === "rejected")).toHaveLength(1);
  });
});
