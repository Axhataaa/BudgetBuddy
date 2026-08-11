import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { formatCurrency } from "../../utils/formatCurrency";
import { usePreferences } from "../../hooks/usePreferences";

// Literal hex values (not CSS var()) - recharts renders these as raw
// SVG attributes, and while modern browsers do resolve var() in SVG
// presentation attributes, it's not guaranteed across recharts'
// internal rendering path, so this picks the real light/dark token
// value in JS via resolvedTheme instead of gambling on CSS cascading
// into inline SVG. Values match index.css's actual --color-* tokens
// for each theme exactly.
const PALETTE = {
  light: { income: "#1F9D6C", expense: "#D64545", grid: "#DDE1E7", tick: "#5B6472" },
  dark: { income: "#34D399", expense: "#F87171", grid: "#333856", tick: "#A6ACBD" },
};

function formatPeriodLabel(period, granularity) {
  if (granularity === "month") {
    const [year, month] = period.split("-");
    return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString("en-IN", {
      month: "short",
      year: "2-digit",
    });
  }
  return new Date(period).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function TrendChart({ trend, granularity }) {
  const { resolvedTheme } = usePreferences();
  const colors = PALETTE[resolvedTheme] || PALETTE.light;

  if (!trend?.length) {
    return (
      <div className="text-center text-muted py-5">
        No activity in this date range yet.
      </div>
    );
  }

  const chartData = trend.map((point) => ({
    ...point,
    label: formatPeriodLabel(point.period, granularity),
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={colors.income} stopOpacity={0.28} />
            <stop offset="95%" stopColor={colors.income} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={colors.expense} stopOpacity={0.28} />
            <stop offset="95%" stopColor={colors.expense} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 12, fill: colors.tick }} axisLine={false} tickLine={false} />
        <YAxis
          tick={{ fontSize: 12, fill: colors.tick }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => formatCurrency(v).replace(/\.00$/, "")}
          width={70}
        />
        <Tooltip
          formatter={(value) => formatCurrency(value)}
          contentStyle={{
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            boxShadow: "var(--shadow-md)",
          }}
          labelStyle={{ color: "var(--color-ink)" }}
          itemStyle={{ color: "var(--color-ink)" }}
        />
        <Legend wrapperStyle={{ color: "var(--color-ink-muted)" }} />
        <Area type="monotone" dataKey="income" name="Income" stroke={colors.income} fill="url(#incomeGradient)" strokeWidth={2} />
        <Area type="monotone" dataKey="expenses" name="Expenses" stroke={colors.expense} fill="url(#expenseGradient)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
