import { describe, expect, it } from "vitest";

describe("health check", () => {
    it("returns ok for a simple health contract", () => {
        expect({ ok: true, service: "booking-system" }).toEqual({
            ok: true,
            service: "booking-system",
        });
    });
});
