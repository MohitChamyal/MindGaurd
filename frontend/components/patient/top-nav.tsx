"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, Menu, Moon, Sun, X } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { SideNav } from "@/components/patient/side-nav";
import { useTheme } from "next-themes";

interface UserData {
  name: string;
  email: string;
}

export function TopNav() {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Retrieve stored user data from localStorage
    const storedUserData = localStorage.getItem("userData");
    if (storedUserData) {
      try {
        setUserData(JSON.parse(storedUserData));
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }
    
    // Get username directly from localStorage
    const storedUsername = localStorage.getItem("username");
    if (storedUsername) {
      setUsername(storedUsername);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("userData");
    localStorage.removeItem("token");
    localStorage.removeItem("userType");
    localStorage.removeItem("mindguard_token");
    localStorage.removeItem("mindguard_user_id");
    localStorage.removeItem("mindguard_user_type");
    localStorage.removeItem("username");
    localStorage.removeItem("email");
    
    // Redirect to landing page instead of login
    router.push("/");
  };

  const handleThemeToggle = () => {
    // Simple toggle between light and dark only
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b bg-background px-4 md:px-6">
      <div className="flex items-center gap-2">
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 [&>button]:hidden">
            <div className="flex h-16 items-center justify-between px-4 border-b">
              <Link href="/" className="flex items-center space-x-2">
                <Image 
                  src="/mindguard_logo.png" 
                  alt="MindGuard Logo" 
                  width={32} 
                  height={32} 
                  className="h-auto w-6 sm:w-8"
                />
                <span className="font-bold text-xl sm:text-2xl">MindGuard</span>
              </Link>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="px-2 py-6">
              <SideNav isOpen={true} />
            </div>
          </SheetContent>
        </Sheet>
        <Link href="/" className="flex items-center gap-1 font-semibold">
          <Image 
            src="/mindguard_logo.png" 
            alt="MindGuard Logo" 
            width={32} 
            height={32} 
            className="h-auto w-6 sm:w-8"
          />
          <span className="text-xl sm:text-2xl hidden sm:inline">MindGuard</span>
        </Link>
      </div>
      
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="icon"
          onClick={handleThemeToggle}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          <Sun 
            className={`h-[1.2rem] w-[1.2rem] transition-all ${
              theme === 'light' ? 'rotate-0 scale-100' : 'rotate-90 scale-0'
            }`} 
          />
          <Moon 
            className={`absolute h-[1.2rem] w-[1.2rem] transition-all ${
              theme === 'dark' ? 'rotate-0 scale-100' : 'rotate-90 scale-0'
            }`}
          />
          <span className="sr-only">
            {theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          </span>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="h-9 w-9 border border-border">
                <AvatarFallback 
                  className="text-primary-foreground font-semibold"
                  style={{ 
                    backgroundColor: "hsl(162, 78%, 45%)" 
                  }}
                >
                  {userData?.name ? userData.name.charAt(0).toUpperCase() : (username ? username.charAt(0).toUpperCase() : "JD")}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Subscription</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
