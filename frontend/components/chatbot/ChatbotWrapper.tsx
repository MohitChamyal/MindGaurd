"use client";

import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';

// Dynamically import the chat component with SSR disabled
const MindGuardChat = dynamic(
  () => import('@/components/chatbot/MindGuardChat'),
  { ssr: false }
);

export default function ChatbotWrapper() {
  const pathname = usePathname();
  
  // List of paths where the chatbot should NOT be rendered
  const excludedPaths = [
    '/',                // Root/home page
    '/landing',         // Landing page
    '/login',           // Main login
    '/signup',          // Main signup
    '/admin-login',     // Admin login
    '/doctor-login',    // Doctor login
    '/patient-login',   // Patient login if exists
    '/doctor-signup',   // Doctor signup
    '/patient-signup',  // Patient signup if exists
    '/register',        // Any registration page
    '/reset-password',  // Password reset pages
    '/forgot-password', // Forgot password pages
  ];
  
  // Check if current path starts with any of the excluded paths
  const shouldExclude = excludedPaths.some(path => 
    pathname === path || pathname.startsWith(`${path}/`)
  );
  
  if (shouldExclude) {
    return null;
  }
  
  return <MindGuardChat />;
} 