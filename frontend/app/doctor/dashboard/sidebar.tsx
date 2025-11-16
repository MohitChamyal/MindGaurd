"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import Image from "next/image";
import {
  Activity,
  Calendar,
  Home,
  MapPin,
  MessageSquare,
  Pill,
  Users,
  HelpCircle,
  LogOut,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { handleLogout } from "@/utils/auth";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const routes = [
    {
      label: "Dashboard",
      icon: Home,
      href: "/doctor",
      active: pathname === "/doctor",
    },
    {
      label: "Patients",
      icon: Users,
      href: "/doctor/patients",
      active: pathname === "/doctor/patients",
    },
    {
      label: "Prescriptions",
      icon: Pill,
      href: "/doctor/prescriptions",
      active: pathname === "/doctor/prescriptions",
    },
    {
      label: "Analytics",
      icon: Activity,
      href: "/doctor/analytics",
      active: pathname === "/doctor/analytics",
    },
    {
      label: "Messages",
      icon: MessageSquare,
      href: "/doctor/messages",
      active: pathname === "/doctor/messages",
    },
    {
      label: "Patient Map",
      icon: MapPin,
      href: "/doctor/patient-map",
      active: pathname === "/doctor/patient-map",
    },
  ];

  return (
    <div className={cn("flex flex-col h-full bg-background border-r", className)}>
      <div className="space-y-4 py-4 flex flex-col h-full">
        <div className="px-3 py-2 flex items-center justify-between border-b">
          <Link href="/" className="flex items-center gap-2">
            <Image 
              src="/mindguard_logo.png" 
              alt="MindGuard Logo" 
              width={32} 
              height={32} 
              className="h-6 sm:h-8 w-auto"
            />
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight hidden sm:inline">MindGuard</h2>
          </Link>
        </div>
        <ScrollArea className="flex-1 px-3">
          <div className="space-y-4">
            {/* MAIN */}
            <div className="space-y-1">
              <h2 className="mb-2 px-4 text-xs font-semibold tracking-tight text-muted-foreground">
                MAIN
              </h2>
              <Button
                variant={pathname === "/doctor" ? "secondary" : "ghost"}
                size="sm"
                className={cn("w-full justify-start transition-colors", {
                  "bg-secondary hover:bg-secondary/80": pathname === "/doctor",
                  "hover:bg-accent": pathname !== "/doctor",
                })}
                asChild
              >
                <Link href="/doctor">
                  <Home className="mr-2 h-4 w-4" />
                  Dashboard
                </Link>
              </Button>
            </div>

            {/* PATIENT MANAGEMENT */}
            <div className="space-y-1">
              <h2 className="mb-2 px-4 text-xs font-semibold tracking-tight text-muted-foreground">
                PATIENT MANAGEMENT
              </h2>
              <Button
                variant={pathname === "/doctor/patients" ? "secondary" : "ghost"}
                size="sm"
                className={cn("w-full justify-start transition-colors", {
                  "bg-secondary hover:bg-secondary/80": pathname === "/doctor/patients",
                  "hover:bg-accent": pathname !== "/doctor/patients",
                })}
                asChild
              >
                <Link href="/doctor/patients">
                  <Users className="mr-2 h-4 w-4" />
                  Patients
                </Link>
              </Button>
              <Button
                variant={pathname === "/doctor/prescriptions" ? "secondary" : "ghost"}
                size="sm"
                className={cn("w-full justify-start transition-colors", {
                  "bg-secondary hover:bg-secondary/80": pathname === "/doctor/prescriptions",
                  "hover:bg-accent": pathname !== "/doctor/prescriptions",
                })}
                asChild
              >
                <Link href="/doctor/prescriptions">
                  <Pill className="mr-2 h-4 w-4" />
                  Prescriptions
                </Link>
              </Button>
            </div>

            {/* ANALYTICS & TRACKING */}
            <div className="space-y-1">
              <h2 className="mb-2 px-4 text-xs font-semibold tracking-tight text-muted-foreground">
                ANALYTICS & TRACKING
              </h2>
              <Button
                variant={pathname === "/doctor/analytics" ? "secondary" : "ghost"}
                size="sm"
                className={cn("w-full justify-start transition-colors", {
                  "bg-secondary hover:bg-secondary/80": pathname === "/doctor/analytics",
                  "hover:bg-accent": pathname !== "/doctor/analytics",
                })}
                asChild
              >
                <Link href="/doctor/analytics">
                  <Activity className="mr-2 h-4 w-4" />
                  Analytics
                </Link>
              </Button>
              <Button
                variant={pathname === "/doctor/patient-map" ? "secondary" : "ghost"}
                size="sm"
                className={cn("w-full justify-start transition-colors", {
                  "bg-secondary hover:bg-secondary/80": pathname === "/doctor/patient-map",
                  "hover:bg-accent": pathname !== "/doctor/patient-map",
                })}
                asChild
              >
                <Link href="/doctor/patient-map">
                  <MapPin className="mr-2 h-4 w-4" />
                  Patient Map
                </Link>
              </Button>
            </div>

            {/* COMMUNICATION */}
            <div className="space-y-1">
              <h2 className="mb-2 px-4 text-xs font-semibold tracking-tight text-muted-foreground">
                COMMUNICATION
              </h2>
              <Button
                variant={pathname === "/doctor/messages" ? "secondary" : "ghost"}
                size="sm"
                className={cn("w-full justify-start transition-colors", {
                  "bg-secondary hover:bg-secondary/80": pathname === "/doctor/messages",
                  "hover:bg-accent": pathname !== "/doctor/messages",
                })}
                asChild
              >
                <Link href="/doctor/messages">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Messages
                </Link>
              </Button>
            </div>

            {/* SYSTEM */}

            <div className="space-y-1">
              <h2 className="mb-2 px-4 text-xs font-semibold tracking-tight text-muted-foreground">
                MISC
              </h2>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start hover:bg-accent"
                onClick={() => handleLogout(router)}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}