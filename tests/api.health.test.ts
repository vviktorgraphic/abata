import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/health/route";

describe("GET /api/health", () => {
    it("returns the health contract", async () => {
        const response = await GET();

        expect(response.status).toBe(200);
        expect(await response.json()).toMatchObject({
            ok: true,
            service: "booking-system",
        });
    });
});
