'use client'

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js'
import { Doughnut } from 'react-chartjs-2'

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
)

interface DoughnutChartProps {
  data: Array<{ label: string; value: number }>
  title: string
  colors?: string[]
}

export function DoughnutChart({ 
  data, 
  title,
  colors = [
    'rgb(99, 102, 241)',
    'rgb(59, 130, 246)',
    'rgb(147, 51, 234)',
    'rgb(236, 72, 153)',
    'rgb(234, 179, 8)',
  ]
}: DoughnutChartProps) {
  const chartData = {
    labels: data.map(item => item.label),
    datasets: [
      {
        label: title,
        data: data.map(item => item.value),
        backgroundColor: colors,
        borderColor: colors.map(color => `${color}33`),
        borderWidth: 1,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
      },
    },
  }

  return <Doughnut data={chartData} options={options} />
}