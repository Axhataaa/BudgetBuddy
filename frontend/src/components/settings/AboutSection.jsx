export default function AboutSection() {
  return (
    <div id="about" className="bg-surface rounded shadow-token-sm hover-card p-4">
      <h2 className="font-display fs-6 fw-semibold mb-1">About</h2>
      <p className="text-muted-ink small mb-3">
        BudgetBuddy is a personal finance application for managing income, expenses, budgets and
        savings goals in one place.
      </p>

      <div className="row g-3 small">
        <div className="col-6 col-md-4">
          <div className="text-muted-ink mb-1">Application</div>
          <div className="fw-medium">BudgetBuddy</div>
        </div>
        <div className="col-6 col-md-4">
          <div className="text-muted-ink mb-1">Version</div>
          <div className="fw-medium">1.0.0</div>
        </div>
        <div className="col-6 col-md-4">
          <div className="text-muted-ink mb-1">Developed by</div>
          <div className="fw-medium">Akshata Lokhande</div>
        </div>
      </div>

      <hr />

      <div className="text-muted-ink small">
        © {new Date().getFullYear()} BudgetBuddy. All rights reserved.
      </div>
    </div>
  );
}
