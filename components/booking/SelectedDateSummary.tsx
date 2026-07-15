import { calculateNumberOfNights } from "@/lib/booking/domain";

const formatter = new Intl.DateTimeFormat("hu-HU", { year: "numeric", month: "short", day: "numeric" });

export function SelectedDateSummary({ checkIn, checkOut }: { checkIn: Date | null; checkOut: Date | null }) {
  return (
    <div className="selected-date-summary" aria-live="polite">
      <div><span>Érkezés</span><strong>{checkIn ? formatter.format(checkIn) : "Nincs kiválasztva"}</strong></div>
      <div><span>Távozás</span><strong>{checkOut ? formatter.format(checkOut) : "Nincs kiválasztva"}</strong></div>
      {checkIn && checkOut && <p>{calculateNumberOfNights(checkIn, checkOut)} éjszaka</p>}
    </div>
  );
}
