const VARIANT_CLASSES = {
  primary: "btn-primary",
  secondary: "btn-outline-primary",
  ghost: "btn-link text-muted-ink text-decoration-none",
  danger: "btn-outline-danger",
};

export default function Button({
  variant = "primary",
  loading = false,
  disabled = false,
  icon: Icon,
  children,
  className = "",
  ...props
}) {
  return (
    <button
      disabled={disabled || loading}
      className={`btn d-inline-flex align-items-center gap-2 ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
      ) : (
        Icon && <Icon size={16} />
      )}
      {children}
    </button>
  );
}
