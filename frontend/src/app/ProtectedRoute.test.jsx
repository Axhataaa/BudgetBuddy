import { describe, it, expect, afterEach } from "vitest";
import { screen } from "@testing-library/react";
import { Routes, Route } from "react-router-dom";
import { renderWithProviders } from "../test/test-utils";
import ProtectedRoute from "./ProtectedRoute";

function fakeToken(claims) {
  const b64 = (obj) => btoa(JSON.stringify(obj)).replace(/\+/g, "-").replace(/\//g, "_");
  return `${b64({ alg: "none" })}.${b64(claims)}.sig`;
}

function renderProtected(route) {
  return renderWithProviders(
    <Routes>
      <Route path="/" element={<div>Public home</div>} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <div>Secret dashboard content</div>
          </ProtectedRoute>
        }
      />
    </Routes>,
    { route }
  );
}

describe("ProtectedRoute", () => {
  afterEach(() => localStorage.clear());

  it("redirects unauthenticated users to the home route", () => {
    renderProtected("/dashboard");
    expect(screen.getByText(/public home/i)).toBeInTheDocument();
    expect(screen.queryByText(/secret dashboard content/i)).not.toBeInTheDocument();
  });

  it("renders protected content for authenticated users", () => {
    localStorage.setItem("access", fakeToken({ user_id: 1 }));
    renderProtected("/dashboard");
    expect(screen.getByText(/secret dashboard content/i)).toBeInTheDocument();
  });
});
