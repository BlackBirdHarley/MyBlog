"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface Props {
  data: { date: string; views?: number; clicks?: number }[];
  dataKey: string;
  color?: string;
}

export function MiniLineChart({ data, dataKey, color = "#111827" }: Props) {
  return (
    <ResponsiveContainer width="100%" height={80}>
      <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -32 }}>
        <XAxis dataKey="date" hide />
        <YAxis hide />
        <Tooltip
          contentStyle={{ fontSize: 12, padding: "4px 8px" }}
          labelFormatter={(v) => v}
          formatter={(v) => [Number(v).toLocaleString(), dataKey]}
        />
        <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
