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

interface DataPoint {
  date: string;
  [key: string]: string | number;
}

interface Series {
  key: string;
  label: string;
  color: string;
}

interface Props {
  data: DataPoint[];
  series: Series[];
  height?: number;
}

export function FullLineChart({ data, series, height = 260 }: Props) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 4, right: 16, bottom: 0, left: -16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          tickFormatter={(v) => {
            const d = new Date(v);
            return `${d.getMonth() + 1}/${d.getDate()}`;
          }}
          interval="preserveStartEnd"
        />
        <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} allowDecimals={false} />
        <Tooltip
          contentStyle={{ fontSize: 12 }}
          labelFormatter={(v) => String(v)}
        />
        {series.map((s) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label}
            stroke={s.color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
