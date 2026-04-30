"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatAedCompact } from "@/lib/format";

export interface MonthlyDatum {
  label: string;
  value: number;
}

interface MonthlyBarChartProps {
  data: MonthlyDatum[];
  height?: number;
  tooltipLabel?: string;
}

export function MonthlyBarChart({
  data,
  height = 220,
  tooltipLabel = "AED",
}: MonthlyBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
          width={60}
        />
        <Tooltip
          cursor={{ fill: "rgba(212, 255, 61, 0.05)" }}
          contentStyle={{
            background: "#171717",
            border: "1px solid #262626",
            borderRadius: 8,
            fontSize: 12,
          }}
          labelStyle={{ color: "#A3A3A3" }}
          itemStyle={{ color: "#FAFAFA" }}
          formatter={(value) => [
            formatAedCompact(Number(value)),
            tooltipLabel,
          ]}
        />
        <Bar dataKey="value" fill="#D4FF3D" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
