import { NextResponse } from "next/server";

export async function GET() {
    return NextResponse.json({
        ok: true,
        service: "booking-system",
        timestamp: new Date().toISOString(),
    });
}
