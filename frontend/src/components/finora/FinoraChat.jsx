import { useEffect, useRef, useState } from "react";
import {
  LuChartColumn,
  LuChartPie,
  LuLock,
  LuMessageCircle,
  LuPiggyBank,
  LuRotateCcw,
  LuSend,
  LuSparkles,
  LuTarget,
  LuTriangleAlert,
  LuUser,
} from "react-icons/lu";

import Button from "../ui/Button";
import { formatCurrency } from "../../utils/formatCurrency";
import { sendFinoraMessage } from "../../services/finoraService";

const SUGGESTED_PROMPTS = [
  { text: "How much did I spend this month?", icon: LuChartColumn, tone: "tone-primary" },
  { text: "What are my top expense categories?", icon: LuChartPie, tone: "tone-expense" },
  { text: "Am I on track with my budgets?", icon: LuTarget, tone: "tone-accent" },
  { text: "What are my savings goals?", icon: LuPiggyBank, tone: "tone-income" },
];

const GENERIC_ERROR = "Couldn't reach Finora. Check your connection and try again.";
const UNEXPECTED_RESPONSE_ERROR = "Finora sent back something unexpected. Please try again.";

// ---------------------------------------------------------------------
// Minimal, safe Markdown rendering
//
// Finora's replies can contain a small subset of Markdown (bold, italic,
// inline code, headings, bullet/numbered lists). Rather than pull in a
// new dependency or inject raw HTML, this parses that subset directly
// into React elements - there is no dangerouslySetInnerHTML anywhere
// here, so there is nothing for stray/incorrect Markdown to break out
// of or inject into.
// ---------------------------------------------------------------------

