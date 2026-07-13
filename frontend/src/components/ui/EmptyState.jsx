export default function EmptyState({ icon: Icon, message, action }) {
  return (
    <div className="d-flex flex-column align-items-center justify-content-center gap-3 py-5 text-center">
      {Icon && <Icon size={24} className="text-muted-ink" />}
      <p className="text-muted-ink small mb-0">{message}</p>
      {action}
    </div>
  );
}
