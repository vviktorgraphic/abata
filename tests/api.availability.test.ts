import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const database = vi.hoisted(() => ({
  accommodationUnit: { findFirst: vi.fn() },
  booking: { findMany: vi.fn() },
  calendarBlock: { findMany: vi.fn() },
}));

vi.mock("@/lib/prisma", () => ({ prisma: database }));

import { GET } from "@/app/api/availability/route";

function request(query: string) {
  return new NextRequest(`http://localhost/api/availability?${query}`);
}

describe("GET /api/availability", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    database.accommodationUnit.findFirst.mockResolvedValue({ id: "unit-secret" });
    database.booking.findMany.mockResolvedValue([{ checkInDate: new Date("2030-07-05T00:00:00Z"), checkOutDate: new Date("2030-07-10T00:00:00Z") }]);
    database.calendarBlock.findMany.mockResolvedValue([{ startDate: new Date("2030-07-18T00:00:00Z"), endDate: new Date("2030-07-20T00:00:00Z") }]);
  });

  it("returns only public interval data without personal or internal fields", async () => {
    const response = await GET(request("from=2030-07-01&to=2030-09-01"));
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body).toEqual({
      range: { from: "2030-07-01", to: "2030-09-01" },
      intervals: [
        { start: "2030-07-05", end: "2030-07-10", type: "BOOKING" },
        { start: "2030-07-18", end: "2030-07-20", type: "BLOCK" },
      ],
    });
    expect(JSON.stringify(body)).not.toMatch(/guest|email|phone|unit-secret/i);
    expect(database.booking.findMany.mock.calls[0]?.[0].select).toEqual({ checkInDate: true, checkOutDate: true });
  });

  it("rejects malformed date parameters", async () => {
    const response = await GET(request("from=2030-02-30&to=2030-04-01"));
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ error: { code: "INVALID_DATE_RANGE" } });
  });

  it("rejects ranges longer than 12 months", async () => {
    const response = await GET(request("from=2030-01-01&to=2031-01-02"));
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ error: { code: "RANGE_TOO_LARGE" } });
  });
});
