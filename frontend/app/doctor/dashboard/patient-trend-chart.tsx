"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface TrendData {
  name: string;
  newPatients: number;
  recoveredPatients: number;
}

interface PatientTrendChartProps {
  data: TrendData[];
}

export function PatientTrendChart({ data }: PatientTrendChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Patient Trends</CardTitle>
        <CardDescription>New and recovered patients over time</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="newPatients" stroke="hsl(var(--chart-1))" activeDot={{ r: 8 }} />
              <Line type="monotone" dataKey="recoveredPatients" stroke="hsl(var(--chart-2))" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}