"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Home,
  Users,
  Calendar,
  ClipboardList,
  MessageSquare,
  Settings,
  FileText,
  BarChart2,
  Bell,
  Stethoscope,
  Activity,
  Heart,
} from "lucide-react";

const navItems = [
  {
    name: "Dashboard",
    href: "/therapist",
    icon: Home,
  },
  {
    name: "Patients",
    href: "/therapist/patients",
    icon: Users,
  },
  {
    name: "Doctors",
    href: "/therapist/doctors",
    icon: Stethoscope,
  },
  {
    name: "Appointments",
    href: "/therapist/appointments",
    icon: Calendar,
  },
  {
    name: "Assessments",
    href: "/therapist/assessments",
    icon: ClipboardList,
  },
  {
    name: "Messages",
    href: "/therapist/messages",
    icon: MessageSquare,
  },
  {
    name: "Medical Records",
    href: "/therapist/records",
    icon: FileText,
  },
  {
    name: "Analytics",
    href: "/therapist/analytics",
    icon: BarChart2,
  },
  {
    name: "Notifications",
    href: "/therapist/notifications",
    icon: Bell,
  },
  {
    name: "Settings",
    href: "/therapist/settings",
    icon: Settings,
  },
];

export function SideNav({ isOpen }: { isOpen: boolean }) {
  const pathname = usePathname();

  return (
    <div
      className={cn(
        "border-r bg-background transition-all duration-300",
        "md:block md:relative md:h-auto md:w-64 lg:w-72"
      )}
    >
      <ScrollArea className="h-full py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-xs font-semibold tracking-tight text-muted-foreground">
            MAIN MENU
          </h2>
          <div className="space-y-1">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={pathname === item.href ? "secondary" : "ghost"}
                  size="sm"
                  className="w-full justify-start"
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.name}
                </Button>
              </Link>
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}