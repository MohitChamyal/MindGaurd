"use client";

import { useEffect, useState } from 'react';
import styles from './MindGuardChat.module.css';

declare global {
  interface Window {
    AgentInitializer: {
      init: (config: any) => void;
    };
  }
}

export default function MindGuardChat() {
  // Use state to track if we're in the browser
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    // Load the JotForm script
    const script = document.createElement('script');
    script.src = 'https://cdn.jotfor.ms/s/umd/latest/for-embedded-agent.js';
    script.async = true;
    document.body.appendChild(script);

    // Initialize the agent when the script is loaded
    script.onload = () => {
      if (window.AgentInitializer) {
        window.AgentInitializer.init({
          agentRenderURL: "https://agent.jotform.com/01965a180bf97028ba902d392b9223e6ff7f",
          rootId: "JotformAgent-01965a180bf97028ba902d392b9223e6ff7f",
          formID: "01965a180bf97028ba902d392b9223e6ff7f",
          queryParams: ["skipWelcome=1", "maximizable=1"],
          domain: "https://www.jotform.com",
          isDraggable: false,
          background: "linear-gradient(180deg, #035C5F 0%, #035C5F 100%)",
          buttonBackgroundColor: "#8E1CA8",
          buttonIconColor: "#FFFFFF",
          variant: false,
          customizations: {
            "greeting": "Yes",
            "greetingMessage": "Hello I am MindGuard, your friend and companion. How can I help you today?",
            "pulse": "Yes",
            "position": "right"
          },
          isVoice: false,
        });
      }
    };

    // Cleanup
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // Don't render anything on the server
  if (!isMounted) return null;

  return <div className={styles.chatContainer} id="JotformAgent-01965a180bf97028ba902d392b9223e6ff7f"></div>;
} 