"use client";

import { useRef, useState } from "react";
import { formatLocalDate } from "@/lib/booking/calendar";
import { bookingFormSchema, synchronizeChildAges } from "@/lib/booking/validation";
import { ChildAgeFields } from "./ChildAgeFields";
import { GuestCountFields } from "./GuestCountFields";
import { SelectedDateSummary } from "./SelectedDateSummary";

export function BookingForm({ checkIn, checkOut, onReset }: { checkIn: Date | null; checkOut: Date | null; onReset: () => void }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [adultCount, setAdultCount] = useState(1);
  const [childCount, setChildCount] = useState(0);
  const [childAges, setChildAges] = useState<Array<number | undefined>>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());
  const [result, setResult] = useState<BookingApiResponse["booking"] | null>(null);

  function updateChildCount(value: number) {
    const safeValue = Number.isInteger(value) ? Math.max(0, value) : 0;
    setChildCount(safeValue);
    setChildAges((current) => synchronizeChildAges(current, safeValue));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const result = bookingFormSchema.safeParse({
      checkIn: checkIn ? formatLocalDate(checkIn) : "",
      checkOut: checkOut ? formatLocalDate(checkOut) : "",
      name: data.get("name"), email: data.get("email"), phone: data.get("phone"),
      adultCount, childCount, childAges, notes: data.get("notes") ?? "",
      privacyAccepted: data.get("privacyAccepted") === "on",
    });
    if (!result.success) {
      const nextErrors: Record<string, string> = {};
      for (const issue of result.error.issues) nextErrors[String(issue.path[0] ?? "form")] ??= issue.message;
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
        body: JSON.stringify({
          checkInDate: result.data.checkIn, checkOutDate: result.data.checkOut,
          guestName: result.data.name, guestEmail: result.data.email, guestPhone: result.data.phone,
          adultCount: result.data.adultCount, childAges: result.data.childAges,
          notes: result.data.notes, privacyAccepted: result.data.privacyAccepted,
        }),
      });
      const body = await response.json() as BookingApiResponse | BookingApiError;
      if (!response.ok) {
        const apiError = (body as BookingApiError).error;
        setErrors(apiError.fieldErrors ? Object.fromEntries(Object.entries(apiError.fieldErrors).map(([key, messages]) => [fieldNameMap[key] ?? key, messages[0] ?? apiError.message])) : { form: apiError.message });
        return;
      }
      setResult((body as BookingApiResponse).booking);
    } catch {
      setErrors({ form: "A foglalási igény nem küldhető el. Próbáld újra." });
    } finally {
      setLoading(false);
    }
  }

  function startNewBooking() {
    setResult(null); setErrors({}); setIdempotencyKey(crypto.randomUUID());
    setAdultCount(1); setChildCount(0); setChildAges([]); formRef.current?.reset(); onReset();
  }

  return (
    <section className="booking-form-panel">
      <h2>Foglalási adatok</h2>
      <SelectedDateSummary checkIn={checkIn} checkOut={checkOut} />
      <button type="button" className="secondary-button" onClick={onReset} disabled={loading}>Dátumok visszaállítása</button>
      <form ref={formRef} onSubmit={submit} noValidate>
        {errors.form && <p className="field-error" role="alert">{errors.form}</p>}
        {(errors.checkIn || errors.checkOut) && <p className="field-error" role="alert">{errors.checkIn ?? errors.checkOut}</p>}
        <label>Teljes név<input name="name" autoComplete="name" aria-invalid={Boolean(errors.name)} /></label>
        {errors.name && <p className="field-error" role="alert">{errors.name}</p>}
        <div className="form-row">
          <label>E-mail-cím<input name="email" type="email" autoComplete="email" aria-invalid={Boolean(errors.email)} /></label>
          <label>Telefonszám<input name="phone" type="tel" autoComplete="tel" aria-invalid={Boolean(errors.phone)} /></label>
        </div>
        {errors.email && <p className="field-error" role="alert">{errors.email}</p>}
        {errors.phone && <p className="field-error" role="alert">{errors.phone}</p>}
        <GuestCountFields adultCount={adultCount} childCount={childCount} onAdults={setAdultCount} onChildren={updateChildCount} />
        {(errors.adultCount || errors.childCount) && <p className="field-error" role="alert">{errors.adultCount ?? errors.childCount}</p>}
        <ChildAgeFields ages={childAges} onChange={(index, value) => setChildAges((current) => current.map((age, ageIndex) => ageIndex === index ? value : age))} />
        {errors.childAges && <p className="field-error" role="alert">{errors.childAges}</p>}
        <label>Megjegyzés<textarea name="notes" rows={4} /></label>
        <label className="checkbox-label"><input name="privacyAccepted" type="checkbox" />Hozzájárulok az adataim kezeléséhez.</label>
        {errors.privacyAccepted && <p className="field-error" role="alert">{errors.privacyAccepted}</p>}
        <button type="submit" className="primary-button" disabled={loading || Boolean(result)}>{loading ? "Küldés…" : "Foglalási igény elküldése"}</button>
        {result && <BookingSuccess booking={result} onNew={startNewBooking} />}
      </form>
    </section>
  );
}

type BookingApiResponse = { booking: { reference: string; status: string; checkInDate: string; checkOutDate: string; nights: number; total: number; currency: string; price: { nightlyRate: number; accommodationSubtotal: number; extraAdultFee: number; childrenFee: number; cleaningFee: number; tourismTax: number; discount: number; total: number } } };
type BookingApiError = { error: { code: string; message: string; fieldErrors?: Record<string, string[]> } };
const fieldNameMap: Record<string, string> = { checkInDate: "checkIn", checkOutDate: "checkOut", guestName: "name", guestEmail: "email", guestPhone: "phone" };
const money = new Intl.NumberFormat("hu-HU", { style: "currency", currency: "HUF", maximumFractionDigits: 0 });

function BookingSuccess({ booking, onNew }: { booking: BookingApiResponse["booking"]; onNew: () => void }) {
  return (
    <div className="booking-success" role="status">
      <p className="eyebrow">Foglalási igény rögzítve</p>
      <h3>{booking.reference}</h3>
      <p>{booking.nights} éjszaka · {booking.status}</p>
      <p>Foglalási igényedet rögzítettük. Az árajánlatot és a foglalás adatait e-mailben küldjük el. A foglalás a tulajdonos visszaigazolásáig nem végleges.</p>
      <dl className="price-breakdown">
        <div><dt>Szállás ({money.format(booking.price.nightlyRate)}/éj)</dt><dd>{money.format(booking.price.accommodationSubtotal)}</dd></div>
        <div><dt>Extra felnőtt</dt><dd>{money.format(booking.price.extraAdultFee)}</dd></div>
        <div><dt>Gyermekdíj</dt><dd>{money.format(booking.price.childrenFee)}</dd></div>
        <div><dt>Takarítás</dt><dd>{money.format(booking.price.cleaningFee)}</dd></div>
        <div className="price-total"><dt>Összesen</dt><dd>{money.format(booking.total)}</dd></div>
      </dl>
      <button type="button" className="secondary-button" onClick={onNew}>Új foglalás indítása</button>
    </div>
  );
}
