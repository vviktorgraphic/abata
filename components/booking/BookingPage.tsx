"use client";

import { useEffect, useState } from "react";
import type { PublicAvailabilityInterval } from "@/lib/booking/availability";
import { getCalendarDayAvailability, isSelectableBookingInterval, toDateOnly } from "@/lib/booking/calendar";
import { AvailabilityLegend } from "./AvailabilityLegend";
import { BookingCalendar } from "./BookingCalendar";
import { BookingForm } from "./BookingForm";

function monthStart(date = new Date()): Date { return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1)); }
function shiftMonth(date: Date, amount: number): Date { return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + amount, 1)); }

export function BookingPage() {
  const [firstMonth, setFirstMonth] = useState(() => monthStart());
  const [intervals, setIntervals] = useState<PublicAvailabilityInterval[]>([]);
  const [checkIn, setCheckIn] = useState<Date | null>(null);
  const [checkOut, setCheckOut] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const to = shiftMonth(firstMonth, 2);
    fetch(`/api/availability?from=${toDateOnly(firstMonth)}&to=${toDateOnly(to)}`, { signal: controller.signal })
      .then(async (response) => { if (!response.ok) throw new Error("Az elérhetőségi adatok nem tölthetők be."); return response.json() as Promise<{ intervals: PublicAvailabilityInterval[] }>; })
      .then((data) => setIntervals(data.intervals))
      .catch((reason: unknown) => { if (!(reason instanceof DOMException && reason.name === "AbortError")) setError(reason instanceof Error ? reason.message : "Ismeretlen hiba történt."); })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [firstMonth]);

  function selectDate(date: Date) {
    const availability = getCalendarDayAvailability(date, intervals);
    if (!checkIn || checkOut) {
      if (!availability.canCheckIn) return;
      setCheckIn(date); setCheckOut(null); return;
    }
    if (date <= checkIn) { if (availability.canCheckIn) setCheckIn(date); return; }
    if (availability.canCheckOut && isSelectableBookingInterval(checkIn, date, intervals)) setCheckOut(date);
  }

  const reset = () => { setCheckIn(null); setCheckOut(null); };
  const navigate = (amount: number) => {
    setLoading(true);
    setError(null);
    setFirstMonth((month) => shiftMonth(month, amount));
  };
  return (
    <main className="booking-page">
      <header className="booking-hero">
        <p className="eyebrow">Közvetlen foglalás</p>
        <h1>Találd meg a tökéletes időpontot</h1>
        <p>Válassz érkezési és távozási dátumot, majd ellenőrizd a foglalási adataidat. A naptár valós időben mutatja a jelenlegi foglaltságot.</p>
      </header>
      <div className="booking-layout">
        <div>
          <BookingCalendar firstMonth={firstMonth} intervals={intervals} checkIn={checkIn} checkOut={checkOut} loading={loading} error={error} onPrevious={() => navigate(-1)} onNext={() => navigate(1)} onSelect={selectDate} />
          <AvailabilityLegend />
        </div>
        <BookingForm checkIn={checkIn} checkOut={checkOut} onReset={reset} />
      </div>
    </main>
  );
}
