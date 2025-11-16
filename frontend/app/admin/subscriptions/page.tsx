'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Filter, MoreHorizontal, Download, CreditCard, DollarSign, TrendingUp, Users, Calendar, FileText, Edit, Eye } from 'lucide-react';
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

const revenueData = [
  { name: 'Jan', revenue: 12500 },
  { name: 'Feb', revenue: 14200 },
  { name: 'Mar', revenue: 16800 },
  { name: 'Apr', revenue: 18900 },
  { name: 'May', revenue: 21500 },
  { name: 'Jun', revenue: 24200 },
  { name: 'Jul', revenue: 27800 },
  { name: 'Aug', revenue: 31500 },
  { name: 'Sep', revenue: 35200 },
];

const subscriptionData = [
  { name: 'Jan', basic: 1850, premium: 950, enterprise: 120 },
  { name: 'Feb', basic: 2100, premium: 1050, enterprise: 135 },
  { name: 'Mar', basic: 2400, premium: 1200, enterprise: 150 },
  { name: 'Apr', basic: 2700, premium: 1350, enterprise: 165 },
  { name: 'May', basic: 3100, premium: 1500, enterprise: 180 },
  { name: 'Jun', basic: 3500, premium: 1650, enterprise: 195 },
  { name: 'Jul', basic: 3900, premium: 1800, enterprise: 210 },
  { name: 'Aug', basic: 4400, premium: 2000, enterprise: 225 },
  { name: 'Sep', basic: 4900, premium: 2200, enterprise: 240 },
];

const subscriptions = [
  {
    id: '1',
    user: {
      name: 'Emma Wilson',
      email: 'emma.w@example.com',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100&auto=format&fit=crop',
    },
    plan: 'Premium',
    status: 'active',
    amount: '$19.99',
    billingCycle: 'Monthly',
    startDate: 'Jan 12, 2023',
    nextBilling: 'Oct 12, 2023',
    paymentMethod: 'Visa •••• 4242',
  },
  {
    id: '2',
    user: {
      name: 'Michael Chen',
      email: 'michael.c@example.com',
      avatar: '',
    },
    plan: 'Basic',
    status: 'active',
    amount: '$9.99',
    billingCycle: 'Monthly',
    startDate: 'Mar 5, 2023',
    nextBilling: 'Oct 5, 2023',
    paymentMethod: 'Mastercard •••• 5555',
  },
  {
    id: '3',
    user: {
      name: 'Sophia Rodriguez',
      email: 'sophia.r@example.com',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=100&auto=format&fit=crop',
    },
    plan: 'Premium',
    status: 'active',
    amount: '$199.99',
    billingCycle: 'Yearly',
    startDate: 'Feb 18, 2023',
    nextBilling: 'Feb 18, 2024',
    paymentMethod: 'Visa •••• 9876',
  },
  {
    id: '4',
    user: {
      name: 'James Johnson',
      email: 'james.j@example.com',
      avatar: '',
    },
    plan: 'Basic',
    status: 'canceled',
    amount: '$9.99',
    billingCycle: 'Monthly',
    startDate: 'Apr 22, 2023',
    nextBilling: 'N/A',
    paymentMethod: 'PayPal',
  },
  {
    id: '5',
    user: {
      name: 'Olivia Brown',
      email: 'olivia.b@example.com',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=100&auto=format&fit=crop',
    },
    plan: 'Enterprise',
    status: 'active',
    amount: '$49.99',
    billingCycle: 'Monthly',
    startDate: 'Jan 5, 2023',
    nextBilling: 'Oct 5, 2023',
    paymentMethod: 'American Express •••• 7890',
  },
  {
    id: '6',
    user: {
      name: 'William Davis',
      email: 'william.d@example.com',
      avatar: '',
    },
    plan: 'Basic',
    status: 'past_due',
    amount: '$9.99',
    billingCycle: 'Monthly',
    startDate: 'May 15, 2023',
    nextBilling: 'Oct 15, 2023',
    paymentMethod: 'Visa •••• 6543',
  },
  {
    id: '7',
    user: {
      name: 'Ava Martinez',
      email: 'ava.m@example.com',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=100&auto=format&fit=crop',
    },
    plan: 'Premium',
    status: 'active',
    amount: '$19.99',
    billingCycle: 'Monthly',
    startDate: 'Feb 28, 2023',
    nextBilling: 'Oct 28, 2023',
    paymentMethod: 'Mastercard •••• 3210',
  },
];

const plans = [
  {
    id: '1',
    name: 'Basic',
    price: '$9.99',
    billingOptions: ['Monthly', 'Yearly ($99.99)'],
    features: [
      'AI Chatbot Support',
      'Mood Tracking',
      'Guided Meditation',
      'Basic Resources',
    ],
    activeUsers: 4900,
    growth: '+12%',
  },
  {
    id: '2',
    name: 'Premium',
    price: '$19.99',
    billingOptions: ['Monthly', 'Yearly ($199.99)'],
    features: [
      'Everything in Basic',
      'Unlimited AI Conversations',
      'Therapist Matching',
      'Weekly Check-ins',
      'Personalized Insights',
    ],
    activeUsers: 2200,
    growth: '+18%',
  },
  {
    id: '3',
    name: 'Enterprise',
    price: '$49.99',
    billingOptions: ['Monthly', 'Yearly ($499.99)'],
    features: [
      'Everything in Premium',
      'Priority Therapist Access',
      'Crisis Support 24/7',
      'Family Account (up to 5)',
      'Advanced Analytics',
      'Custom Wellness Plan',
    ],
    activeUsers: 240,
    growth: '+15%',
  },
];

