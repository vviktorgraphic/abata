import { getCalendarDayAvailability, toDateOnly } from "@/lib/booking/calendar";
import type { PublicAvailabilityInterval } from "@/lib/booking/availability";

type Props = {
  date: Date;
  intervals: readonly PublicAvailabilityInterval[];
  selected: boolean;
  rangeStart: boolean;
  rangeEnd: boolean;
  onSelect: (date: Date) => void;
};

export function CalendarDay({ date, intervals, selected, rangeStart, rangeEnd, onSelect }: Props) {
  const availability = getCalendarDayAvailability(date, intervals);
  const dateValue = toDateOnly(date);
  const status = availability.isPast
    ? "múltbeli, nem választható"
    : availability.isFullyBlocked
      ? "foglalt"
      : availability.hasArrivalBoundary
        ? "csak távozásra használható"
        : availability.hasDepartureBoundary
          ? "csak érkezésre használható"
          : "szabad";
  const classNames = [
    "calendar-day",
    availability.isPast && "calendar-day--past",
    availability.isFullyBlocked && "calendar-day--blocked",
    availability.hasArrivalBoundary && "calendar-day--arrival-boundary",
    availability.hasDepartureBoundary && "calendar-day--departure-boundary",
    selected && "calendar-day--selected",
    rangeStart && "calendar-day--range-start",
    rangeEnd && "calendar-day--range-end",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type="button"
      className={classNames}
      onClick={() => onSelect(date)}
      disabled={availability.isPast || availability.isFullyBlocked}
      aria-label={`${dateValue}, ${status}${selected ? ", kiválasztott időszak" : ""}`}
      aria-pressed={selected}
    >
      <span>{date.getUTCDate()}</span>
      {(availability.hasArrivalBoundary || availability.hasDepartureBoundary) && <span className="sr-only">{status}</span>}
    </button>
  );
}
