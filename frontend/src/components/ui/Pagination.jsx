import { LuChevronLeft, LuChevronRight } from "react-icons/lu";
import Button from "./Button";

export default function Pagination({ count, pageSize, page, onPageChange }) {
  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  if (totalPages <= 1) return null;

  const rangeStart = (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, count);

  return (
    <div className="d-flex align-items-center justify-content-between border-top px-3 py-3 small text-muted-ink">
      <span>
        Showing {rangeStart}–{rangeEnd} of {count}
      </span>
      <div className="d-flex gap-2">
        <Button
          variant="ghost"
          icon={LuChevronLeft}
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Prev
        </Button>
        <Button
          variant="ghost"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
          <LuChevronRight size={16} />
        </Button>
      </div>
    </div>
  );
}
