"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { PatientMap } from "../dashboard/patient-map";
import { PatientConditionChart } from "../dashboard/patient-condition-chart";
import { PatientTrendChart } from "../dashboard/patient-trend-chart";

export default function AnalyticsPage() {
  // Mock data - in a real app, this would come from an API
  const conditionData = [
    { name: "Anxiety", value: 85, color: "hsl(var(--chart-1))" },
    { name: "Depression", value: 67, color: "hsl(var(--chart-2))" },
    { name: "PTSD", value: 42, color: "hsl(var(--chart-3))" },
    { name: "Bipolar", value: 28, color: "hsl(var(--chart-4))" },
    { name: "Other", value: 26, color: "hsl(var(--chart-5))" },
  ];

  const trendData = [
    { name: "Jan", newPatients: 20, recoveredPatients: 10 },
    { name: "Feb", newPatients: 25, recoveredPatients: 15 },
    { name: "Mar", newPatients: 30, recoveredPatients: 20 },
    { name: "Apr", newPatients: 28, recoveredPatients: 22 },
    { name: "May", newPatients: 35, recoveredPatients: 25 },
    { name: "Jun", newPatients: 40, recoveredPatients: 30 },
  ];

  const treatmentData = [
    { name: "CBT", success: 75, partial: 15, noChange: 10 },
    { name: "Medication", success: 65, partial: 25, noChange: 10 },
    { name: "Mindfulness", success: 60, partial: 30, noChange: 10 },
    { name: "Group Therapy", success: 55, partial: 30, noChange: 15 },
    { name: "EMDR", success: 70, partial: 20, noChange: 10 },
  ];

  const regions: { id: string; name: string; patientCount: number; density: "low" | "medium" | "high"; }[] = [
    { id: "1", name: "Downtown", patientCount: 45, density: "high" },
    { id: "2", name: "North Side", patientCount: 32, density: "medium" },
    { id: "3", name: "West End", patientCount: 28, density: "medium" },
    { id: "4", name: "East Village", patientCount: 18, density: "low" },
    { id: "5", name: "South Park", patientCount: 22, density: "low" },
  ];
  

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics & Insights</h1>
        <p className="text-muted-foreground">
          Visualize patient data and treatment effectiveness
        </p>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="treatments">Treatment Effectiveness</TabsTrigger>
          <TabsTrigger value="demographics">Demographics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <PatientConditionChart data={conditionData} />
            <PatientTrendChart data={trendData} />
          </div>
          <PatientMap regions={regions} />
        </TabsContent>
        
        <TabsContent value="treatments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Treatment Effectiveness</CardTitle>
              <CardDescription>Success rates of different treatment approaches</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={treatmentData}
                    margin={{
                      top: 20,
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
                    <Bar dataKey="success" name="Successful" stackId="a" fill="hsl(var(--chart-1))" />
                    <Bar dataKey="partial" name="Partial Improvement" stackId="a" fill="hsl(var(--chart-2))" />
                    <Bar dataKey="noChange" name="No Change" stackId="a" fill="hsl(var(--chart-3))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Cognitive Behavioral Therapy</CardTitle>
                <CardDescription>Effectiveness analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4">
                  <div className="text-5xl font-bold text-primary">75%</div>
                  <p className="text-sm text-muted-foreground mt-2">Success Rate</p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Anxiety:</span>
                    <span className="font-medium">82% effective</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Depression:</span>
                    <span className="font-medium">78% effective</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>PTSD:</span>
                    <span className="font-medium">65% effective</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Medication</CardTitle>
                <CardDescription>Effectiveness analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4">
                  <div className="text-5xl font-bold text-primary">65%</div>
                  <p className="text-sm text-muted-foreground mt-2">Success Rate</p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Anxiety:</span>
                    <span className="font-medium">70% effective</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Depression:</span>
                    <span className="font-medium">75% effective</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Bipolar:</span>
                    <span className="font-medium">80% effective</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>EMDR Therapy</CardTitle>
                <CardDescription>Effectiveness analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4">
                  <div className="text-5xl font-bold text-primary">70%</div>
                  <p className="text-sm text-muted-foreground mt-2">Success Rate</p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>PTSD:</span>
                    <span className="font-medium">85% effective</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Anxiety:</span>
                    <span className="font-medium">65% effective</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Trauma:</span>
                    <span className="font-medium">78% effective</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="demographics" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Age Distribution</CardTitle>
                <CardDescription>Patient age groups</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { age: "18-24", count: 35 },
                        { age: "25-34", count: 65 },
                        { age: "35-44", count: 52 },
                        { age: "45-54", count: 40 },
                        { age: "55-64", count: 30 },
                        { age: "65+", count: 25 },
                      ]}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="age" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="hsl(var(--chart-1))" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Gender Distribution</CardTitle>
                <CardDescription>Patient gender breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { gender: "Female", count: 135 },
                        { gender: "Male", count: 95 },
                        { gender: "Non-binary", count: 18 },
                      ]}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="gender" type="category" />
                      <Tooltip />
                      <Bar dataKey="count" fill="hsl(var(--chart-2))" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <PatientMap regions={regions} />
        </TabsContent>
      </Tabs>
    </div>
  );
}