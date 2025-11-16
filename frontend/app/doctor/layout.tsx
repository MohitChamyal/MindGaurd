"use client";

import { useState, useEffect } from "react";
import { Header } from "./dashboard/header";
import { Sidebar } from "./dashboard/sidebar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DoctorAuthMiddleware } from "@/components/auth/doctor-auth-middleware";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState({
    name: "Doctor",
    email: "doctor@mindguard.com",
  });
  
  useEffect(() => {
    // Get username from localStorage
    const storedUsername = localStorage.getItem("username");
    const storedEmail = localStorage.getItem("email");
    
    // Get doctor data
    const doctorData = localStorage.getItem("doctor");
    let doctorName = "";
    
    if (doctorData) {
      try {
        const parsedDoctor = JSON.parse(doctorData);
        doctorName = parsedDoctor.name || parsedDoctor.fullName || "";
      } catch (error) {
        console.error("Error parsing doctor data:", error);
      }
    }
    
    // Use the doctor name from doctor object first, then fall back to username
    setUser({
      name: doctorName || storedUsername || "Doctor",
      email: storedEmail || "doctor@mindguard.com",
    });
  }, []);

  return (
    <DoctorAuthMiddleware>
      <div className="flex min-h-screen">
        {/* Mobile Sidebar */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="fixed top-4 left-4 z-50 md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] p-0">
            <Sidebar className="h-full" />
          </SheetContent>
        </Sheet>

        {/* Desktop Sidebar */}
        <Sidebar className="hidden md:flex md:w-64 md:flex-col" />

        <div className="flex flex-col flex-1">
          <Header user={user} />
          <main className="flex-1 p-4 md:p-6 dark:bg-gray-900">{children}</main>
        </div>
      </div>
    </DoctorAuthMiddleware>
  );
}