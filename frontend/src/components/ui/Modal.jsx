import { createPortal } from "react-dom";

export default function Modal({ open, onClose, title, children }) {
  if (!open) return null;

  return createPortal(
    <>
      <div className="modal d-block" tabIndex="-1" onClick={onClose}>
        <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
          <div className="modal-content bg-surface">
            <div className="modal-header">
              <h2 className="modal-title font-display fs-5">{title}</h2>
              <button
                type="button"
                className="btn-close"
                aria-label="Close"
                onClick={onClose}
              />
            </div>
            <div className="modal-body">{children}</div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop show" />
    </>,
    document.body
  );
}
