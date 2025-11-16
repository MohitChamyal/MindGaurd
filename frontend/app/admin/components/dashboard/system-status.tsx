'use client';

import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export function SystemStatus() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <span className="text-sm font-medium">System Status</span>
        </div>
        <Badge variant="outline" className="text-xs">
          Operational
        </Badge>
      </div>
      
      <div className="space-y-3">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-sm">API Response Time</span>
            <span className="text-xs text-muted-foreground">120ms</span>
          </div>
          <Progress value={20} className="h-1" />
        </div>
        
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-sm">Server Load</span>
            <span className="text-xs text-muted-foreground">42%</span>
          </div>
          <Progress value={42} className="h-1" />
        </div>
        
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-sm">Memory Usage</span>
            <span className="text-xs text-muted-foreground">68%</span>
          </div>
          <Progress value={68} className="h-1" />
        </div>
      </div>
      
      <div className="space-y-2">
        <span className="text-sm font-medium">Recent Events</span>
        <div className="space-y-2">
          <div className="flex items-start space-x-2 text-xs">
            <CheckCircle2 className="h-3 w-3 text-green-500 mt-0.5" />
            <div>
              <p className="font-medium">Database backup completed</p>
              <p className="text-muted-foreground">Today, 04:30 AM</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-2 text-xs">
            <AlertCircle className="h-3 w-3 text-amber-500 mt-0.5" />
            <div>
              <p className="font-medium">High API traffic detected</p>
              <p className="text-muted-foreground">Yesterday, 2:45 PM</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-2 text-xs">
            <CheckCircle2 className="h-3 w-3 text-green-500 mt-0.5" />
            <div>
              <p className="font-medium">System update completed</p>
              <p className="text-muted-foreground">Yesterday, 1:12 AM</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}