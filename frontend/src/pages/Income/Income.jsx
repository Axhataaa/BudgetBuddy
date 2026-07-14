import { useEffect, useState } from "react";
import { LuPlus, LuPencil, LuTrash2, LuSearch, LuPiggyBank } from "react-icons/lu";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import EmptyState from "../../components/ui/EmptyState";
import SkeletonRows from "../../components/ui/SkeletonRows";
import Pagination from "../../components/ui/Pagination";
import { useToast } from "../../components/ui/Toast";
import IncomeForm from "./IncomeForm";
import { INCOME_SOURCES } from "./incomeConstants";
import { formatCurrency } from "../../utils/formatCurrency";
import {
  listIncomes,
  createIncome,
  updateIncome,
  deleteIncome,
} from "../../services/incomeService";

const PAGE_SIZE = 20;

export default function Income() {
  const { showToast } = useToast();

  const [incomes, setIncomes] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [source, setSource] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchIncomes = async () => {
    setLoading(true);
    try {
      const params = { page, page_size: PAGE_SIZE };
      if (search) params.search = search;
      if (source) params.source = source;

      const data = await listIncomes(params);
      setIncomes(data.results);
      setCount(data.count);
    } catch {
      showToast("Couldn't load income. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Same debounce/reset pattern as Expenses.jsx - search debounced
  // 300ms, source filter applies immediately, any filter change resets
  // to page 1.
  useEffect(() => {
    const timer = setTimeout(fetchIncomes, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, source, page]);

  useEffect(() => {
    setPage(1);
  }, [search, source]);

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

  const hasFilters = search || source;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="font-display fs-3 fw-semibold mb-0">Income</h1>
        <Button icon={LuPlus} onClick={openAddModal}>
          Add Income
        </Button>
      </div>

      <div className="row g-2 mb-3">
        <div className="col-md-6">
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
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="col-md-3">
          <select
            className="form-select"
            value={source}
            onChange={(e) => setSource(e.target.value)}
          >
            <option value="">All sources</option>
            {INCOME_SOURCES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-surface rounded shadow-token-sm">
        <table className="table mb-0 align-middle">
          <thead>
            <tr className="text-muted-ink small text-uppercase">
              <th>Source</th>
              <th>Date</th>
              <th className="text-end">Amount</th>
              <th className="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonRows rows={6} columns={4} />
            ) : (
              incomes.map((income) => (
                <tr key={income.id}>
                  <td>
                    <span className="badge bg-surface-sunken text-ink">{income.source}</span>
                    {income.description && (
                      <div className="small text-muted-ink mt-1">{income.description}</div>
                    )}
                  </td>
                  <td className="text-muted-ink">{income.date}</td>
                  <td className="text-end font-currency text-income fw-medium">
                    +{formatCurrency(income.amount)}
                  </td>
                  <td className="text-end">
                    <button
                      className="btn btn-sm btn-link text-muted-ink"
                      onClick={() => openEditModal(income)}
                      aria-label="Edit"
                    >
                      <LuPencil size={16} />
                    </button>
                    <button
                      className="btn btn-sm btn-link text-danger"
                      onClick={() => setDeleteTarget(income)}
                      aria-label="Delete"
                    >
                      <LuTrash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {!loading && incomes.length === 0 && (
          <EmptyState
            icon={LuPiggyBank}
            message={
              hasFilters
                ? "No income entries match your search or filters."
                : "No income recorded yet — add your first entry to get started."
            }
            action={
              !hasFilters && (
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
            ? `This "${deleteTarget.source}" entry will be permanently deleted. This can't be undone.`
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
