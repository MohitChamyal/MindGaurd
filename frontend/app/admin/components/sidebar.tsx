'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  LayoutDashboard, 
  Users, 
  Brain, 
  MessageSquare, 
  Shield, 
  CreditCard, 
  BarChart2, 
  AlertTriangle, 
  Award, 
  FileText, 
  Menu, 
  X,
  MessageCircle
} from 'lucide-react';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  pathname: string;
}

export default function Sidebar({ sidebarOpen, setSidebarOpen, pathname }: SidebarProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between px-4 border-b">
        <Link href="/" className="flex items-center space-x-2">
          <Image 
            src="/mindguard_logo.png" 
            alt="MindGuard Logo" 
            width={32} 
            height={32} 
            className="h-6 sm:h-8 w-auto"
          />
          <span className="font-bold text-lg sm:text-xl">MindGuard</span>
        </Link>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setSidebarOpen(false)}
          className="md:hidden"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
      
      <ScrollArea className="flex-1 px-3 py-2">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-xs font-semibold tracking-tight text-muted-foreground">
            MAIN
          </h2>
          <div className="space-y-1">
            <Link href="/admin">
              <Button 
                variant={pathname === '/admin' ? 'secondary' : 'ghost'} 
                size="sm" 
                className="w-full justify-start"
              >
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
            </Link>
          </div>
        </div>
        
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-xs font-semibold tracking-tight text-muted-foreground">
            USER MANAGEMENT
          </h2>
          <div className="space-y-1">
            <Link href="/admin/users">
              <Button 
                variant={pathname === '/admin/users' ? 'secondary' : 'ghost'} 
                size="sm" 
                className="w-full justify-start"
              >
                <Users className="mr-2 h-4 w-4" />
                Users
              </Button>
            </Link>
            <Link href="/admin/therapists">
              <Button 
                variant={pathname === '/admin/therapists' ? 'secondary' : 'ghost'} 
                size="sm" 
                className="w-full justify-start"
              >
                <Brain className="mr-2 h-4 w-4" />
                Therapists
              </Button>
            </Link>
          </div>
        </div>
        
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-xs font-semibold tracking-tight text-muted-foreground">
            PLATFORM
          </h2>
          <div className="space-y-1">
            {/* <Link href="/admin/messages">
              <Button 
                variant={pathname === '/admin/messages' ? 'secondary' : 'ghost'} 
                size="sm" 
                className="w-full justify-start"
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Messages
              </Button>
            </Link> */}
            <Link href="/admin/ai-analytics">
              <Button 
                variant={pathname === '/admin/ai-analytics' ? 'secondary' : 'ghost'} 
                size="sm" 
                className="w-full justify-start"
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                AI Analytics
              </Button>
            </Link>
            {/* <Link href="/admin/content-moderation">
              <Button 
                variant={pathname === '/admin/content-moderation' ? 'secondary' : 'ghost'} 
                size="sm" 
                className="w-full justify-start"
              >
                <Shield className="mr-2 h-4 w-4" />
                Content Moderation
              </Button>
            </Link> */}
            <Link href="/admin/subscriptions">
              <Button 
                variant={pathname === '/admin/subscriptions' ? 'secondary' : 'ghost'} 
                size="sm" 
                className="w-full justify-start"
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Subscriptions
              </Button>
            </Link>
            <Link href="/admin/reports">
              <Button 
                variant={pathname === '/admin/reports' ? 'secondary' : 'ghost'} 
                size="sm" 
                className="w-full justify-start"
              >
                <BarChart2 className="mr-2 h-4 w-4" />
                Reports & Insights
              </Button>
            </Link>
          </div>
        </div>
        
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-xs font-semibold tracking-tight text-muted-foreground">
            SAFETY & ENGAGEMENT
          </h2>
          <div className="space-y-1">
            <Link href="/admin/crisis-alerts">
              <Button 
                variant={pathname === '/admin/crisis-alerts' ? 'secondary' : 'ghost'} 
                size="sm" 
                className="w-full justify-start"
              >
                <AlertTriangle className="mr-2 h-4 w-4" />
                Crisis Alerts
              </Button>
            </Link>
            <Link href="/admin/gamification">
              <Button 
                variant={pathname === '/admin/gamification' ? 'secondary' : 'ghost'} 
                size="sm" 
                className="w-full justify-start"
              >
                <Award className="mr-2 h-4 w-4" />
                Gamification
              </Button>
            </Link>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}