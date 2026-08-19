import { describe, it, expect, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/react";
import NotificationCard from "./NotificationCard";
import { TYPE_META } from "../../utils/notificationMeta";

const baseNotification = {
  id: 1,
  title: "Budget exceeded",
  message: "You went over your Food budget this month.",
  is_read: false,
  priority: "high",
  type: "budget_warning",
  created_at: new Date().toISOString(),
  action_url: null,
};

const meta = TYPE_META.budget_warning || TYPE_META.budget;

function setup(overrides = {}) {
  const notification = { ...baseNotification, ...overrides };
  const onMarkRead = vi.fn();
  const onDelete = vi.fn();
  const onNavigate = vi.fn();
  const utils = render(
    <NotificationCard
      notification={notification}
      meta={meta}
      onMarkRead={onMarkRead}
      onDelete={onDelete}
      onNavigate={onNavigate}
    />
  );
  return { notification, onMarkRead, onDelete, onNavigate, ...utils };
}

describe("NotificationCard", () => {
  it("shows an unread indicator and bold title for unread notifications", () => {
    setup({ is_read: false });
    expect(screen.getByLabelText(/unread/i)).toBeInTheDocument();
    expect(screen.getByText(/budget exceeded/i)).toHaveClass("fw-semibold");
  });

  it("hides the unread indicator for read notifications", () => {
    setup({ is_read: true, action_url: null });
    expect(screen.queryByLabelText(/unread/i)).not.toBeInTheDocument();
  });

  it("marks a notification as read when clicked", async () => {
    const user = userEvent.setup();
    const { onMarkRead } = setup({ is_read: false });

    await user.click(screen.getByText(/budget exceeded/i));
    expect(onMarkRead).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }));
  });

  it("navigates to the action_url after marking as read, when one is present", async () => {
    const user = userEvent.setup();
    const { onMarkRead, onNavigate } = setup({ action_url: "/budgets" });

    await user.click(screen.getByText(/budget exceeded/i));
    expect(onMarkRead).toHaveBeenCalled();
    expect(onNavigate).toHaveBeenCalledWith("/budgets");
  });

  it("does not navigate when there is no action_url", async () => {
    const user = userEvent.setup();
    const { onNavigate } = setup({ action_url: null });

    await user.click(screen.getByText(/budget exceeded/i));
    expect(onNavigate).not.toHaveBeenCalled();
  });

  it("calls onDelete without triggering the row's onMarkRead/onNavigate", async () => {
    const user = userEvent.setup();
    const { onDelete, onMarkRead } = setup({ is_read: true, action_url: "/budgets" });

    await user.click(screen.getByRole("button", { name: /delete notification/i }));
    expect(onDelete).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }));
    expect(onMarkRead).not.toHaveBeenCalled();
  });

  it("is keyboard-activatable (Enter key) when interactive", async () => {
    const user = userEvent.setup();
    const { onMarkRead } = setup({ is_read: false });

    const row = screen.getByRole("button", { name: /budget exceeded/i });
    row.focus();
    await user.keyboard("{Enter}");
    expect(onMarkRead).toHaveBeenCalled();
  });
});
