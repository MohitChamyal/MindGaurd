import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export function Footer() {
  return (
    <footer className="bg-muted/50 border-t">
      <div className="container px-4 md:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <Image 
                src="/mindguard_logo.png" 
                alt="MindGuard Logo" 
                width={32} 
                height={32} 
                className="h-auto w-6 sm:w-8"
              />
              <span className="font-poppins font-bold text-2xl sm:text-3xl hidden sm:inline">MindGuard</span>
            </Link>
            <p className="text-muted-foreground text-sm mb-4">
              AI-Powered Mental Health Support: Accessible, Affordable, and Stigma-Free.
            </p>
            <div className="flex space-x-4">
              <Link href="#" className="text-muted-foreground hover:text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                </svg>
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
                </svg>
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                  <rect x="2" y="9" width="4" height="12"></rect>
                  <circle cx="4" cy="4" r="2"></circle>
                </svg>
              </Link>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold text-lg mb-4">Product</h3>
            <ul className="space-y-2">
              <li><Link href="#features" className="text-muted-foreground hover:text-primary text-sm">Features</Link></li>
              <li><Link href="#how-it-works" className="text-muted-foreground hover:text-primary text-sm">How It Works</Link></li>
              <li><Link href="/pricing" className="text-muted-foreground hover:text-primary text-sm">Pricing</Link></li>
              <li><Link href="/testimonials" className="text-muted-foreground hover:text-primary text-sm">Testimonials</Link></li>
              <li><Link href="/faq" className="text-muted-foreground hover:text-primary text-sm">FAQ</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-lg mb-4">Company</h3>
            <ul className="space-y-2">
              <li><Link href="/about" className="text-muted-foreground hover:text-primary text-sm">About Us</Link></li>
              <li><Link href="/blog" className="text-muted-foreground hover:text-primary text-sm">Blog</Link></li>
              <li><Link href="/careers" className="text-muted-foreground hover:text-primary text-sm">Careers</Link></li>
              <li><Link href="/contact" className="text-muted-foreground hover:text-primary text-sm">Contact</Link></li>
              <li><Link href="/partners" className="text-muted-foreground hover:text-primary text-sm">Partners</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-lg mb-4">Professional Access</h3>
            <ul className="space-y-3">
              <li>
                <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                  <Link href="/doctor-signup">Register as a Doctor</Link>
                </Button>
              </li>
              <li>
                <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                  <Link href="/doctor-login">Login as a Doctor</Link>
                </Button>
              </li>
              <li>
                <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                  <Link href="/admin-login">Login as Admin</Link>
                </Button>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground mb-4 md:mb-0">
            &copy; {new Date().getFullYear()} MindGuard. All rights reserved.
          </p>
          <div className="flex space-x-6">
            <Link href="/privacy" className="text-sm text-muted-foreground hover:text-primary">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-sm text-muted-foreground hover:text-primary">
              Terms of Service
            </Link>
            <Link href="/cookies" className="text-sm text-muted-foreground hover:text-primary">
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}