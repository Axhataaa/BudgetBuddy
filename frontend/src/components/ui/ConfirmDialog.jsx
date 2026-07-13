import Button from "./Button";

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  variant = "danger",
  onConfirm,
  onCancel,
  loading = false,
}) {
  if (!open) return null;

  return (
    <>
      <div className="modal d-block" tabIndex="-1" onClick={onCancel}>
        <div className="modal-dialog modal-sm modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
          <div className="modal-content bg-surface p-2">
            <div className="modal-body">
              <h3 className="font-display fs-6 fw-semibold mb-2">{title}</h3>
              <p className="text-muted-ink small mb-0">{message}</p>
            </div>
            <div className="modal-footer border-0 pt-0">
              <Button variant="ghost" onClick={onCancel} disabled={loading}>
                Cancel
              </Button>
              <Button variant={variant} onClick={onConfirm} loading={loading}>
                {confirmLabel}
              </Button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop show" />
    </>
  );
}
