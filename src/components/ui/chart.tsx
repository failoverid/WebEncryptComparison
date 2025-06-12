"use client"
import * as React from "react"
import { CartesianGrid, Line, LineChart, XAxis, Tooltip, ResponsiveContainer } from "recharts"

export type ChartConfig = Record<string, { label: string; color?: string }>

export function ChartContainer({ children, config, className }: { children: React.ReactNode, config: ChartConfig, className?: string }) {
  return (
    <div className={className}>{children}</div>
  )
}

export function ChartTooltip({ content }: { content: React.ReactNode }) {
  return <Tooltip content={content} />
}

export function ChartTooltipContent({ active, payload, label, className, nameKey = "value", labelFormatter }: any) {
  if (!active || !payload || !payload.length) return null
  return (
    <div className={className}>
      <div className="font-bold mb-1">{labelFormatter ? labelFormatter(label) : label}</div>
      {payload.map((entry: any, idx: number) => (
        <div key={idx} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: entry.color }} />
          <span>{entry.name}: </span>
          <span className="font-mono">{entry.value}</span>
        </div>
      ))}
    </div>
  )
}
