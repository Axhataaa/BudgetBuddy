import { LuChevronLeft, LuChevronRight } from "react-icons/lu";

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function PeriodSelector({ month, year, onChange }) {
  const goToPrevMonth = () => {
    if (month === 1) onChange(12, year - 1);
    else onChange(month - 1, year);
  };

  const goToNextMonth = () => {
    if (month === 12) onChange(1, year + 1);
    else onChange(month + 1, year);
  };

  return (
    <div className="d-flex align-items-center gap-2">
      <button
        type="button"
        className="btn btn-sm btn-outline-secondary"
        onClick={goToPrevMonth}
        aria-label="Previous month"
      >
        <LuChevronLeft size={16} />
      </button>

      <select
        className="form-select form-select-sm"
        style={{ width: 150 }}
        value={month}
        onChange={(e) => onChange(Number(e.target.value), year)}
      >
        {MONTH_NAMES.map((name, i) => (
          <option key={i + 1} value={i + 1}>
            {name}
          </option>
        ))}
      </select>

      <input
        type="number"
        className="form-control form-control-sm"
        style={{ width: 90 }}
        value={year}
        onChange={(e) => onChange(month, Number(e.target.value))}
      />

      <button
        type="button"
        className="btn btn-sm btn-outline-secondary"
        onClick={goToNextMonth}
        aria-label="Next month"
      >
        <LuChevronRight size={16} />
      </button>
    </div>
  );
}
