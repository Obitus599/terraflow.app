"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatAedCompact } from "@/lib/format";

export interface MonthlyLineDatum {
  label: string;
  forecast: number;
  target: number;
}

interface MonthlyLineChartProps {
  data: MonthlyLineDatum[];
  height?: number;
}

export function MonthlyLineChart({ data, height = 280 }: MonthlyLineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="#1A1A1A" strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="label"
          stroke="#737373"
          fontSize={11}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#737373"
          fontSize={11}
          tickFormatter={(v) => formatAedCompact(Number(v))}
          tickLine={false}
          axisLine={false}
          width={64}
        />
        <Tooltip
          contentStyle={{
            background: "#171717",
            border: "1px solid #262626",
            borderRadius: 8,
            fontSize: 12,
          }}
          labelStyle={{ color: "#A3A3A3" }}
          itemStyle={{ color: "#FAFAFA" }}
          formatter={(value, name) => [
            formatAedCompact(Number(value)),
            name === "forecast" ? "Forecast" : "Target",
          ]}
        />
        <Legend
          formatter={(value) =>
            value === "forecast" ? "Forecast" : "Target"
          }
          wrapperStyle={{ fontSize: 12, color: "#A3A3A3" }}
        />
        <Line
          type="monotone"
          dataKey="forecast"
          stroke="#D4FF3D"
          strokeWidth={2}
          dot={{ r: 4, fill: "#D4FF3D" }}
          activeDot={{ r: 5 }}
        />
        <Line
          type="monotone"
          dataKey="target"
          stroke="#737373"
          strokeWidth={1.5}
          strokeDasharray="4 4"
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
