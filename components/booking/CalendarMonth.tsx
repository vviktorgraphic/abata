import type { PublicAvailabilityInterval } from "@/lib/booking/availability";
import { formatLocalDate, getMonthGrid } from "@/lib/booking/calendar";
import { CalendarDay } from "./CalendarDay";

const weekdays = ["H", "K", "Sze", "Cs", "P", "Szo", "V"];
const monthFormatter = new Intl.DateTimeFormat("hu-HU", { month: "long", year: "numeric" });

type Props = {
  month: Date;
  intervals: readonly PublicAvailabilityInterval[];
  checkIn: Date | null;
  checkOut: Date | null;
  onSelect: (date: Date) => void;
};

export function CalendarMonth({ month, intervals, checkIn, checkOut, onSelect }: Props) {
  return (
    <section className="calendar-month" aria-label={monthFormatter.format(month)}>
      <h3>{monthFormatter.format(month)}</h3>
      <div className="calendar-weekdays" aria-hidden="true">
        {weekdays.map((day) => <span key={day}>{day}</span>)}
      </div>
      <div className="calendar-grid">
        {getMonthGrid(month).map((date, index) => {
          if (!date) return <span key={`empty-${index}`} aria-hidden="true" />;
          const value = formatLocalDate(date);
          const startValue = checkIn ? formatLocalDate(checkIn) : null;
          const endValue = checkOut ? formatLocalDate(checkOut) : null;
          const selected = Boolean(startValue && (endValue ? value >= startValue && value <= endValue : value === startValue));
          return (
            <CalendarDay
              key={value}
              date={date}
              intervals={intervals}
              selected={selected}
              rangeStart={value === startValue}
              rangeEnd={value === endValue}
              onSelect={onSelect}
            />
          );
        })}
      </div>
    </section>
  );
}
