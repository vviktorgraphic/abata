"use client";

import { useState } from "react";
import { toDateOnly } from "@/lib/booking/calendar";
import { bookingFormSchema, synchronizeChildAges } from "@/lib/booking/validation";
import { ChildAgeFields } from "./ChildAgeFields";
import { GuestCountFields } from "./GuestCountFields";
import { SelectedDateSummary } from "./SelectedDateSummary";

export function BookingForm({ checkIn, checkOut, onReset }: { checkIn: Date | null; checkOut: Date | null; onReset: () => void }) {
  const [adultCount, setAdultCount] = useState(1);
  const [childCount, setChildCount] = useState(0);
  const [childAges, setChildAges] = useState<Array<number | undefined>>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [summary, setSummary] = useState<string | null>(null);

  function updateChildCount(value: number) {
    const safeValue = Number.isInteger(value) ? Math.max(0, value) : 0;
    setChildCount(safeValue);
    setChildAges((current) => synchronizeChildAges(current, safeValue));
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSummary(null);
    const data = new FormData(event.currentTarget);
    const result = bookingFormSchema.safeParse({
      checkIn: checkIn ? toDateOnly(checkIn) : "",
      checkOut: checkOut ? toDateOnly(checkOut) : "",
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
    setSummary(`Az adatok ellenőrzése sikeres. ${result.data.name} foglalási kérelme még nem került elküldésre; a tényleges beküldés a következő sprintben készül el.`);
  }

  return (
    <section className="booking-form-panel">
      <h2>Foglalási adatok</h2>
      <SelectedDateSummary checkIn={checkIn} checkOut={checkOut} />
      <button type="button" className="secondary-button" onClick={onReset}>Dátumok visszaállítása</button>
      <form onSubmit={submit} noValidate>
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
        <button type="submit" className="primary-button">Adatok ellenőrzése</button>
        {summary && <p className="notice notice--success" role="status">{summary}</p>}
      </form>
    </section>
  );
}
