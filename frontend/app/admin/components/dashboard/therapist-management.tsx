'use client'

import { useState, useEffect, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, Filter, MoreVertical, Star, RefreshCw } from "lucide-react"
import { apiUrl } from "@/lib/config"
import { useToast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"

interface Therapist {
  id: string
  name: string
  email: string
  specialization: string
  status: string
  rating: number
  patientsCount: number
  sessionsCompleted: number
  joinedAt: string
  lastActive: string
  avatar: string | null
}

export function TherapistManagement() {
  const [searchQuery, setSearchQuery] = useState("")
  const [specializationFilter, setSpecializationFilter] = useState("ALL")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [therapists, setTherapists] = useState<Therapist[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [specializations, setSpecializations] = useState<string[]>([])
  const { toast } = useToast()
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    // Get the token from storage
    const storedToken = localStorage.getItem('token') || 
                       localStorage.getItem('mindguard_token') || 
                       sessionStorage.getItem('token')
    if (storedToken) {
      setToken(storedToken)
    }
  }, [])

  // Fetch therapists data
  const fetchTherapists = useCallback(async () => {
    setLoading(true)
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      
      const response = await fetch(`${apiUrl}/api/debug/doctors`, { headers })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch therapists: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.success && data.doctors) {
        const formattedTherapists: Therapist[] = data.doctors.map((doctor: any) => ({
          id: doctor._id,
          name: doctor.fullName || doctor.username || (doctor.email ? doctor.email.split('@')[0] : 'Unknown'),
          email: doctor.email,
          specialization: doctor.specialization || doctor.specialty || 'General',
          status: doctor.verified ? "VERIFIED" : doctor.status === "suspended" ? "SUSPENDED" : "PENDING",
          rating: doctor.rating || (doctor.verified ? 4.5 : 0),
          patientsCount: doctor.patientCount || 0,
          sessionsCompleted: doctor.sessionsCount || 0,
          joinedAt: doctor.createdAt || new Date().toISOString(),
          lastActive: doctor.lastActive || doctor.updatedAt || doctor.createdAt || new Date().toISOString(),
          avatar: doctor.profileImage || doctor.avatarUrl || null
        }))
        
        // Extract unique specializations
        const uniqueSpecializations = Array.from(
          new Set(formattedTherapists.map(t => t.specialization))
        )
        
        setTherapists(formattedTherapists)
        setSpecializations(uniqueSpecializations)
        setError(null)
      } else {
        setError("No therapist data found")
      }
    } catch (error) {
      console.error("Error fetching therapists:", error)
      setError(`Failed to fetch therapists data: ${error instanceof Error ? error.message : 'Unknown error'}`)
      toast({
        title: "Error",
        description: "Failed to fetch therapists data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [token, toast])

  // Fetch data on initial load
  useEffect(() => {
    fetchTherapists()
    
    // Set up a periodic refresh
    const refreshInterval = setInterval(() => {
      fetchTherapists()
    }, 60000) // Refresh every minute
    
    return () => clearInterval(refreshInterval)
  }, [fetchTherapists])

  // Status badge variant
  const getStatusVariant = (status: string) => {
    return status === 'VERIFIED' ? 'success' :
           status === 'PENDING' ? 'warning' : 'secondary'
  }

  // Filtered therapists 
  const filteredTherapists = therapists.filter(therapist => {
    const matchesSearch = 
      therapist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      therapist.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      therapist.specialization.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesSpecialization = specializationFilter === "ALL" || 
      therapist.specialization === specializationFilter
      
    const matchesStatus = statusFilter === "ALL" || therapist.status === statusFilter

    return matchesSearch && matchesSpecialization && matchesStatus
  })

  // Loading state
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 items-center space-x-2">
            <div className="relative flex-1 max-w-sm">
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-10 w-10" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-[200px]" />
            <Skeleton className="h-10 w-[140px]" />
          </div>
        </div>
        
        <div className="rounded-md border">
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b">
                <tr className="border-b transition-colors hover:bg-muted/50">
                  <th className="h-12 px-4 text-left align-middle font-medium">Therapist</th>
                  <th className="h-12 px-4 text-left align-middle font-medium">Specialization</th>
                  <th className="h-12 px-4 text-left align-middle font-medium">Status</th>
                  <th className="h-12 px-4 text-left align-middle font-medium">Rating</th>
                  <th className="h-12 px-4 text-left align-middle font-medium">Patients</th>
                  <th className="h-12 px-4 text-left align-middle font-medium">Sessions</th>
                  <th className="h-12 px-4 text-left align-middle font-medium w-[50px]"></th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {[1, 2, 3, 4].map(index => (
                  <tr key={index} className="border-b transition-colors hover:bg-muted/50">
                    <td className="p-4 align-middle">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div>
                          <Skeleton className="h-4 w-32 mb-1" />
                          <Skeleton className="h-3 w-40" />
                        </div>
                      </div>
                    </td>
                    <td className="p-4 align-middle"><Skeleton className="h-4 w-32" /></td>
                    <td className="p-4 align-middle"><Skeleton className="h-6 w-20" /></td>
                    <td className="p-4 align-middle"><Skeleton className="h-4 w-12" /></td>
                    <td className="p-4 align-middle"><Skeleton className="h-4 w-8" /></td>
                    <td className="p-4 align-middle"><Skeleton className="h-4 w-8" /></td>
                    <td className="p-4 align-middle"><Skeleton className="h-8 w-8" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center space-y-3 py-10">
        <p className="text-sm text-destructive">{error}</p>
        <Button variant="outline" size="sm" onClick={fetchTherapists}>
          <RefreshCw className="h-3 w-3 mr-2" />
          Retry
        </Button>
      </div>
    )
  }

  // Empty state
  if (therapists.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 space-y-3">
        <p className="text-sm text-muted-foreground">No therapists found</p>
        <Button variant="outline" size="sm" onClick={fetchTherapists}>
          <RefreshCw className="h-3 w-3 mr-2" />
          Refresh
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center space-x-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search therapists..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon" onClick={fetchTherapists}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Select value={specializationFilter} onValueChange={setSpecializationFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Specialization" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Specializations</SelectItem>
              {specializations.map(spec => (
                <SelectItem key={spec} value={spec}>{spec}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="VERIFIED">Verified</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="SUSPENDED">Suspended</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Therapist</TableHead>
              <TableHead>Specialization</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Patients</TableHead>
              <TableHead>Sessions</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTherapists.length > 0 ? filteredTherapists.map((therapist) => (
              <TableRow key={therapist.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={therapist.avatar || undefined} />
                      <AvatarFallback>{therapist.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{therapist.name}</p>
                      <p className="text-sm text-muted-foreground">{therapist.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{therapist.specialization}</span>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(therapist.status)}>
                    {therapist.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-primary text-primary" />
                    <span className="text-sm">{therapist.rating || 'N/A'}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{therapist.patientsCount}</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{therapist.sessionsCompleted}</span>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center">
                  No therapists found matching your filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}