import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const createBookingRequest = vi.hoisted(() => vi.fn());
vi.mock("@/lib/booking/create-booking", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/booking/create-booking")>();
  return { ...original, createBookingRequest };
});

import { BookingRequestError } from "@/lib/booking/create-booking";
import { POST } from "@/app/api/bookings/route";

const payload = {
  checkInDate: "2030-10-10", checkOutDate: "2030-10-13", guestName: " Teszt Elek ",
  guestEmail: "TESZT@EXAMPLE.TEST", guestPhone: " +36 30 123 4567 ", adultCount: 2,
  childAges: [8], notes: " Megjegyzés ", privacyAccepted: true,
};
const safeResponse = { booking: { reference: "FG-2030-ABC123", status: "PENDING", checkInDate: "2030-10-10", checkOutDate: "2030-10-13", nights: 3, total: 126000, currency: "HUF", price: { nightlyRate: 34000, accommodationSubtotal: 102000, extraAdultFee: 0, childrenFee: 9000, cleaningFee: 15000, tourismTax: 0, discount: 0, total: 126000, currency: "HUF", nights: 3, pricingRuleVersion: 1 } } };

function request(body: unknown, key = "test-key") {
  return new NextRequest("http://localhost/api/bookings", { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": key }, body: JSON.stringify(body) });
}

describe("POST /api/bookings", () => {
  beforeEach(() => { vi.clearAllMocks(); createBookingRequest.mockResolvedValue(safeResponse); });

  it("returns a safe successful booking response and normalized input", async () => {
    const response = await POST(request({ ...payload, total: 1, currency: "EUR" }));
    const body = await response.json();
    expect(response.status).toBe(201);
    expect(body).toEqual(safeResponse);
    expect(JSON.stringify(body)).not.toMatch(/Teszt Elek|example\.test|123 4567/);
    expect(createBookingRequest.mock.calls[0]?.[1]).toMatchObject({ guestName: "Teszt Elek", guestEmail: "teszt@example.test", guestPhone: "+36 30 123 4567" });
    expect(createBookingRequest.mock.calls[0]?.[1]).not.toHaveProperty("total");
    expect(createBookingRequest.mock.calls[0]?.[2]).toBe("test-key");
  });

  it("rejects missing privacy consent", async () => {
    const response = await POST(request({ ...payload, privacyAccepted: false }));
    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toMatchObject({ error: { code: "VALIDATION_ERROR", fieldErrors: { privacyAccepted: expect.any(Array) } } });
  });

  it("rejects invalid child ages", async () => {
    const response = await POST(request({ ...payload, childAges: [18] }));
    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toMatchObject({ error: { code: "VALIDATION_ERROR", fieldErrors: { childAges: expect.any(Array) } } });
  });

  it("returns 409 when the period became unavailable", async () => {
    createBookingRequest.mockRejectedValue(new BookingRequestError("BOOKING_PERIOD_UNAVAILABLE", 409, "A kiválasztott időszak már nem elérhető."));
    const response = await POST(request(payload));
    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({ error: { code: "BOOKING_PERIOD_UNAVAILABLE" } });
  });
});
