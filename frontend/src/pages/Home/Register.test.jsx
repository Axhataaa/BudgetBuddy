import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../test/test-utils";
import Register from "./Register";
import { registerUser } from "../../services/authService";

vi.mock("../../services/authService", () => ({
  registerUser: vi.fn(),
  loginUser: vi.fn(),
  logoutUser: vi.fn(),
}));

async function fillRequiredFields(user) {
  await user.type(screen.getByLabelText(/username/i), "newuser");
  await user.type(screen.getByLabelText(/^email$/i), "newuser@example.com");
  await user.type(screen.getByLabelText(/^password$/i), "StrongPass123!");
  await user.type(screen.getByLabelText(/confirm password/i), "StrongPass123!");
}

describe("Register page", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders the registration form fields", () => {
    renderWithProviders(<Register />);
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create account/i })).toBeInTheDocument();
  });

  it("blocks submission and shows an error when passwords do not match, without calling the API", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Register />);

    await user.type(screen.getByLabelText(/username/i), "newuser");
    await user.type(screen.getByLabelText(/^email$/i), "newuser@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "StrongPass123!");
    await user.type(screen.getByLabelText(/confirm password/i), "DifferentPass!");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
    expect(registerUser).not.toHaveBeenCalled();
  });

  it("submits valid data and navigates to login on success", async () => {
    registerUser.mockResolvedValueOnce({});
    const user = userEvent.setup();
    renderWithProviders(<Register />);

    await fillRequiredFields(user);
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByText(/registration successful/i)).toBeInTheDocument();
    expect(registerUser).toHaveBeenCalledTimes(1);
  });

  it("surfaces field-level API errors (e.g. duplicate username)", async () => {
    registerUser.mockRejectedValueOnce({
      response: { data: { error: { details: { username: ["A user with that username already exists."] } } } },
    });
    const user = userEvent.setup();
    renderWithProviders(<Register />);

    await fillRequiredFields(user);
    await user.click(screen.getByRole("button", { name: /create account/i }));

    const matches = await screen.findAllByText(/already exists/i);
    expect(matches.length).toBeGreaterThan(0);
  });
});
