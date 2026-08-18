import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { MONTH_NAMES } from "../../components/ui/PeriodSelector";

const PRIMARY = "#303B8E";

export default function RegistrationsChart({ data }) {
  const chartData = (data || []).map((row) => ({
    label: `${MONTH_NAMES[row.month - 1]?.slice(0, 3)} ${String(row.year).slice(2)}`,
    count: row.count,
  }));

  if (!chartData.some((row) => row.count > 0)) {
    return (
      <div className="text-center text-muted-ink py-5">
        No registrations recorded in the last 6 months.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
        <XAxis dataKey="label" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} width={28} />
        <Tooltip formatter={(value) => [value, "New users"]} />
        <Bar dataKey="count" fill={PRIMARY} radius={[4, 4, 0, 0]} maxBarSize={40} />
      </BarChart>
    </ResponsiveContainer>
  );
}
