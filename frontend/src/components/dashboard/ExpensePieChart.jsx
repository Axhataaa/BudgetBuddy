import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { formatCurrency } from "../../utils/formatCurrency";

const COLORS = [
  "#2563EB",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#06B6D4",
  "#F97316",
];

export default function ExpensePieChart({ data, labelKey = "category", valueKey = "total", emptyMessage = "No expense data available." }) {
  const chartData = data.map((item) => ({
    ...item,
    [valueKey]: Number(item[valueKey]),
  }));

  if (!chartData.length) {
    return (
      <div className="text-center text-muted py-5">
        {emptyMessage}
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <PieChart>
        <Pie
          data={chartData}
          dataKey={valueKey}
          nameKey={labelKey}
          cx="50%"
          cy="50%"
          outerRadius={90}
          label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
        >
          {chartData.map((_, index) => (
            <Cell
              key={index}
              fill={COLORS[index % COLORS.length]}
            />
          ))}
        </Pie>

        <Tooltip
          formatter={(value) => formatCurrency(value)}
        />

        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}