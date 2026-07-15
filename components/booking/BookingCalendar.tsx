import type { PublicAvailabilityInterval } from "@/lib/booking/availability";
import { CalendarMonth } from "./CalendarMonth";

type Props = {
  firstMonth: Date;
  intervals: readonly PublicAvailabilityInterval[];
  checkIn: Date | null;
  checkOut: Date | null;
  loading: boolean;
  error: string | null;
  onPrevious: () => void;
  onNext: () => void;
  onSelect: (date: Date) => void;
};

export function BookingCalendar(props: Props) {
  const secondMonth = new Date(props.firstMonth.getFullYear(), props.firstMonth.getMonth() + 1, 1);
  return (
    <section className="booking-calendar" aria-busy={props.loading}>
      <div className="calendar-toolbar">
        <button type="button" onClick={props.onPrevious} aria-label="Előző hónapok">←</button>
        <h2>Válassz időpontot</h2>
        <button type="button" onClick={props.onNext} aria-label="Következő hónapok">→</button>
      </div>
      {props.error && <p className="notice notice--error" role="alert">{props.error}</p>}
      <div className="calendar-months">
        <CalendarMonth {...props} month={props.firstMonth} />
        <CalendarMonth {...props} month={secondMonth} />
      </div>
    </section>
  );
}
