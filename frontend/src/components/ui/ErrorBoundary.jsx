import { Component } from "react";
import { LuTriangleAlert } from "react-icons/lu";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // eslint-disable-next-line no-console
    console.error("BudgetBuddy encountered an unexpected error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="d-flex align-items-center justify-content-center"
          style={{ minHeight: "100vh", backgroundColor: "var(--color-bg)" }}
        >
          <div className="bg-surface rounded shadow-token-md p-4 text-center" style={{ maxWidth: 420 }}>
            <LuTriangleAlert size={40} className="text-warning mb-3" />
            <h1 className="font-display fs-5 fw-semibold mb-2">Something went wrong</h1>
            <p className="text-muted-ink small mb-3">
              BudgetBuddy ran into an unexpected error. Reloading the page usually fixes this.
            </p>
            <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
