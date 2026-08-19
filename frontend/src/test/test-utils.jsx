import { MemoryRouter } from "react-router-dom";
import { render } from "@testing-library/react";
import { AuthProvider } from "../context/AuthContext";
import { ToastProvider } from "../components/ui/Toast";

/**
 * Renders a component wrapped in the providers it needs at runtime
 * (router, auth context, toast context). Pass `route` to control the
 * starting URL for components that read location/params.
 */
export function renderWithProviders(ui, { route = "/", ...options } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <AuthProvider>
        <ToastProvider>{ui}</ToastProvider>
      </AuthProvider>
    </MemoryRouter>,
    options
  );
}

export * from "@testing-library/react";
