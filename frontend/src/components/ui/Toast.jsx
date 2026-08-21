import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import {
  LuCircleCheck,
  LuCircleAlert,
  LuTriangleAlert,
  LuInfo,
  LuX,
} from "react-icons/lu";

const ToastContext = createContext(null);

const VARIANT = {
  success: {
    icon: LuCircleCheck,
    borderColor: "var(--color-income)",
    iconColor: "text-income",
  },
  error: {
    icon: LuCircleAlert,
    borderColor: "var(--color-danger)",
    iconColor: "text-danger",
  },
  warning: {
    icon: LuTriangleAlert,
    borderColor: "var(--color-warning)",
    iconColor: "text-warning",
  },
  info: {
    icon: LuInfo,
    borderColor: "var(--color-primary)",
    iconColor: "text-primary",
  },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef(new Map());

  const dismiss = useCallback((id) => {
    const timer = timersRef.current.get(id);

    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }

    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (message, variant = "info") => {
      const id = `${Date.now()}-${Math.random()}`;

      setToasts((prev) => [
        ...prev,
        {
          id,
          message,
          variant,
        },
      ]);

      if (variant !== "error") {
        const timer = setTimeout(() => {
          dismiss(id);
        }, 4000);

        timersRef.current.set(id, timer);
      }
    },
    [dismiss]
  );

  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => clearTimeout(timer));
      timersRef.current.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      <div
        className="position-fixed bottom-0 end-0 p-3 d-flex flex-column gap-2"
        style={{ zIndex: 1080 }}
      >
        {toasts.map(({ id, message, variant }) => {
          const config = VARIANT[variant] || VARIANT.info;
          const Icon = config.icon;

          return (
            <div
              key={id}
              className="d-flex align-items-center gap-3 bg-surface rounded shadow-token-md px-3 py-2"
              style={{
                borderLeft: `4px solid ${config.borderColor}`,
              }}
            >
              <Icon size={18} className={config.iconColor} />

              <span className="small">{message}</span>

              <button
                type="button"
                onClick={() => dismiss(id)}
                className="btn btn-sm btn-link text-muted-ink p-0 ms-2"
                aria-label="Dismiss"
              >
                <LuX size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }

  return context;
}