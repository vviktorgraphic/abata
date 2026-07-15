type Props = { adultCount: number; childCount: number; onAdults: (value: number) => void; onChildren: (value: number) => void };

export function GuestCountFields({ adultCount, childCount, onAdults, onChildren }: Props) {
  return (
    <div className="form-row">
      <label>Felnőttek száma<input type="number" min="1" value={adultCount} onChange={(event) => onAdults(event.currentTarget.valueAsNumber)} /></label>
      <label>18 év alattiak száma<input type="number" min="0" value={childCount} onChange={(event) => onChildren(event.currentTarget.valueAsNumber)} /></label>
    </div>
  );
}
