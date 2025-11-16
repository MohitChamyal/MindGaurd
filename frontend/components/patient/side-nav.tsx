"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  BarChart3,
  Calendar,
  Users,
  Bot,
  Trophy,
  Music,
  Home,
  Gamepad2,
  History,
  FileText,
  MessageSquare
} from "lucide-react";

const navItems = [
  {
    name: "Dashboard",
    href: "/patient",
    icon: Home,
  },
  {
    name: "Health Tracking",
    href: "/patient/health-tracking",
    icon: BarChart3,
  },
  {
    name: "Report Upload",
    href: "/patient/report-upload",
    icon: FileText,
  },
  {
    name: "History",
    href: "/patient/history",
    icon: History,
  },
  {
    name: "Consultations",
    href: "/patient/consultations",
    icon: Calendar,
  },
  {
    name: "Secure Chat",
    href: "/patient/secure-chat",
    icon: MessageSquare,
  },
  {
    name: "Secure Chat (Test)",
    href: "/patient/secure-chat-test",
    icon: MessageSquare,
  },
  {
    name: "Community",
    href: "/patient/community",
    icon: Users,
  },
  {
    name: "AI Assistant",
    href: "/patient/ai-assistant",
    icon: Bot,
  },
  {
    name: "Wellness Challenges",
    href: "/patient/wellness-challenges",
    icon: Trophy,
  },
  {
    name: "Music Therapy",
    href: "/patient/music-therapy",
    icon: Music,
  },
  {
    name: "Gamification",
    href: "/patient/Gamification",
    icon: Gamepad2,
  },
];

export function SideNav({ isOpen }: { isOpen: boolean }) {
  const pathname = usePathname();

  return (
    <div
      className={cn(
        "border-r bg-background transition-all duration-300",
        "md:h-[calc(100vh-4rem)] md:w-64 lg:w-72"
      )}
    >
      <ScrollArea className="h-[calc(100vh-4rem)] py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-xs font-semibold tracking-tight text-muted-foreground">
            MAIN
          </h2>
          <div className="space-y-1">
            <Link href="/patient">
              <Button 
                variant={pathname === '/patient' ? 'secondary' : 'ghost'} 
                size="sm" 
                className="w-full justify-start"
              >
                <Home className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
            </Link>
          </div>
        </div>
        
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-xs font-semibold tracking-tight text-muted-foreground">
            HEALTH & WELLNESS
          </h2>
          <div className="space-y-1">
            <Link href="/patient/health-tracking">
              <Button 
                variant={pathname === '/patient/health-tracking' ? 'secondary' : 'ghost'} 
                size="sm" 
                className="w-full justify-start"
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                Health Tracking
              </Button>
            </Link>
            <Link href="/patient/report-upload">
              <Button 
                variant={pathname === '/patient/report-upload' ? 'secondary' : 'ghost'} 
                size="sm" 
                className="w-full justify-start"
              >
                <FileText className="mr-2 h-4 w-4" />
                Report Upload
              </Button>
            </Link>
            <Link href="/patient/history">
              <Button 
                variant={pathname === '/patient/history' ? 'secondary' : 'ghost'} 
                size="sm" 
                className="w-full justify-start"
              >
                <History className="mr-2 h-4 w-4" />
                History
              </Button>
            </Link>
            <Link href="/patient/consultations">
              <Button 
                variant={pathname === '/patient/consultations' ? 'secondary' : 'ghost'} 
                size="sm" 
                className="w-full justify-start"
              >
                <Calendar className="mr-2 h-4 w-4" />
                Consultations
              </Button>
            </Link>
            <Link href="/patient/music-therapy">
              <Button 
                variant={pathname === '/patient/music-therapy' ? 'secondary' : 'ghost'} 
                size="sm" 
                className="w-full justify-start"
              >
                <Music className="mr-2 h-4 w-4" />
                Music Therapy
              </Button>
            </Link>
          </div>
        </div>
        
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-xs font-semibold tracking-tight text-muted-foreground">
            SUPPORT & COMMUNITY
          </h2>
          <div className="space-y-1">
            <Link href="/patient/ai-assistant">
              <Button 
                variant={pathname === '/patient/ai-assistant' ? 'secondary' : 'ghost'} 
                size="sm" 
                className="w-full justify-start"
              >
                <Bot className="mr-2 h-4 w-4" />
                AI Assistant
              </Button>
            </Link>
            <Link href="/patient/community">
              <Button 
                variant={pathname === '/patient/community' ? 'secondary' : 'ghost'} 
                size="sm" 
                className="w-full justify-start"
              >
                <Users className="mr-2 h-4 w-4" />
                Community
              </Button>
            </Link>
          </div>
        </div>
        
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-xs font-semibold tracking-tight text-muted-foreground">
            ENGAGEMENT
          </h2>
          <div className="space-y-1">
            <Link href="/patient/wellness-challenges">
              <Button 
                variant={pathname === '/patient/wellness-challenges' ? 'secondary' : 'ghost'} 
                size="sm" 
                className="w-full justify-start"
              >
                <Trophy className="mr-2 h-4 w-4" />
                Wellness Challenges
              </Button>
            </Link>
            <Link href="/patient/Gamification">
              <Button 
                variant={pathname === '/patient/Gamification' ? 'secondary' : 'ghost'} 
                size="sm" 
                className="w-full justify-start"
              >
                <Gamepad2 className="mr-2 h-4 w-4" />
                Gamification
              </Button>
            </Link>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}