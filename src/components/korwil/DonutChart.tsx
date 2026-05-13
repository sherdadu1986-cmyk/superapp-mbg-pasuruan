"use client"
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

interface DonutChartProps {
  data: { name: string, value: number, color: string }[]
}

export default function DonutChart({ data }: DonutChartProps) {
  return (
    <div className="w-10 h-10 shrink-0">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie 
            data={data} 
            innerRadius={14} 
            outerRadius={18} 
            paddingAngle={2} 
            dataKey="value" 
            stroke="none"
            animationDuration={1000}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
