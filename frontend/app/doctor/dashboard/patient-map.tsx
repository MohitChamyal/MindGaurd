"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

interface PatientMapProps {
  regions: {
    id: string;
    name: string;
    patientCount: number;
    density: "low" | "medium" | "high";
  }[];
}

export function PatientMap({ regions }: PatientMapProps) {
  const [filter, setFilter] = useState<string>("all");

  const filteredRegions = filter === "all" 
    ? regions 
    : regions.filter(region => region.density === filter);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Patient Distribution</CardTitle>
            <CardDescription>Geographic distribution of your patients</CardDescription>
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by density" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Regions</SelectItem>
              <SelectItem value="low">Low Density</SelectItem>
              <SelectItem value="medium">Medium Density</SelectItem>
              <SelectItem value="high">High Density</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] relative border rounded-md p-4">
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-muted-foreground">Interactive map visualization would appear here</p>
          </div>
          <div className="absolute bottom-4 right-4 bg-background/80 backdrop-blur-sm p-4 rounded-md border">
            <h4 className="font-medium mb-2">Region Summary</h4>
            <div className="space-y-1">
              {filteredRegions.map(region => (
                <div key={region.id} className="flex justify-between text-sm">
                  <span>{region.name}:</span>
                  <span className="font-medium">{region.patientCount} patients</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}