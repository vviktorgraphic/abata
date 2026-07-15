export function ChildAgeFields({ ages, onChange }: { ages: readonly (number | undefined)[]; onChange: (index: number, value: number | undefined) => void }) {
  if (ages.length === 0) return null;
  return (
    <fieldset className="child-ages">
      <legend>Gyermekek életkora</legend>
      <div className="form-row">
        {ages.map((age, index) => (
          <label key={index}>{index + 1}. gyermek<input type="number" min="0" max="17" value={age ?? ""} onChange={(event) => onChange(index, Number.isNaN(event.currentTarget.valueAsNumber) ? undefined : event.currentTarget.valueAsNumber)} /></label>
        ))}
      </div>
    </fieldset>
  );
}
