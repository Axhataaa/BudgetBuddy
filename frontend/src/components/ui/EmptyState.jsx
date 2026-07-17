export default function EmptyState({ icon: Icon, message, action }) {
  return (
    <div className="d-flex flex-column align-items-center justify-content-center gap-3 py-5 text-center">
      {Icon && (
        <div
          className="d-flex align-items-center justify-content-center rounded-circle bg-surface-sunken"
          style={{ width: 56, height: 56 }}
        >
          <Icon size={26} className="text-muted-ink" />
        </div>
      )}
      <p className="text-muted-ink small mb-0" style={{ maxWidth: 320 }}>
        {message}
      </p>
      {action}
    </div>
  );
}
