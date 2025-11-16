'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

const alerts = [
  {
    id: '1',
    user: 'User #8742',
    severity: 'high',
    status: 'active',
    timestamp: '15 minutes ago',
    message: 'Suicidal ideation detected',
  },
  {
    id: '2',
    user: 'User #6391',
    severity: 'medium',
    status: 'active',
    timestamp: '45 minutes ago',
    message: 'Self-harm indicators',
  },
  {
    id: '3',
    user: 'User #9124',
    severity: 'high',
    status: 'resolved',
    timestamp: '2 hours ago',
    message: 'Suicidal ideation detected',
  },
  {
    id: '4',
    user: 'User #5287',
    severity: 'medium',
    status: 'resolved',
    timestamp: '5 hours ago',
    message: 'Severe depression indicators',
  },
];

export function CrisisAlerts() {
  return (
    <div className="space-y-4">
      {alerts.map((alert) => (
        <div key={alert.id} className="flex flex-col space-y-2 border rounded-md p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {alert.status === 'active' ? (
                <AlertTriangle className="h-4 w-4 text-destructive" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              )}
              <span className="text-sm font-medium">{alert.user}</span>
            </div>
            <Badge 
              variant={alert.status === 'active' ? 'destructive' : 'outline'} 
              className="text-xs"
            >
              {alert.status}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">{alert.message}</p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{alert.timestamp}</span>
            {alert.status === 'active' && (
              <Button variant="outline" size="sm" className="h-7 text-xs">
                Respond
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}