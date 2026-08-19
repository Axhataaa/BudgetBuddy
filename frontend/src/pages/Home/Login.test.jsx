import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "../../test/test-utils";
import Login from "./Login";
import { loginUser } from "../../services/authService";

vi.mock("../../services/authService", () => ({
  loginUser: vi.fn(),
  logoutUser: vi.fn(),
}));

// A minimal, valid-shaped JWT (header.payload.signature) so decodeToken can parse it.
function fakeToken(claims) {
  const b64 = (obj) => btoa(JSON.stringify(obj)).replace(/\+/g, "-").replace(/\//g, "_");
  return `${b64({ alg: "none" })}.${b64(claims)}.sig`;
}

describe("Login page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("renders username and password fields", () => {
    renderWithProviders(<Login />);
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /log in/i })).toBeInTheDocument();
  });

  it("submits credentials and stores tokens on success", async () => {
    const access = fakeToken({ user_id: 1, is_staff: false });
    loginUser.mockResolvedValueOnce({ access, refresh: "refresh-token" });

    const user = userEvent.setup();
    renderWithProviders(<Login />);

    await user.type(screen.getByLabelText(/username/i), "gungun");
    await user.type(screen.getByLabelText(/password/i), "correct-password");
    await user.click(screen.getByRole("button", { name: /log in/i }));

    await waitFor(() => {
      expect(loginUser).toHaveBeenCalledWith({ username: "gungun", password: "correct-password" });
    });
    await waitFor(() => {
      expect(localStorage.getItem("access")).toBe(access);
      expect(localStorage.getItem("refresh")).toBe("refresh-token");
    });
  });

  it("shows an error toast and does not store tokens on invalid credentials", async () => {
    loginUser.mockRejectedValueOnce({ response: { status: 401 } });

    const user = userEvent.setup();
    renderWithProviders(<Login />);

    await user.type(screen.getByLabelText(/username/i), "gungun");
    await user.type(screen.getByLabelText(/password/i), "wrong-password");
    await user.click(screen.getByRole("button", { name: /log in/i }));

    expect(await screen.findByText(/invalid username or password/i)).toBeInTheDocument();
    expect(localStorage.getItem("access")).toBeNull();
  });
});
