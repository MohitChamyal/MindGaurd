"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MessageSquare, Menu } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface NavItem {
  title: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface PatientDashboardNavProps extends React.HTMLAttributes<HTMLElement> {
  items?: NavItem[];
}

export function PatientDashboardNav({
  className,
  items,
  ...props
}: PatientDashboardNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  
  const defaultItems = [
    {
      title: "Dashboard",
      href: "/patient",
    },
    {
      title: "Health Tracking",
      href: "/patient/health-tracking",
    },
    {
      title: "Consultations",
      href: "/patient/consultations",
    },
    {
      title: "Secure Chat",
      href: "/patient/secure-chat",
      icon: MessageSquare,
    },
    {
      title: "Secure Chat (Test)",
      href: "/patient/secure-chat-test",
      icon: MessageSquare,
    },
  ];

  const navItems = items || defaultItems;
  
  const handleNavChange = (value: string) => {
    router.push(value);
  };

  return (
    <>
      {/* Mobile Dropdown Navigation */}
      <div className={cn("block md:hidden w-full", className)} {...props}>
        <Select
          value={pathname}
          onValueChange={handleNavChange}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Navigate to" />
          </SelectTrigger>
          <SelectContent>
            {navItems.map((item) => (
              <SelectItem key={item.href} value={item.href}>
                <span className="flex items-center">
                  {item.icon && <item.icon className="mr-2 h-4 w-4" />}
                  {item.title}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Desktop Navigation */}
      <nav
        className={cn("hidden md:flex items-center space-x-4 lg:space-x-6", className)}
        {...props}
      >
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center text-sm font-medium transition-colors hover:text-primary",
              pathname === item.href
                ? "text-primary"
                : "text-muted-foreground"
            )}
          >
            {item.icon && (
              <item.icon className="mr-2 h-4 w-4" />
            )}
            {item.title}
          </Link>
        ))}
      </nav>
    </>
  );
} 