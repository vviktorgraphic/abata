export function AvailabilityLegend() {
  return (
    <div className="availability-legend" aria-label="Naptár jelmagyarázat">
      <span><i className="legend-free" />Szabad</span>
      <span><i className="legend-blocked" />Foglalt</span>
      <span><i className="legend-arrival" />Csak távozás</span>
      <span><i className="legend-departure" />Csak érkezés</span>
      <span><i className="legend-selected" />Kiválasztva</span>
    </div>
  );
}
