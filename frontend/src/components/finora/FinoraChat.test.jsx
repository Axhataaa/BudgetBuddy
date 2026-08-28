import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen, waitFor, act } from "@testing-library/react";
import FinoraChat from "./FinoraChat";
import { sendFinoraMessage } from "../../services/finoraService";

vi.mock("../../services/finoraService", () => ({
  sendFinoraMessage: vi.fn(),
}));

function getInput() {
  return screen.getByLabelText(/message finora/i);
}

function getSendButton() {
  return screen.getByRole("button", { name: /^send$/i });
}

describe("FinoraChat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows an empty conversation state with suggested prompts", () => {
    render(<FinoraChat dateFrom="2026-08-01" dateTo="2026-08-28" />);

    expect(screen.getByText(/ask finora anything about your finances/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /am i on track with my budgets\?/i })).toBeInTheDocument();
  });

  it("clicking a suggested prompt fills the input without sending it", async () => {
    const user = userEvent.setup();
    render(<FinoraChat dateFrom="2026-08-01" dateTo="2026-08-28" />);

    await user.click(screen.getByRole("button", { name: /am i on track with my budgets\?/i }));

    expect(getInput()).toHaveValue("Am I on track with my budgets?");
    expect(sendFinoraMessage).not.toHaveBeenCalled();
  });

  it("sends a typed message and renders the user bubble immediately", async () => {
    sendFinoraMessage.mockResolvedValue({ status: "ok", reply: "You're doing well.", scenario: null });
    const user = userEvent.setup();
    render(<FinoraChat dateFrom="2026-08-01" dateTo="2026-08-28" />);

    await user.type(getInput(), "How am I doing this month?");
    await user.click(getSendButton());

    expect(screen.getByText("How am I doing this month?")).toBeInTheDocument();
    expect(sendFinoraMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "How am I doing this month?",
        dateFrom: "2026-08-01",
        dateTo: "2026-08-28",
      })
    );
    // Input is cleared right away.
    expect(getInput()).toHaveValue("");
  });

  it("renders the assistant's reply once the backend responds", async () => {
    sendFinoraMessage.mockResolvedValue({ status: "ok", reply: "You're on track this month.", scenario: null });
    const user = userEvent.setup();
    render(<FinoraChat dateFrom="2026-08-01" dateTo="2026-08-28" />);

    await user.type(getInput(), "How am I doing?");
    await user.click(getSendButton());

    expect(await screen.findByText("You're on track this month.")).toBeInTheDocument();
  });

  it("shows a typing indicator while waiting for a reply", async () => {
    let resolveReply;
    sendFinoraMessage.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveReply = resolve;
        })
    );
    const user = userEvent.setup();
    render(<FinoraChat dateFrom="2026-08-01" dateTo="2026-08-28" />);

    await user.type(getInput(), "How am I doing?");
    await user.click(getSendButton());

    expect(screen.getByLabelText(/finora is thinking/i)).toBeInTheDocument();
    expect(getSendButton()).toBeDisabled();

    await act(async () => {
      resolveReply({ status: "ok", reply: "All good.", scenario: null });
    });

    await waitFor(() => expect(screen.queryByLabelText(/finora is thinking/i)).not.toBeInTheDocument());
  });

  it("sends prior conversation turns as history on a follow-up message", async () => {
    sendFinoraMessage
      .mockResolvedValueOnce({ status: "ok", reply: "You spent 12,000 on food.", scenario: null })
      .mockResolvedValueOnce({ status: "ok", reply: "That's about 8% more than last month.", scenario: null });

    const user = userEvent.setup();
    render(<FinoraChat dateFrom="2026-08-01" dateTo="2026-08-28" />);

    await user.type(getInput(), "How much did I spend on food?");
    await user.click(getSendButton());
    await screen.findByText("You spent 12,000 on food.");

    await user.type(getInput(), "Is that more than last month?");
    await user.click(getSendButton());
    await screen.findByText("That's about 8% more than last month.");

    expect(sendFinoraMessage).toHaveBeenLastCalledWith(
      expect.objectContaining({
        message: "Is that more than last month?",
        history: [
          { role: "user", content: "How much did I spend on food?" },
          { role: "assistant", content: "You spent 12,000 on food." },
        ],
      })
    );
  });

  it("shows a friendly error with a retry option on network/API failure", async () => {
    sendFinoraMessage.mockRejectedValue(new Error("network down"));
    const user = userEvent.setup();
    render(<FinoraChat dateFrom="2026-08-01" dateTo="2026-08-28" />);

    await user.type(getInput(), "How am I doing?");
    await user.click(getSendButton());

    expect(await screen.findByText(/couldn't reach finora/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
    // No fabricated assistant reply should appear.
    expect(screen.queryByText(/all good/i)).not.toBeInTheDocument();
  });

  it("retries sending the same failed message", async () => {
    sendFinoraMessage
      .mockRejectedValueOnce(new Error("network down"))
      .mockResolvedValueOnce({ status: "ok", reply: "Recovered reply.", scenario: null });

    const user = userEvent.setup();
    render(<FinoraChat dateFrom="2026-08-01" dateTo="2026-08-28" />);

    await user.type(getInput(), "How am I doing?");
    await user.click(getSendButton());
    await screen.findByText(/couldn't reach finora/i);

    await user.click(screen.getByRole("button", { name: /retry/i }));

    expect(await screen.findByText("Recovered reply.")).toBeInTheDocument();
    expect(sendFinoraMessage).toHaveBeenCalledTimes(2);
    expect(sendFinoraMessage).toHaveBeenLastCalledWith(
      expect.objectContaining({ message: "How am I doing?" })
    );
  });

  it("shows the backend's unavailable message without fabricating a reply", async () => {
    sendFinoraMessage.mockResolvedValue({ status: "unavailable", message: "Finora is temporarily unavailable." });
    const user = userEvent.setup();
    render(<FinoraChat dateFrom="2026-08-01" dateTo="2026-08-28" />);

    await user.type(getInput(), "How am I doing?");
    await user.click(getSendButton());

    expect(await screen.findByText("Finora is temporarily unavailable.")).toBeInTheDocument();
  });

  it("sends the message on Enter and inserts a newline on Shift+Enter", async () => {
    sendFinoraMessage.mockResolvedValue({ status: "ok", reply: "Got it.", scenario: null });
    const user = userEvent.setup();
    render(<FinoraChat dateFrom="2026-08-01" dateTo="2026-08-28" />);

    await user.type(getInput(), "Line one{Shift>}{Enter}{/Shift}Line two");
    expect(getInput()).toHaveValue("Line one\nLine two");
    expect(sendFinoraMessage).not.toHaveBeenCalled();

    await user.type(getInput(), "{Enter}");

    expect(sendFinoraMessage).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Line one\nLine two" })
    );
  });

  it("renders a returned what-if scenario using the backend's own numbers", async () => {
    sendFinoraMessage.mockResolvedValue({
      status: "ok",
      reply: "If you cut dining out by 20%, you'd save more each month.",
      scenario: {
        type: "reduce_category_spending",
        currency: "INR",
        category: "Dining Out",
        current_category_spend: 5000,
        reduction_amount: 1000,
        new_category_spend: 4000,
        current_net_savings: 2000,
        new_net_savings: 3000,
        current_expenses_total: 15000,
        new_expenses_total: 14000,
        current_savings_rate_percent: 12,
        new_savings_rate_percent: 18,
      },
    });
    const user = userEvent.setup();
    render(<FinoraChat dateFrom="2026-08-01" dateTo="2026-08-28" />);

    await user.type(getInput(), "What if I cut dining out by 20%?");
    await user.click(getSendButton());

    await screen.findByText(/if you cut dining out by 20%/i);

    expect(screen.getByText("Reduce Category Spending")).toBeInTheDocument();
    expect(screen.getByText("Reduction")).toBeInTheDocument();
    expect(screen.getByText("Current Savings Rate")).toBeInTheDocument();
    expect(screen.getByText("18%")).toBeInTheDocument();
  });

  it("shows the scenario's unavailable explanation without inventing numbers", async () => {
    sendFinoraMessage.mockResolvedValue({
      status: "ok",
      reply: "I couldn't run that scenario.",
      scenario: {
        type: "reduce_category_spending",
        unavailable_reason: "No spending on record for category 'Travel' in the current period.",
      },
    });
    const user = userEvent.setup();
    render(<FinoraChat dateFrom="2026-08-01" dateTo="2026-08-28" />);

    await user.type(getInput(), "What if I cut travel spending?");
    await user.click(getSendButton());

    expect(
      await screen.findByText("No spending on record for category 'Travel' in the current period.")
    ).toBeInTheDocument();
  });

  it("renders Markdown bold/list syntax as real formatting, not raw asterisks", async () => {
    sendFinoraMessage.mockResolvedValue({
      status: "ok",
      reply: "July mein **₹50,000** spend hua.\n\n- Food: ₹20,000\n- Rent: ₹30,000",
      scenario: null,
    });
    const user = userEvent.setup();
    render(<FinoraChat dateFrom="2026-08-01" dateTo="2026-08-28" />);

    await user.type(getInput(), "How much did I spend?");
    await user.click(getSendButton());

    const bold = await screen.findByText("₹50,000");
    expect(bold.tagName).toBe("STRONG");
    expect(screen.queryByText(/\*\*/)).not.toBeInTheDocument();

    expect(screen.getByText("Food: ₹20,000")).toBeInTheDocument();
    expect(screen.getByText("Rent: ₹30,000")).toBeInTheDocument();
    expect(screen.getByText("Food: ₹20,000").closest("li")).not.toBeNull();
  });

  it("does not apply Markdown parsing to the user's own message", async () => {
    sendFinoraMessage.mockResolvedValue({ status: "ok", reply: "Got it.", scenario: null });
    const user = userEvent.setup();
    render(<FinoraChat dateFrom="2026-08-01" dateTo="2026-08-28" />);

    await user.type(getInput(), "Is **this** bold?");
    await user.click(getSendButton());

    expect(screen.getByText("Is **this** bold?")).toBeInTheDocument();
  });

  it("sends a multilingual/mixed-language message exactly as typed", async () => {
    sendFinoraMessage.mockResolvedValue({ status: "ok", reply: "Samajh gaya.", scenario: null });
    const user = userEvent.setup();
    render(<FinoraChat dateFrom="2026-08-01" dateTo="2026-08-28" />);

    const mixedMessage = "Is mahine mera kharcha zyada tha kya?";
    await user.type(getInput(), mixedMessage);
    await user.click(getSendButton());

    expect(screen.getByText(mixedMessage)).toBeInTheDocument();
    expect(sendFinoraMessage).toHaveBeenCalledWith(expect.objectContaining({ message: mixedMessage }));
  });
});