function parseInline(text, keyPrefix) {
  const nodes = [];
  let remaining = text;
  let index = 0;
  const pattern = /\*\*([^*]+)\*\*|`([^`]+)`|\*([^*]+)\*|_([^_]+)_/;

  while (remaining.length) {
    const match = pattern.exec(remaining);
    if (!match) {
      nodes.push(remaining);
      break;
    }

    if (match.index > 0) {
      nodes.push(remaining.slice(0, match.index));
    }

    const key = `${keyPrefix}-${index++}`;
    if (match[1] !== undefined) {
      nodes.push(<strong key={key}>{match[1]}</strong>);
    } else if (match[2] !== undefined) {
      nodes.push(
        <code key={key} className="finora-inline-code">
          {match[2]}
        </code>
      );
    } else if (match[3] !== undefined) {
      nodes.push(<em key={key}>{match[3]}</em>);
    } else {
      nodes.push(<em key={key}>{match[4]}</em>);
    }

    remaining = remaining.slice(match.index + match[0].length);
  }

  return nodes;
}

function parseMarkdownBlocks(text) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i++;
      continue;
    }

    const headingMatch = /^(#{1,6})\s+(.*)$/.exec(line);
    if (headingMatch) {
      blocks.push({ type: "heading", level: headingMatch[1].length, content: headingMatch[2].trim() });
      i++;
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*]\s+/, "").trim());
        i++;
      }
      blocks.push({ type: "ul", items });
      continue;
    }

    if (/^\d+[.)]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+[.)]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+[.)]\s+/, "").trim());
        i++;
      }
      blocks.push({ type: "ol", items });
      continue;
    }

    const paraLines = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^(#{1,6})\s+/.test(lines[i]) &&
      !/^[-*]\s+/.test(lines[i]) &&
      !/^\d+[.)]\s+/.test(lines[i])
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    blocks.push({ type: "p", content: paraLines.join("\n") });
  }

  return blocks;
}

function MarkdownContent({ text }) {
  const blocks = parseMarkdownBlocks(text || "");

  return (
    <div className="finora-markdown">
      {blocks.map((block, blockIndex) => {
        const keyPrefix = `b${blockIndex}`;

        if (block.type === "heading") {
          const Tag = `h${Math.min(block.level + 3, 6)}`;
          return (
            <Tag key={blockIndex} className="finora-md-heading">
              {parseInline(block.content, keyPrefix)}
            </Tag>
          );
        }

        if (block.type === "ul") {
          return (
            <ul key={blockIndex} className="finora-md-list">
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>{parseInline(item, `${keyPrefix}-${itemIndex}`)}</li>
              ))}
            </ul>
          );
        }

        if (block.type === "ol") {
          return (
            <ol key={blockIndex} className="finora-md-list">
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>{parseInline(item, `${keyPrefix}-${itemIndex}`)}</li>
              ))}
            </ol>
          );
        }

        const paraLines = block.content.split("\n");
        return (
          <p key={blockIndex} className="finora-md-paragraph">
            {paraLines.map((line, lineIndex) => (
              <span key={lineIndex}>
                {parseInline(line, `${keyPrefix}-${lineIndex}`)}
                {lineIndex < paraLines.length - 1 && <br />}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------
// What-if scenario display
//
// The backend's deterministic `finora.whatif` engine is the ONLY thing
// that computes these numbers - this component only formats and labels
// whatever it receives. Nothing here recalculates, rounds, or
// reinterprets a value.
// ---------------------------------------------------------------------

const SCENARIO_TYPE_LABELS = {
  reduce_category_spending: "Reduce Category Spending",
  increase_savings: "Increase Monthly Savings",
  income_change: "Income Change",
  goal_timeline: "Goal Timeline",
  one_time_expense: "One-Time Expense",
  unsupported: "What-If Scenario",
};

const SCENARIO_FIELD_CONFIG = {
  category: { label: "Category", format: "text" },
  goal_name: { label: "Goal", format: "text" },
  matched_budget_category: { label: "Matched Budget", format: "text" },
  target_date_on_record: { label: "Target Date", format: "date" },
  current_category_spend: { label: "Current Spend", format: "currency" },
  reduction_amount: { label: "Reduction", format: "currency" },
  new_category_spend: { label: "New Spend", format: "currency" },
  current_net_savings: { label: "Current Net Savings", format: "currency" },
  new_net_savings: { label: "New Net Savings", format: "currency" },
  current_expenses_total: { label: "Current Expenses", format: "currency" },
  new_expenses_total: { label: "New Expenses", format: "currency" },
  current_savings_rate_percent: { label: "Current Savings Rate", format: "percent" },
  new_savings_rate_percent: { label: "New Savings Rate", format: "percent" },
  extra_monthly_amount: { label: "Extra Monthly Amount", format: "currency" },
  projected_extra_after_12_months: { label: "Extra After 12 Months", format: "currency" },
  income_change_amount: { label: "Income Change", format: "currency" },
  current_income: { label: "Current Income", format: "currency" },
  new_income: { label: "New Income", format: "currency" },
  already_reached: { label: "Already Reached", format: "boolean" },
  remaining_amount: { label: "Remaining Amount", format: "currency" },
  monthly_pace: { label: "Monthly Savings Pace", format: "currency" },
  months_to_goal: { label: "Estimated Time to Goal", format: "months" },
  reachable: { label: "Reachable at This Pace", format: "boolean" },
  expense_amount: { label: "Expense Amount", format: "currency" },
  stays_positive: { label: "Stays Positive", format: "boolean" },
  budget_limit: { label: "Budget Limit", format: "currency" },
  budget_already_spent: { label: "Already Spent", format: "currency" },
  budget_remaining_before: { label: "Budget Remaining Before", format: "currency" },
  budget_remaining_after: { label: "Budget Remaining After", format: "currency" },
  exceeds_budget: { label: "Exceeds Budget", format: "boolean" },
};

// Internal/bookkeeping fields that aren't meaningful to show to the user.
const SCENARIO_HIDDEN_KEYS = new Set([
  "type",
  "currency",
  "unavailable_reason",
  "period_days",
  "period_is_monthly",
]);

function humanizeKey(key) {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatScenarioValue(value, format, currency) {
  if (value === null || value === undefined) return "—";

  switch (format) {
    case "currency":
      // rate=1: display the value exactly as the backend returned it, in
      // the scenario's own currency - no conversion, no recalculation.
      return formatCurrency(value, currency, 1);
    case "percent":
      return `${value}%`;
    case "boolean":
      return value ? "Yes" : "No";
    case "months":
      return `${value} month${value === 1 ? "" : "s"}`;
    default:
      return String(value);
  }
}

function ScenarioCard({ scenario }) {
  if (!scenario) return null;

  const typeLabel = SCENARIO_TYPE_LABELS[scenario.type] || "What-If Scenario";

  if (scenario.unavailable_reason) {
    return (
      <div className="finora-scenario-card">
        <div className="finora-scenario-header">
          <LuTriangleAlert size={15} className="text-warning" />
          <span>{typeLabel}</span>
        </div>
        <p className="text-muted-ink small mb-0 mt-2">{scenario.unavailable_reason}</p>
      </div>
    );
  }

  const entries = Object.entries(scenario).filter(
    ([key, value]) => !SCENARIO_HIDDEN_KEYS.has(key) && value !== null && value !== undefined
  );

  if (entries.length === 0) return null;

  return (
    <div className="finora-scenario-card">
      <div className="finora-scenario-header">
        <LuSparkles size={15} style={{ color: "var(--color-accent)" }} />
        <span>Scenario Result</span>
      </div>
      <p className="finora-scenario-subtitle">{typeLabel}</p>
      <div className="finora-scenario-rows">
        {entries.map(([key, value]) => {
          const config = SCENARIO_FIELD_CONFIG[key];
          const format =
            config?.format || (typeof value === "boolean" ? "boolean" : typeof value === "number" ? "currency" : "text");
          const label = config?.label || humanizeKey(key);

          return (
            <div key={key} className="finora-scenario-row">
              <span className="finora-scenario-row-label">{label}</span>
              <span className="finora-scenario-row-value">
                {formatScenarioValue(value, format, scenario.currency)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// Chat
// ---------------------------------------------------------------------

function buildHistoryPayload(messages, excludeId = null) {
  return messages
    .filter((m) => m.id !== excludeId)
    .filter((m) => m.role === "user" || (m.role === "assistant" && m.status === "ok"))
    .map((m) => ({ role: m.role, content: m.content }));
}

export default function FinoraChat({ dateFrom, dateTo }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [failedMessage, setFailedMessage] = useState(null);
  const [errorText, setErrorText] = useState(null);

  const idCounter = useRef(0);
  const scrollRef = useRef(null);
  const textareaRef = useRef(null);

  const nextId = () => {
    idCounter.current += 1;
    return `finora-msg-${idCounter.current}`;
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sending]);

  const requestReply = async (userMessage, historyForRequest) => {
    setSending(true);
    setFailedMessage(null);
    setErrorText(null);

    try {
      const data = await sendFinoraMessage({
        message: userMessage.content,
        history: historyForRequest,
        dateFrom,
        dateTo,
      });

      if (data?.status === "ok" && typeof data.reply === "string" && data.reply.trim()) {
        setMessages((prev) => [
          ...prev,
          {
            id: nextId(),
            role: "assistant",
            content: data.reply,
            status: "ok",
            scenario: data.scenario || null,
          },
        ]);
      } else if (data?.status === "unavailable") {
        setMessages((prev) => [
          ...prev,
          {
            id: nextId(),
            role: "assistant",
            content: data.message || "Finora is temporarily unavailable.",
            status: "unavailable",
            scenario: null,
          },
        ]);
      } else {
        setFailedMessage(userMessage);
        setErrorText(UNEXPECTED_RESPONSE_ERROR);
      }
    } catch {
      setFailedMessage(userMessage);
      setErrorText(GENERIC_ERROR);
    } finally {
      setSending(false);
    }
  };

  const submitMessage = (rawText) => {
    const text = rawText.trim();
    if (!text || sending) return;

    const historyForRequest = buildHistoryPayload(messages);
    const userMessage = { id: nextId(), role: "user", content: text };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    requestReply(userMessage, historyForRequest);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    submitMessage(input);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submitMessage(input);
    }
  };

  const handleRetry = () => {
    if (!failedMessage) return;
    const historyForRequest = buildHistoryPayload(messages, failedMessage.id);
    requestReply(failedMessage, historyForRequest);
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="finora-chat-shell">
      <div className="finora-chat-scroll" ref={scrollRef}>
        {isEmpty && !sending && (
          <div className="finora-chat-empty">
            <span className="finora-chat-hero-icon">
              <LuMessageCircle size={26} />
            </span>
            <h3 className="finora-chat-empty-title">Ask Finora anything about your finances</h3>
            <p className="finora-chat-empty-subtitle">
              Your AI financial assistant for income, spending, budgets, savings goals, and
              what-if questions &mdash; in English, Hindi, Hinglish, or a mix.
            </p>
            <div className="finora-suggestion-grid">
              {SUGGESTED_PROMPTS.map(({ text, icon: Icon, tone }) => (
                <button
                  key={text}
                  type="button"
                  className="finora-suggestion-card"
                  onClick={() => setInput(text)}
                >
                  <span className={`finora-suggestion-icon ${tone}`}>
                    <Icon size={15} />
                  </span>
                  {text}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id} className={`finora-chat-row ${m.role}`}>
            <span
              className={`finora-chat-avatar ${m.role === "user" ? "bg-primary text-white" : "badge-accent-subtle"}`}
            >
              {m.role === "user" ? <LuUser size={15} /> : <LuSparkles size={15} />}
            </span>
            <div className="finora-chat-bubble-wrap">
              <div
                className={`finora-chat-bubble ${m.role} ${m.status === "unavailable" ? "unavailable" : ""}`}
              >
                {m.role === "assistant" && m.status === "ok" ? (
                  <MarkdownContent text={m.content} />
                ) : (
                  m.content
                )}
              </div>
              {m.scenario && <ScenarioCard scenario={m.scenario} />}
            </div>
          </div>
        ))}

        {sending && (
          <div className="finora-chat-row assistant">
            <span className="finora-chat-avatar badge-accent-subtle">
              <LuSparkles size={15} />
            </span>
            <div className="finora-chat-bubble-wrap">
              <div className="finora-chat-bubble assistant">
                <span className="finora-chat-typing" aria-label="Finora is thinking">
                  Finora is thinking
                  <span className="finora-chat-typing-dots">
                    <span className="finora-chat-typing-dot" />
                    <span className="finora-chat-typing-dot" />
                    <span className="finora-chat-typing-dot" />
                  </span>
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {failedMessage && (
        <div className="d-flex align-items-center flex-wrap gap-2 mb-2 small text-danger">
          <LuTriangleAlert size={14} />
          <span>{errorText}</span>
          <Button variant="secondary" size="sm" icon={LuRotateCcw} onClick={handleRetry}>
            Retry
          </Button>
        </div>
      )}

      <form onSubmit={handleFormSubmit}>
        <div className="finora-composer">
          <LuMessageCircle size={17} className="finora-composer-icon" />
          <textarea
            ref={textareaRef}
            className="form-control finora-chat-input"
            placeholder="Ask Finora about your income, spending, budgets, or goals..."
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-label="Message Finora"
          />
          <Button type="submit" variant="primary" icon={LuSend} loading={sending} disabled={sending || !input.trim()}>
            Send
          </Button>
        </div>
      </form>

      <p className="finora-chat-disclaimer">
        <LuLock size={11} />
        Finora may make mistakes. Please review important financial decisions.
      </p>
    </div>
  );
}
