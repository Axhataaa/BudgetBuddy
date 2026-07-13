export default function Input({
  label,
  error,
  type = "text",
  as = "input",
  options,
  className = "",
  ...props
}) {
  const fieldClasses = `form-control ${type === "number" ? "font-currency text-end" : ""} ${
    error ? "is-invalid" : ""
  }`;

  return (
    <div className={`mb-3 ${className}`}>
      {label && <label className="form-label fw-medium">{label}</label>}

      {as === "select" ? (
        <select className={`form-select ${error ? "is-invalid" : ""}`} {...props}>
          {options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : as === "textarea" ? (
        <textarea className={`form-control ${error ? "is-invalid" : ""}`} rows={3} {...props} />
      ) : (
        <input type={type} className={fieldClasses} {...props} />
      )}

      {error && <div className="invalid-feedback d-block">{error}</div>}
    </div>
  );
}
