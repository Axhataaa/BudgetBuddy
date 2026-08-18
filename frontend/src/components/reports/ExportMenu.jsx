import { useEffect, useRef, useState } from "react";
import { LuChevronDown, LuFileText, LuFileSpreadsheet, LuFileDown } from "react-icons/lu";
import Button from "../ui/Button";

export default function ExportMenu({ onExportCsv, onExportExcel, onExportPdf, disabled, disabledTitle }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const choose = (handler) => {
    setOpen(false);
    handler();
  };

  return (
    <div className="position-relative d-inline-block" ref={menuRef}>
      <Button
        variant="primary"
        icon={LuFileDown}
        disabled={disabled}
        title={disabled ? disabledTitle : undefined}
        onClick={() => setOpen((o) => !o)}
      >
        Export Report <LuChevronDown size={14} />
      </Button>

      {open && (
        <div
          className="position-absolute bg-surface shadow-token-md rounded p-1 mt-1"
          style={{ zIndex: 10, minWidth: 180, right: 0 }}
        >
          <button
            type="button"
            className="btn btn-sm btn-link text-ink text-decoration-none d-flex align-items-center gap-2 w-100 text-start"
            onClick={() => choose(onExportCsv)}
          >
            <LuFileText size={16} />
            Export CSV
          </button>
          <button
            type="button"
            className="btn btn-sm btn-link text-ink text-decoration-none d-flex align-items-center gap-2 w-100 text-start"
            onClick={() => choose(onExportExcel)}
          >
            <LuFileSpreadsheet size={16} />
            Export Excel
          </button>
          <button
            type="button"
            className="btn btn-sm btn-link text-ink text-decoration-none d-flex align-items-center gap-2 w-100 text-start"
            onClick={() => choose(onExportPdf)}
          >
            <LuFileDown size={16} />
            Export PDF
          </button>
        </div>
      )}
    </div>
  );
}
