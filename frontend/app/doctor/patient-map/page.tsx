"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Download, Filter, MapPin, Users } from "lucide-react";

export default function PatientMapPage() {
  const [filter, setFilter] = useState<string>("all");
  const [conditionFilter, setConditionFilter] = useState<string>("all");
  
  // Mock data - in a real app, this would come from an API
  const regions = [
    { id: "1", name: "Downtown", patientCount: 45, density: "high", coordinates: { x: 150, y: 150 } },
    { id: "2", name: "North Side", patientCount: 32, density: "medium", coordinates: { x: 150, y: 80 } },
    { id: "3", name: "West End", patientCount: 28, density: "medium", coordinates: { x: 80, y: 150 } },
    { id: "4", name: "East Village", patientCount: 18, density: "low", coordinates: { x: 220, y: 150 } },
    { id: "5", name: "South Park", patientCount: 22, density: "low", coordinates: { x: 150, y: 220 } },
  ];

  const conditions = [
    { name: "Anxiety", count: 85, color: "hsl(var(--chart-1))" },
    { name: "Depression", count: 67, color: "hsl(var(--chart-2))" },
    { name: "PTSD", count: 42, color: "hsl(var(--chart-3))" },
    { name: "Bipolar", count: 28, color: "hsl(var(--chart-4))" },
    { name: "Other", count: 26, color: "hsl(var(--chart-5))" },
  ];

  const filteredRegions = filter === "all" 
    ? regions 
    : regions.filter(region => region.density === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Patient Map</h1>
          <p className="text-muted-foreground">
            Geographic distribution of your patients
          </p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export Data
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Region Map</CardTitle>
                <CardDescription>
                  Visual representation of patient distribution
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="mr-2 h-4 w-4" />
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
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="map">
              <TabsList className="mb-4">
                <TabsTrigger value="map">Map View</TabsTrigger>
                <TabsTrigger value="list">List View</TabsTrigger>
              </TabsList>
              <TabsContent value="map">
                <div className="h-[500px] relative border rounded-md p-4">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-muted-foreground">Interactive map visualization would appear here</p>
                  </div>
                  
                  {/* Simplified map visualization */}
                  <div className="absolute inset-0">
                    {filteredRegions.map(region => (
                      <div 
                        key={region.id}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2"
                        style={{ 
                          left: region.coordinates.x, 
                          top: region.coordinates.y,
                        }}
                      >
                        <div 
                          className={`rounded-full flex items-center justify-center border-4 border-background ${
                            region.density === "high" 
                              ? "bg-red-500/70" 
                              : region.density === "medium"
                              ? "bg-yellow-500/70"
                              : "bg-green-500/70"
                          }`}
                          style={{ 
                            width: `${region.patientCount + 20}px`, 
                            height: `${region.patientCount + 20}px`,
                          }}
                        >
                          <div className="text-xs font-bold text-white">
                            {region.patientCount}
                          </div>
                        </div>
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 whitespace-nowrap">
                          <span className="text-xs font-medium">{region.name}</span>
                        </div>
                      </div>
                    ))}
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
              </TabsContent>
              <TabsContent value="list">
                <div className="space-y-4">
                  {filteredRegions.map(region => (
                    <div key={region.id} className="flex items-center justify-between p-4 border rounded-md">
                      <div className="flex items-center space-x-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <MapPin className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium">{region.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {region.patientCount} patients
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={
                          region.density === "high"
                            ? "destructive"
                            : region.density === "medium"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {region.density} density
                      </Badge>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Condition Distribution</CardTitle>
            <CardDescription>
              Filter map by mental health conditions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={conditionFilter} onValueChange={setConditionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by condition" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Conditions</SelectItem>
                {conditions.map(condition => (
                  <SelectItem key={condition.name} value={condition.name.toLowerCase()}>
                    {condition.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="mt-6 space-y-4">
              <h4 className="font-medium">Condition Breakdown</h4>
              {conditions.map(condition => (
                <div key={condition.name} className="flex items-center space-x-4">
                  <div 
                    className="h-3 w-3 rounded-full" 
                    style={{ backgroundColor: condition.color }}
                  ></div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span>{condition.name}</span>
                      <span className="font-medium">{condition.count}</span>
                    </div>
                    <div className="w-full h-2 bg-secondary rounded-full mt-1">
                      <div 
                        className="h-full rounded-full" 
                        style={{ 
                          width: `${(condition.count / 248) * 100}%`,
                          backgroundColor: condition.color 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6">
              <h4 className="font-medium mb-2">Patient Hotspots</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    Downtown
                  </span>
                  <Badge variant="outline">45 patients</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    North Side
                  </span>
                  <Badge variant="outline">32 patients</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    West End
                  </span>
                  <Badge variant="outline">28 patients</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}