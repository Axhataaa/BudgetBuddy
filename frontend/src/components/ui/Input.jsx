import { useState } from "react";
import { LuEye, LuEyeOff } from "react-icons/lu";

export default function Input({
  label,
  error,
  type = "text",
  as = "input",
  options,
  className = "",
  showPasswordToggle = false,
  ...props
}) {
  const [visible, setVisible] = useState(false);

  const fieldClasses = `form-control ${type === "number" ? "font-currency text-end" : ""} ${
    error ? "is-invalid" : ""
  }`;

  const isToggleablePassword = showPasswordToggle && type === "password";
  const resolvedType = isToggleablePassword ? (visible ? "text" : "password") : type;
  const fieldId = props.id || props.name;

  return (
    <div className={`mb-3 ${className}`}>
      {label && (
        <label className="form-label fw-medium" htmlFor={fieldId}>
          {label}
        </label>
      )}

      {as === "select" ? (
        <select id={fieldId} className={`form-select ${error ? "is-invalid" : ""}`} {...props}>
          {options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : as === "textarea" ? (
        <textarea id={fieldId} className={`form-control ${error ? "is-invalid" : ""}`} rows={3} {...props} />
      ) : isToggleablePassword ? (
        <div className="position-relative">
          <input id={fieldId} type={resolvedType} className={fieldClasses} {...props} />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="btn btn-sm btn-link text-muted-ink position-absolute top-50 end-0 translate-middle-y me-1 p-1"
            aria-label={visible ? "Hide password" : "Show password"}
            tabIndex={-1}
          >
            {visible ? <LuEyeOff size={16} /> : <LuEye size={16} />}
          </button>
        </div>
      ) : (
        <input id={fieldId} type={type} className={fieldClasses} {...props} />
      )}

      {error && <div className="invalid-feedback d-block">{error}</div>}
    </div>
  );
}