export default function SubscriptionsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubscription, setSelectedSubscription] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const filteredSubscriptions = subscriptions.filter(subscription => 
    subscription.user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    subscription.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subscription.plan.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeSubscriptions = filteredSubscriptions.filter(sub => sub.status === 'active');
  const canceledSubscriptions = filteredSubscriptions.filter(sub => sub.status === 'canceled');
  const pastDueSubscriptions = filteredSubscriptions.filter(sub => sub.status === 'past_due');

  const handleViewSubscription = (subscription: any) => {
    setSelectedSubscription(subscription);
    setIsDialogOpen(true);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Subscription Management</h1>
        <Button>
          <CreditCard className="mr-2 h-4 w-4" />
          New Subscription
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$35,200</div>
            <p className="text-xs text-muted-foreground">
              +11.5% from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7,340</div>
            <p className="text-xs text-muted-foreground">
              +342 from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Subscription Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$18.45</div>
            <p className="text-xs text-muted-foreground">
              +$1.20 from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Renewal Rate</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">92.4%</div>
            <p className="text-xs text-muted-foreground">
              +2.1% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
            <CardDescription>
              Monthly subscription revenue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
                <Bar dataKey="revenue" fill="hsl(var(--chart-1))" name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Subscription Growth</CardTitle>
            <CardDescription>
              Users by plan type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={subscriptionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="basic" stroke="hsl(var(--chart-1))" name="Basic" />
                <Line type="monotone" dataKey="premium" stroke="hsl(var(--chart-2))" name="Premium" />
                <Line type="monotone" dataKey="enterprise" stroke="hsl(var(--chart-3))" name="Enterprise" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="all">All Subscriptions</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="past_due">Past Due</TabsTrigger>
            <TabsTrigger value="canceled">Canceled</TabsTrigger>
            <TabsTrigger value="plans">Subscription Plans</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search subscriptions..."
                className="w-[250px] pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Billing Cycle</TableHead>
                    <TableHead>Next Billing</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubscriptions.map((subscription) => (
                    <TableRow key={subscription.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={subscription.user.avatar} alt={subscription.user.name} />
                            <AvatarFallback>{subscription.user.name.charAt(0)}{subscription.user.name.split(' ')[1]?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-medium">{subscription.user.name}</span>
                            <span className="text-xs text-muted-foreground">{subscription.user.email}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{subscription.plan}</TableCell>
                      <TableCell>
                        <Badge variant={
                          subscription.status === 'active' ? 'default' : 
                          subscription.status === 'canceled' ? 'secondary' : 
                          'destructive'
                        }>
                          {subscription.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{subscription.amount}</TableCell>
                      <TableCell>{subscription.billingCycle}</TableCell>
                      <TableCell>{subscription.nextBilling}</TableCell>
                      <TableCell>{subscription.paymentMethod}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleViewSubscription(subscription)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Subscription
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <FileText className="mr-2 h-4 w-4" />
                              Generate Invoice
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {subscription.status === 'active' && (
                              <DropdownMenuItem className="text-destructive">
                                Cancel Subscription
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="active" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Subscriptions</CardTitle>
              <CardDescription>
                Currently active subscription plans
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Showing active subscriptions only. Filter applied.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="past_due" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Past Due Subscriptions</CardTitle>
              <CardDescription>
                Subscriptions with payment issues
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Showing past due subscriptions only. Filter applied.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="canceled" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Canceled Subscriptions</CardTitle>
              <CardDescription>
                Previously active subscriptions that have been canceled
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Showing canceled subscriptions only. Filter applied.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="plans" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {plans.map((plan) => (
              <Card key={plan.id}>
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>
                    <span className="text-xl font-bold">{plan.price}</span> / month
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Features</h4>
                    <ul className="space-y-1">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="text-sm flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-2">Billing Options</h4>
                    <div className="flex flex-wrap gap-2">
                      {plan.billingOptions.map((option, index) => (
                        <Badge key={index} variant="outline">
                          {option}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Active Users</span>
                      <span className="text-sm">{plan.activeUsers}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Growth</span>
                      <span className="text-sm text-green-500">{plan.growth}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {selectedSubscription && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Subscription Details</DialogTitle>
              <DialogDescription>
                {selectedSubscription.user.name} - {selectedSubscription.user.email}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-1">Plan</h4>
                  <p className="text-sm">{selectedSubscription.plan}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">Status</h4>
                  <Badge variant={
                    selectedSubscription.status === 'active' ? 'default' : 
                    selectedSubscription.status === 'canceled' ? 'secondary' : 
                    'destructive'
                  }>
                    {selectedSubscription.status}
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-1">Amount</h4>
                  <p className="text-sm">{selectedSubscription.amount}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">Billing Cycle</h4>
                  <p className="text-sm">{selectedSubscription.billingCycle}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-1">Start Date</h4>
                  <p className="text-sm">{selectedSubscription.startDate}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">Next Billing</h4>
                  <p className="text-sm">{selectedSubscription.nextBilling}</p>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-1">Payment Method</h4>
                <p className="text-sm">{selectedSubscription.paymentMethod}</p>
              </div>
              
              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium mb-2">Actions</h4>
                <div className="flex flex-col space-y-2">
                  <Button variant="outline" className="w-full">
                    <FileText className="mr-2 h-4 w-4" />
                    Generate Invoice
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Subscription
                  </Button>
                  {selectedSubscription.status === 'active' && (
                    <Button variant="destructive" className="w-full">
                      Cancel Subscription
                    </Button>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function CheckCircle(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}