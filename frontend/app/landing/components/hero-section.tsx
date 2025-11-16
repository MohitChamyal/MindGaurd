"use client";

import React, { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Brain, MessageSquare, BarChart3, Calendar, ArrowRight } from "lucide-react";
import Image from "next/image";

export function HeroSection() {
  const blobRef1 = useRef<HTMLDivElement>(null);
  const blobRef2 = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!blobRef1.current || !blobRef2.current) return;
      
      const { clientX, clientY } = e;
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      
      const moveX1 = (clientX - centerX) / 50;
      const moveY1 = (clientY - centerY) / 50;
      
      const moveX2 = (clientX - centerX) / 70;
      const moveY2 = (clientY - centerY) / 70;
      
      blobRef1.current.style.transform = `translate(${moveX1}px, ${moveY1}px)`;
      blobRef2.current.style.transform = `translate(${moveX2}px, ${moveY2}px)`;
    };
    
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);
  
  return (
    <section className="relative pt-32 pb-20 overflow-hidden hero-gradient">
      {/* Decorative blobs */}
      <div 
        ref={blobRef1}
        className="blob w-[500px] h-[500px] bg-primary/20 top-[-100px] right-[-200px]"
      />
      <div 
        ref={blobRef2}
        className="blob w-[400px] h-[400px] bg-accent/20 bottom-[-100px] left-[-150px]"
      />
      
      <div className="container px-4 md:px-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_500px] lg:gap-12 xl:grid-cols-[1fr_550px]">
          <div className="flex flex-col justify-center space-y-4">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none font-poppins">
                AI-Powered Mental Health Support:
                <span className="block gradient-text mt-2">
                  Accessible, Affordable, and Stigma-Free
                </span>
              </h1>
              <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                MindGuard provides 24/7 emotional support, mental health tracking, and guided therapy sessions for stress, anxiety, depression, and burnout.
              </p>
            </div>
            <div className="flex flex-col gap-2 min-[400px]:flex-row">
              <Button size="xl" variant="gradient" className="shadow-lg" asChild>
                <Link href="/signup">
                  Get Started <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="xl" variant="outline" asChild>
                <Link href="/#how-it-works">Learn More</Link>
              </Button>
            </div>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-1">
                <Brain className="h-4 w-4 text-primary" />
                <span>AI-Powered</span>
              </div>
              <div className="flex items-center space-x-1">
                <MessageSquare className="h-4 w-4 text-primary" />
                <span>24/7 Support</span>
              </div>
              <div className="flex items-center space-x-1">
                <BarChart3 className="h-4 w-4 text-primary" />
                <span>Personalized</span>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center hidden md:flex">
            <div className="relative w-full max-w-[500px] aspect-square">
              {/* Main illustration */}
              <div className="absolute inset-0 flex items-center justify-center">
                <Image 
                  src="https://images.unsplash.com/photo-1593697972672-b1c1902219e4?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" 
                  alt="Person using MindGuard app" 
                  width={500} 
                  height={500}
                  className="rounded-2xl shadow-xl object-cover"
                />
              </div>
              
              {/* Floating UI elements */}
              <div className="absolute top-[-30px] right-[20px] bg-card shadow-lg rounded-lg p-3 floating">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              
              <div className="absolute bottom-[40px] left-[-20px] bg-card shadow-lg rounded-lg p-3 floating floating-delay-1">
                <BarChart3 className="h-6 w-6 text-accent" />
              </div>
              
              <div className="absolute bottom-[-20px] right-[60px] bg-card shadow-lg rounded-lg p-3 floating floating-delay-2">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}