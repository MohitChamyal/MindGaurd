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
import { Search, Filter, MoreVertical, RefreshCw, ChevronDown } from "lucide-react"
import { apiUrl } from "@/lib/config"
import { useToast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SlidersHorizontal } from "lucide-react"

interface User {
  id: string
  name: string
  email: string
  role: string
  status: string
  joinedAt: string
  lastActive: string
  avatar: string | null
}

export function UserManagement() {
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState("ALL")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    const storedToken = localStorage.getItem('token') || 
                       localStorage.getItem('mindguard_token') || 
                       sessionStorage.getItem('token')
    if (storedToken) {
      setToken(storedToken)
    }
  }, [])

  const fetchAllUsers = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      
      const allUsers: User[] = []
      
      try {
        const patientsResponse = await fetch(`${apiUrl}/api/debug/patients`, { headers })
        if (patientsResponse.ok) {
          const data = await patientsResponse.json()
          if (data.success && data.patients) {
            const formattedPatients: User[] = data.patients.map((user: any) => ({
              id: user._id,
              name: user.name || user.username || user.email.split('@')[0],
              email: user.email || 'Unknown',
              role: 'PATIENT',
              status: user.active !== false ? 'ACTIVE' : 'INACTIVE',
              joinedAt: user.createdAt || new Date().toISOString(),
              lastActive: user.lastActive || user.updatedAt || user.createdAt || new Date().toISOString(),
              avatar: user.profileImage || user.avatarUrl || null
            }))
            allUsers.push(...formattedPatients)
          }
        }
      } catch (error) {
        console.error("Error fetching patients:", error)
      }
      
      try {
        const doctorsResponse = await fetch(`${apiUrl}/api/debug/doctors`, { headers })
        if (doctorsResponse.ok) {
          const data = await doctorsResponse.json()
          if (data.success && data.doctors) {
            const formattedDoctors: User[] = data.doctors.map((doctor: any) => ({
              id: doctor._id,
              name: doctor.fullName || doctor.username || doctor.email.split('@')[0],
              email: doctor.email || 'Unknown',
              role: 'THERAPIST',
              status: doctor.verified ? 'ACTIVE' : doctor.status === 'suspended' ? 'INACTIVE' : 'PENDING',
              joinedAt: doctor.createdAt || new Date().toISOString(),
              lastActive: doctor.lastActive || doctor.updatedAt || doctor.createdAt || new Date().toISOString(),
              avatar: doctor.profileImage || doctor.avatarUrl || null
            }))
            allUsers.push(...formattedDoctors)
          }
        }
      } catch (error) {
        console.error("Error fetching doctors:", error)
      }
      
      try {
        const adminsResponse = await fetch(`${apiUrl}/api/debug/admins`, { headers })
        if (adminsResponse.ok) {
          const data = await adminsResponse.json()
          if (data.success && data.admins) {
            const formattedAdmins: User[] = data.admins.map((admin: any) => ({
              id: admin._id,
              name: admin.fullName || admin.username || admin.email.split('@')[0],
              email: admin.email || 'Unknown',
              role: 'ADMIN',
              status: admin.active !== false ? 'ACTIVE' : 'INACTIVE',
              joinedAt: admin.createdAt || new Date().toISOString(),
              lastActive: admin.lastActive || admin.updatedAt || admin.createdAt || new Date().toISOString(),
              avatar: admin.profileImage || admin.avatarUrl || null
            }))
            allUsers.push(...formattedAdmins)
          }
        }
      } catch (error) {
        console.error("Error fetching admins:", error)
      }
      
      if (allUsers.length === 0) {
        try {
          const testUsersResponse = await fetch(`${apiUrl}/api/test/users`, { headers })
          if (testUsersResponse.ok) {
            const data = await testUsersResponse.json()
            if (Array.isArray(data)) {
              const formattedTestUsers: User[] = data.map((user: any) => ({
                id: user._id || user.id || `test-${Math.random().toString(36).substring(7)}`,
                name: user.name || user.username || user.email?.split('@')[0] || 'Unknown User',
                email: user.email || 'unknown@example.com',
                role: user.role || (user.isAdmin ? 'ADMIN' : 'PATIENT'),
                status: user.status || 'ACTIVE',
                joinedAt: user.createdAt || user.joinedAt || new Date().toISOString(),
                lastActive: user.lastActive || user.updatedAt || new Date().toISOString(),
                avatar: user.profileImage || user.avatar || null
              }))
              allUsers.push(...formattedTestUsers)
            }
          }
        } catch (error) {
          console.error("Error fetching test users:", error)
        }
      }
      
      const sortedUsers = allUsers.sort((a, b) => 
        new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime()
      )
      
      setUsers(sortedUsers)
      
      if (sortedUsers.length === 0) {
        setError("No users found")
      }
    } catch (error) {
      console.error("Error fetching users:", error)
      setError(`Failed to fetch users data: ${error instanceof Error ? error.message : 'Unknown error'}`)
      toast({
        title: "Error",
        description: "Failed to fetch users data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [token, toast])

  useEffect(() => {
    fetchAllUsers()
    
    const refreshInterval = setInterval(() => {
      fetchAllUsers()
    }, 60000)
    
    return () => clearInterval(refreshInterval)
  }, [fetchAllUsers])

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesRole = roleFilter === "ALL" || user.role === roleFilter
    const matchesStatus = statusFilter === "ALL" || user.status === statusFilter

    return matchesSearch && matchesRole && matchesStatus
  })

  const formatRelativeTime = (dateString: string): string => {
    try {
      const date = new Date(dateString)
      const now = new Date()
      
      if (isNaN(date.getTime())) {
        return "Unknown"
      }
      
      const secondsAgo = Math.floor((now.getTime() - date.getTime()) / 1000)
      
      if (secondsAgo < 60) return 'Just now'
      if (secondsAgo < 3600) return `${Math.floor(secondsAgo / 60)} minutes ago`
      if (secondsAgo < 86400) return `${Math.floor(secondsAgo / 3600)} hours ago`
      if (secondsAgo < 2592000) return `${Math.floor(secondsAgo / 86400)} days ago`
      
      return date.toLocaleDateString()
    } catch (error) {
      return "Unknown"
    }
  }

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
            <Skeleton className="h-10 w-[140px]" />
            <Skeleton className="h-10 w-[140px]" />
          </div>
        </div>
        
        <div className="rounded-md border">
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b">
                <tr className="border-b transition-colors hover:bg-muted/50">
                  <th className="h-12 px-4 text-left align-middle font-medium">User</th>
                  <th className="h-12 px-4 text-left align-middle font-medium">Role</th>
                  <th className="h-12 px-4 text-left align-middle font-medium">Status</th>
                  <th className="h-12 px-4 text-left align-middle font-medium">Joined</th>
                  <th className="h-12 px-4 text-left align-middle font-medium">Last Active</th>
                  <th className="h-12 px-4 text-left align-middle font-medium w-[50px]"></th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {[1, 2, 3, 4, 5].map(index => (
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
                    <td className="p-4 align-middle"><Skeleton className="h-6 w-20" /></td>
                    <td className="p-4 align-middle"><Skeleton className="h-6 w-20" /></td>
                    <td className="p-4 align-middle"><Skeleton className="h-4 w-24" /></td>
                    <td className="p-4 align-middle"><Skeleton className="h-4 w-24" /></td>
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

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center space-y-3 py-10">
        <p className="text-sm text-destructive">{error}</p>
        <Button variant="outline" size="sm" onClick={fetchAllUsers}>
          <RefreshCw className="h-3 w-3 mr-2" />
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        {/* Responsive Search Bar */}
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Search Section */}
          <div className="flex-1 flex items-center gap-2">
            <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
                className="pl-8 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={fetchAllUsers}
              className="shrink-0"
            >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
                <TableHead className="min-w-[200px]">User</TableHead>
                <TableHead className="min-w-[100px]">Role</TableHead>
                <TableHead className="min-w-[100px]">Status</TableHead>
                <TableHead className="min-w-[120px]">Joined</TableHead>
                <TableHead className="min-w-[120px]">Last Active</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length > 0 ? filteredUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={user.avatar || undefined} />
                      <AvatarFallback>{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={
                    user.role === 'ADMIN' ? 'default' :
                    user.role === 'THERAPIST' ? 'secondary' : 'outline'
                  }>
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={
                    user.status === 'ACTIVE' ? 'success' :
                    user.status === 'PENDING' ? 'warning' : 'secondary'
                  }>
                    {user.status}
                  </Badge>
                </TableCell>
                <TableCell>{new Date(user.joinedAt).toLocaleDateString()}</TableCell>
                <TableCell>{formatRelativeTime(user.lastActive)}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  No users found matching your filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        </div>
      </div>
    </div>
  )
}