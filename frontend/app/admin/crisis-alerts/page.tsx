'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, Search, Filter, CheckCircle2, PhoneCall, MessageSquare, Clock, User, Calendar } from 'lucide-react';

const crisisAlerts = [
  {
    id: '1',
    user: 'User #8742',
    severity: 'high',
    status: 'active',
    timestamp: '15 minutes ago',
    message: 'Suicidal ideation detected in conversation',
    triggerPhrase: "I don't want to live anymore",
    assignedTo: null,
  },
  {
    id: '2',
    user: 'User #6523',
    severity: 'medium',
    status: 'assigned',
    timestamp: '1 hour ago',
    message: 'Signs of severe anxiety detected',
    triggerPhrase: "I can't handle this anymore",
    assignedTo: 'Dr. Smith',
  },
  {
    id: '3',
    user: 'User #9134',
    severity: 'low',
    status: 'resolved',
    timestamp: '3 hours ago',
    message: 'Depression indicators identified',
    triggerPhrase: "Everything feels hopeless",
    assignedTo: 'Dr. Johnson',
  }
];

export default function CrisisAlertsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredAlerts = crisisAlerts.filter(alert => {
    const matchesSearch = 
      alert.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.message.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || alert.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Crisis Alerts</h1>
        <p className="text-muted-foreground">Monitor and respond to patient crisis situations</p>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search alerts..."
              className="pl-8 w-[300px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="assigned">Assigned</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Severity</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAlerts.map((alert) => (
              <TableRow key={alert.id}>
                <TableCell>
                  <Badge variant={
                    alert.severity === 'high' ? 'destructive' :
                    alert.severity === 'medium' ? 'secondary' : 'secondary'
                  }>
                    {alert.severity.toUpperCase()}
                  </Badge>
                </TableCell>
                <TableCell>{alert.user}</TableCell>
                <TableCell>{alert.message}</TableCell>
                <TableCell>
                  <Badge variant={
                    alert.status === 'active' ? 'destructive' :
                    alert.status === 'assigned' ? 'secondary' : 'outline'
                  }>
                    {alert.status}
                  </Badge>
                </TableCell>
                <TableCell>{alert.timestamp}</TableCell>
                <TableCell>{alert.assignedTo || 'Unassigned'}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="icon">
                      <PhoneCall className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon">
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}