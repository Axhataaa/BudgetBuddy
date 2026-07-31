import { Component } from "react";
import { LuTriangleAlert } from "react-icons/lu";

/**
 * Milestone 3 audit gap: there was no React error boundary anywhere,
 * so a render-time JS error in any component would white-screen the
 * entire app with no fallback UI. Error boundaries must be class
 * components - this is a React API requirement, not a stylistic
 * choice (there is no hook equivalent).
 *
 * Deliberately minimal: catches, logs to the console (so it's still
 * visible in dev tools / CI logs), and offers a reload - it does not
 * attempt to recover in place, since the error could have left
 * component state inconsistent.
 */
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
