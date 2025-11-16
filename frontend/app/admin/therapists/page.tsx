'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Filter, MoreHorizontal, UserPlus, Download, Trash2, Edit, Eye, Ban, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { apiUrl } from '@/lib/config';

interface Doctor {
  _id: string;
  username: string;
  email: string;
  specialty?: string;
  patients?: number;
  status: string;
  createdAt: string;
  lastActive?: string;
  avatarUrl?: string;
  hospital?: string;
  licenseNumber?: string;
  address?: string;
}

export default function TherapistsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [doctorToDelete, setDoctorToDelete] = useState<Doctor | null>(null);
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [doctorToSuspend, setDoctorToSuspend] = useState<Doctor | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token') || 
                    localStorage.getItem('mindguard_token') ||
                    sessionStorage.getItem('token');
      
      // For debugging
      console.log('Available token:', token ? 'Token found' : 'No token found');
      
      // Common headers with token if available
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        headers['x-auth-token'] = token;
      }
      
      let doctorsData: any[] = [];
      
      try {
        // Direct API endpoint to fetch real doctors from MongoDB with full URL matching the patient implementation
        const response = await fetch(`${apiUrl}/api/test/doctors`, { headers });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch doctors: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (Array.isArray(data)) {
          doctorsData = data;
        } else {
          doctorsData = [data];
        }
        
        console.log(`Found ${doctorsData.length} doctors from database`);
      } catch (err) {
        console.error('Error fetching doctors:', err);
        setError('Error loading doctors. Please check the API endpoint or database connection.');
        setLoading(false);
        return;
      }
      
      if (doctorsData.length === 0) {
        setError('No doctors found in the database.');
        setLoading(false);
        return;
      }
      
      const transformedDoctors: Doctor[] = doctorsData.map((doctor: any) => {
        const createdDate = doctor.createdAt && doctor.createdAt.$date 
          ? doctor.createdAt.$date 
          : doctor.createdAt || new Date().toISOString();
        
        return {
          _id: doctor._id && doctor._id.$oid ? doctor._id.$oid : doctor._id || '',
          username: doctor.fullname || doctor.email || '',
          email: doctor.email || '',
          specialty: doctor.specialization || '',
          patients: doctor.patientExperience || 0,
          status: doctor.verified === true ? 'active' : 'pending',
          createdAt: createdDate,
          lastActive: doctor.lastActive || 'Unknown',
          avatarUrl: doctor.avatarUrl || null,
          hospital: doctor.hospital || '',
          licenseNumber: doctor.licenseNumber || '',
          address: doctor.address ? 
            `${doctor.address.street || ''}, ${doctor.address.city || ''}, ${doctor.address.country || ''}` 
            : ''
        };
      });
      
      console.log('Transformed doctors:', transformedDoctors);
      setDoctors(transformedDoctors);
      setError(null);
    } catch (err: any) {
      console.error('Error processing doctors data:', err);
      setError(err.message || 'Failed to process doctors data');
      toast({
        title: "Error",
        description: err.message || 'Failed to fetch doctors',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const suspendDoctor = async () => {
    if (!doctorToSuspend) return;
    
    try {
      const token = localStorage.getItem('token') || 
                    localStorage.getItem('mindguard_token') ||
                    sessionStorage.getItem('token');
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        headers['x-auth-token'] = token;
      }
      
      const response = await fetch(`/api/user/suspend/${doctorToSuspend._id}`, {
        method: 'PUT',
        headers
      });
      
      if (!response.ok) {
        throw new Error('Failed to suspend therapist');
      }
      
      setDoctors(doctors.map(doctor => 
        doctor._id === doctorToSuspend._id ? {...doctor, status: 'suspended'} : doctor
      ));
      
      toast({
        title: "Success",
        description: `${doctorToSuspend.username} has been suspended`,
      });
    } catch (err: any) {
      console.error('Error suspending therapist:', err);
      toast({
        title: "Error",
        description: err.message || 'Failed to suspend therapist',
        variant: "destructive"
      });
    } finally {
      setShowSuspendDialog(false);
      setDoctorToSuspend(null);
    }
  };

  const deleteDoctor = async () => {
    if (!doctorToDelete) return;
    
    try {
      const token = localStorage.getItem('token') || 
                    localStorage.getItem('mindguard_token') ||
                    sessionStorage.getItem('token');
      
      const headers: HeadersInit = {};
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        headers['x-auth-token'] = token;
      }
      
      const response = await fetch(`/api/user/delete/${doctorToDelete._id}`, {
        method: 'DELETE',
        headers
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete therapist');
      }
      
      setDoctors(doctors.filter(doctor => doctor._id !== doctorToDelete._id));
      
      toast({
        title: "Success",
        description: `${doctorToDelete.username} has been deleted`,
      });
    } catch (err: any) {
      console.error('Error deleting therapist:', err);
      toast({
        title: "Error",
        description: err.message || 'Failed to delete therapist',
        variant: "destructive"
      });
    } finally {
      setShowDeleteDialog(false);
      setDoctorToDelete(null);
    }
  };

  const filteredDoctors = doctors.filter(doctor => {
    const matchesSearch = 
      doctor.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
      doctor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doctor.specialty && doctor.specialty.toLowerCase().includes(searchTerm.toLowerCase()));
      
    if (activeTab === 'all') {
      return matchesSearch;
    } else {
      return matchesSearch && doctor.status === activeTab;
    }
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-muted-foreground">Loading therapists...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertCircle className="h-8 w-8 text-destructive mb-2" />
        <p className="text-destructive text-lg font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Therapist Management</h1>
      </div>

      <Tabs 
        defaultValue="all" 
        className="space-y-4"
        onValueChange={setActiveTab}
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <TabsList className='w-full sm:w-auto overflow-x-auto'>
            <TabsTrigger value="all">All Therapists</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="suspended">Suspended</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search therapists..."
                className="w-[250px] pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
        
        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Therapist</TableHead>
                    <TableHead>Specialty</TableHead>
                    <TableHead>Patients</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDoctors.length > 0 ? (
                    filteredDoctors.map((doctor) => (
                      <TableRow key={doctor._id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={doctor.avatarUrl} alt={doctor.username} />
                              <AvatarFallback>{doctor.username.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="font-medium">{doctor.username}</span>
                              <span className="text-xs text-muted-foreground">{doctor.email}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{doctor.specialty || 'General'}</TableCell>
                        <TableCell>{doctor.patients || 0}</TableCell>
                        <TableCell>
                          <Badge variant={
                            doctor.status === 'active' ? 'default' : 
                            doctor.status === 'pending' ? 'secondary' : 
                            'destructive'
                          }>
                            {doctor.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(doctor.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>{doctor.lastActive || 'Unknown'}</TableCell>
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
                              <DropdownMenuItem>
                                <Eye className="mr-2 h-4 w-4" />
                                View Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Therapist
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  setDoctorToSuspend(doctor);
                                  setShowSuspendDialog(true);
                                }}
                                disabled={doctor.status === 'suspended'}
                              >
                                <Ban className="mr-2 h-4 w-4" />
                                Suspend Therapist
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => {
                                  setDoctorToDelete(doctor);
                                  setShowDeleteDialog(true);
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Therapist
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-6">
                        <p className="text-muted-foreground">No therapists found</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="active" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Therapist</TableHead>
                    <TableHead>Specialty</TableHead>
                    <TableHead>Patients</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDoctors.length > 0 ? (
                    filteredDoctors.map((doctor) => (
                      <TableRow key={doctor._id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={doctor.avatarUrl} alt={doctor.username} />
                              <AvatarFallback>{doctor.username.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="font-medium">{doctor.username}</span>
                              <span className="text-xs text-muted-foreground">{doctor.email}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{doctor.specialty || 'General'}</TableCell>
                        <TableCell>{doctor.patients || 0}</TableCell>
                        <TableCell>
                          <Badge variant="default">
                            {doctor.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(doctor.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>{doctor.lastActive || 'Unknown'}</TableCell>
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
                              <DropdownMenuItem>
                                <Eye className="mr-2 h-4 w-4" />
                                View Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Therapist
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  setDoctorToSuspend(doctor);
                                  setShowSuspendDialog(true);
                                }}
                              >
                                <Ban className="mr-2 h-4 w-4" />
                                Suspend Therapist
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => {
                                  setDoctorToDelete(doctor);
                                  setShowDeleteDialog(true);
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Therapist
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-6">
                        <p className="text-muted-foreground">No active therapists found</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Therapist</TableHead>
                    <TableHead>Specialty</TableHead>
                    <TableHead>Patients</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDoctors.length > 0 ? (
                    filteredDoctors.map((doctor) => (
                      <TableRow key={doctor._id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={doctor.avatarUrl} alt={doctor.username} />
                              <AvatarFallback>{doctor.username.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="font-medium">{doctor.username}</span>
                              <span className="text-xs text-muted-foreground">{doctor.email}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{doctor.specialty || 'General'}</TableCell>
                        <TableCell>{doctor.patients || 0}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {doctor.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(doctor.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>{doctor.lastActive || 'Unknown'}</TableCell>
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
                              <DropdownMenuItem>
                                <Eye className="mr-2 h-4 w-4" />
                                View Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Therapist
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  setDoctorToSuspend(doctor);
                                  setShowSuspendDialog(true);
                                }}
                              >
                                <Ban className="mr-2 h-4 w-4" />
                                Suspend Therapist
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => {
                                  setDoctorToDelete(doctor);
                                  setShowDeleteDialog(true);
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Therapist
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-6">
                        <p className="text-muted-foreground">No pending therapists found</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="suspended" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Therapist</TableHead>
                    <TableHead>Specialty</TableHead>
                    <TableHead>Patients</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDoctors.length > 0 ? (
                    filteredDoctors.map((doctor) => (
                      <TableRow key={doctor._id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={doctor.avatarUrl} alt={doctor.username} />
                              <AvatarFallback>{doctor.username.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="font-medium">{doctor.username}</span>
                              <span className="text-xs text-muted-foreground">{doctor.email}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{doctor.specialty || 'General'}</TableCell>
                        <TableCell>{doctor.patients || 0}</TableCell>
                        <TableCell>
                          <Badge variant="destructive">
                            {doctor.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(doctor.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>{doctor.lastActive || 'Unknown'}</TableCell>
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
                              <DropdownMenuItem>
                                <Eye className="mr-2 h-4 w-4" />
                                View Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Therapist
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => {
                                  setDoctorToDelete(doctor);
                                  setShowDeleteDialog(true);
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Therapist
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-6">
                        <p className="text-muted-foreground">No suspended therapists found</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Suspend Therapist Dialog */}
      <Dialog open={showSuspendDialog} onOpenChange={setShowSuspendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend Therapist</DialogTitle>
            <DialogDescription>
              Are you sure you want to suspend this therapist? They will no longer be able to access the platform.
            </DialogDescription>
          </DialogHeader>
          {doctorToSuspend && (
            <div className="flex items-center gap-3 py-3">
              <Avatar>
                <AvatarImage src={doctorToSuspend.avatarUrl} alt={doctorToSuspend.username} />
                <AvatarFallback>{doctorToSuspend.username.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="font-medium">{doctorToSuspend.username}</span>
                <span className="text-xs text-muted-foreground">{doctorToSuspend.email}</span>
                {doctorToSuspend.specialty && (
                  <span className="text-xs text-muted-foreground">{doctorToSuspend.specialty}</span>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSuspendDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={suspendDoctor}>
              Suspend Therapist
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Therapist Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Therapist</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this therapist? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {doctorToDelete && (
            <div className="flex items-center gap-3 py-3">
              <Avatar>
                <AvatarImage src={doctorToDelete.avatarUrl} alt={doctorToDelete.username} />
                <AvatarFallback>{doctorToDelete.username.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="font-medium">{doctorToDelete.username}</span>
                <span className="text-xs text-muted-foreground">{doctorToDelete.email}</span>
                {doctorToDelete.specialty && (
                  <span className="text-xs text-muted-foreground">{doctorToDelete.specialty}</span>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={deleteDoctor}>
              Delete Therapist
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}