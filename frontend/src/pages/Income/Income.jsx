import { useEffect, useState } from "react";
import { LuPlus, LuPencil, LuTrash2, LuSearch, LuPiggyBank, LuFilterX, LuArrowUpRight } from "react-icons/lu";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import EmptyState from "../../components/ui/EmptyState";
import SkeletonRows from "../../components/ui/SkeletonRows";
import Pagination from "../../components/ui/Pagination";
import FilterChips from "../../components/ui/FilterChips";
import { useToast } from "../../components/ui/Toast";
import IncomeForm from "./IncomeForm";
import { INCOME_SOURCES, getIncomeSourceMeta } from "./incomeConstants";
import { formatCurrency } from "../../utils/formatCurrency";
import { TIME_PERIOD_OPTIONS, getDateRangeForPeriod } from "../../utils/dateRanges";
import { AMOUNT_DATE_SORT_OPTIONS } from "../../utils/sortOptions";
import {
  listIncomes,
  createIncome,
  updateIncome,
  deleteIncome,
} from "../../services/incomeService";

const PAGE_SIZE = 20;

const emptyFilters = {
  search: "",
  source: "",
  timePeriod: "",
  customFrom: "",
  customTo: "",
};

export default function Income() {
  const { showToast } = useToast();

  const [incomes, setIncomes] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState(emptyFilters);
  const { search, source, timePeriod, customFrom, customTo } = filters;
  const [ordering, setOrdering] = useState("-date");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const setFilter = (key) => (value) => setFilters((prev) => ({ ...prev, [key]: value }));

  const fetchIncomes = async () => {
    setLoading(true);
    try {
      const params = { page, page_size: PAGE_SIZE, ordering };
      if (search) params.search = search;
      if (source) params.source = source;

      // Same Time Period preset logic as Expenses.jsx, sharing the same
      // utils/dateRanges.js helper rather than a second implementation.
      if (timePeriod === "custom") {
        if (customFrom) params.date_from = customFrom;
        if (customTo) params.date_to = customTo;
      } else if (timePeriod) {
        const range = getDateRangeForPeriod(timePeriod);
        if (range) {
          params.date_from = range.date_from;
          params.date_to = range.date_to;
        }
      }

      const data = await listIncomes(params);
      setIncomes(data.results);
      setCount(data.count);
    } catch {
      showToast("Couldn't load income. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Same debounce/reset pattern as Expenses.jsx.
  useEffect(() => {
    const timer = setTimeout(fetchIncomes, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, source, timePeriod, customFrom, customTo, ordering, page]);

  useEffect(() => {
    setPage(1);
  }, [search, source, timePeriod, customFrom, customTo, ordering]);

  const openAddModal = () => {
    setEditingIncome(null);
    setModalOpen(true);
  };

  const openEditModal = (income) => {
    setEditingIncome(income);
    setModalOpen(true);
  };

  const handleSubmit = async (formValues) => {
    setSubmitting(true);
    try {
      if (editingIncome) {
        await updateIncome(editingIncome.id, formValues);
        showToast("Income updated.", "success");
      } else {
        await createIncome(formValues);
        showToast("Income added.", "success");
      }
      setModalOpen(false);
      fetchIncomes();
    } catch (err) {
      const message = err.response?.data?.error?.message || "Couldn't save income.";
      showToast(message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteIncome(deleteTarget.id);
      showToast("Income deleted.", "success");
      setDeleteTarget(null);
      fetchIncomes();
    } catch {
      showToast("Couldn't delete income.", "error");
    } finally {
      setDeleting(false);
    }
  };

  const isTimePeriodActive = timePeriod && (timePeriod !== "custom" || customFrom || customTo);
  const hasFilters = search || source || isTimePeriodActive;

  const timePeriodLabel = TIME_PERIOD_OPTIONS.find((o) => o.value === timePeriod)?.label;

  const chips = [
    search && { key: "search", label: `Search: "${search}"`, onRemove: () => setFilter("search")("") },
    source && { key: "source", label: `Source: ${source}`, onRemove: () => setFilter("source")("") },
    timePeriod &&
      timePeriod !== "custom" && {
        key: "period",
        label: timePeriodLabel,
        onRemove: () => setFilter("timePeriod")(""),
      },
    timePeriod === "custom" &&
      (customFrom || customTo) && {
        key: "custom",
        label: `${customFrom || "…"} → ${customTo || "…"}`,
        onRemove: () => setFilters((prev) => ({ ...prev, timePeriod: "", customFrom: "", customTo: "" })),
      },
  ].filter(Boolean);

  return (
    <div>
      {/* Header - same structure as Expenses/Notifications, tinted
          with .icon-income instead. */}
      <div className="bg-surface rounded shadow-token-sm p-4 mb-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
        <div className="d-flex align-items-center gap-3">
          <span className="page-header-icon icon-income">
            <LuArrowUpRight size={22} />
          </span>
          <div>
            <h1 className="font-display fs-3 fw-semibold mb-1">Income</h1>
            <p className="text-muted-ink mb-0">Track and manage all your income.</p>
          </div>
        </div>

        <Button icon={LuPlus} onClick={openAddModal}>
          Add Income
        </Button>
      </div>

      <div className="bg-surface rounded shadow-token-sm p-3 mb-3">
        <div className="row g-2">
          <div className="col-md-4">
            <div className="position-relative">
              <LuSearch
                size={16}
                className="position-absolute text-muted-ink"
                style={{ top: 12, left: 12 }}
              />
              <input
                className="form-control ps-5"
                placeholder="Search by description..."
                value={search}
                onChange={(e) => setFilter("search")(e.target.value)}
              />
            </div>
          </div>
          <div className="col-6 col-md-3">
            <select className="form-select" value={source} onChange={(e) => setFilter("source")(e.target.value)}>
              <option value="">All sources</option>
              {INCOME_SOURCES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="col-6 col-md-2">
            <select
              className="form-select"
              value={timePeriod}
              onChange={(e) => setFilter("timePeriod")(e.target.value)}
            >
              {TIME_PERIOD_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="col-6 col-md-3">
            <select className="form-select" value={ordering} onChange={(e) => setOrdering(e.target.value)}>
              {AMOUNT_DATE_SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {timePeriod === "custom" && (
          <div className="row g-2 mt-1">
            <div className="col-6 col-md-2">
              <input
                type="date"
                className="form-control"
                value={customFrom}
                onChange={(e) => setFilter("customFrom")(e.target.value)}
                aria-label="From date"
              />
            </div>
            <div className="col-6 col-md-2">
              <input
                type="date"
                className="form-control"
                value={customTo}
                onChange={(e) => setFilter("customTo")(e.target.value)}
                aria-label="To date"
              />
            </div>
          </div>
        )}
      </div>

      <div className="d-flex align-items-center justify-content-between">
        <FilterChips chips={chips} />
        {hasFilters && (
          <Button variant="ghost" icon={LuFilterX} onClick={() => setFilters(emptyFilters)} className="mb-3">
            Clear Filters
          </Button>
        )}
      </div>

      <div className="bg-surface rounded shadow-token-sm">
        <div className="table-responsive" style={{ maxHeight: 640, overflowY: "auto" }}>
          <table className="table mb-0 align-middle transaction-table">
            <thead className="sticky-top bg-surface">
              <tr className="text-muted-ink small text-uppercase">
                <th className="py-3">Source</th>
                <th className="py-3">Date</th>
                <th className="py-3 text-end">Amount</th>
                <th className="py-3 text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRows rows={6} columns={4} />
              ) : (
                incomes.map((income) => {
                  const meta = getIncomeSourceMeta(income.source);
                  const SourceIcon = meta.icon;
                  return (
                    <tr key={income.id}>
                      <td className="py-3">
                        <div className="d-flex align-items-center gap-3">
                          <span className={`category-icon ${meta.badge}`}>
                            <SourceIcon size={16} />
                          </span>
                          <div className="min-w-0">
                            <div className="fw-medium text-ink">{income.source}</div>
                            {income.description && (
                              <div className="small text-muted-ink">{income.description}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 text-muted-ink">{income.date}</td>
                      <td className="py-3 text-end font-currency text-income fw-medium">
                        +{formatCurrency(income.amount)}
                      </td>
                      <td className="py-3 text-end">
                        <button
                          className="btn btn-sm btn-link text-muted-ink row-action-btn"
                          onClick={() => openEditModal(income)}
                          aria-label="Edit"
                        >
                          <LuPencil size={16} />
                        </button>
                        <button
                          className="btn btn-sm btn-link text-danger row-action-btn"
                          onClick={() => setDeleteTarget(income)}
                          aria-label="Delete"
                        >
                          <LuTrash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading && incomes.length === 0 && (
          <EmptyState
            icon={LuPiggyBank}
            message={
              hasFilters
                ? "No income entries match your search or filters."
                : "No income recorded yet — add your first entry to get started."
            }
            action={
              hasFilters ? (
                <Button variant="ghost" icon={LuFilterX} onClick={() => setFilters(emptyFilters)}>
                  Clear Filters
                </Button>
              ) : (
                <Button icon={LuPlus} onClick={openAddModal}>
                  Add Income
                </Button>
              )
            }
          />
        )}

        {!loading && incomes.length > 0 && (
          <Pagination count={count} pageSize={PAGE_SIZE} page={page} onPageChange={setPage} />
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingIncome ? "Edit Income" : "Add Income"}
      >
        <IncomeForm
          initialValues={editingIncome}
          onSubmit={handleSubmit}
          onCancel={() => setModalOpen(false)}
          submitting={submitting}
        />
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete this income entry?"
        message={
          deleteTarget
            ? `This "${deleteTarget.source}" entry (${deleteTarget.date}, ${formatCurrency(deleteTarget.amount)}) will be permanently deleted. This can't be undone.`
            : ""
        }
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
