import { LuX } from "react-icons/lu";

/**
 * chips: [{ key, label, onRemove }]
 * Renders nothing if chips is empty - callers don't need to conditionally wrap it.
 */
export default function FilterChips({ chips }) {
  if (!chips || chips.length === 0) return null;

  return (
    <div className="d-flex flex-wrap gap-2 mb-3">
      {chips.map((chip) => (
        <span
          key={chip.key}
          className="d-inline-flex align-items-center gap-1 bg-surface-sunken text-ink rounded-pill px-3 py-1 small"
        >
          {chip.label}
          <button
            type="button"
            onClick={chip.onRemove}
            className="btn btn-sm btn-link p-0 text-muted-ink d-flex align-items-center"
            aria-label={`Remove ${chip.label} filter`}
          >
            <LuX size={13} />
          </button>
        </span>
      ))}
    </div>
  );
}
