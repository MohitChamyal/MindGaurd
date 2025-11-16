"use client";
import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { Loader2, Check, Clock, ArrowLeft } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRouter } from "next/navigation";

interface Memory {
  date: string;
  content: string;
  _id: string;
}

const MemoryNotepad = () => {
  const router = useRouter();
  const today = format(new Date(), "yyyy-MM-dd");
  const [memories, setMemories] = useState<Memory[]>([]);
  const [currentMemory, setCurrentMemory] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [sessionTime, setSessionTime] = useState(0);
  const sessionStartTime = useRef(Date.now());
  const timerInterval = useRef<NodeJS.Timeout | null>(null);
  const userId = useRef<string | null>(null);
  const hasLoggedStart = useRef(false);
  const hasLoggedEnd = useRef(false);

  useEffect(() => {
    // Get user ID from localStorage
    userId.current = localStorage.getItem('mindguard_user_id');
    
    // Start session timer
    startSessionTimer();
    
    // Load memories
    fetchMemories();
    
    // Log game start - only once
    if (!hasLoggedStart.current) {
      logGameSession('in-progress');
      hasLoggedStart.current = true;
    }
    
    // Cleanup function
    return () => {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
      
      // Log the session when component unmounts if there was activity and not already logged
      if (sessionTime > 5 && currentMemory.trim().length > 0 && !hasLoggedEnd.current) {
        logGameSession('abandoned');
        hasLoggedEnd.current = true;
      }
    };
  }, []);

  const startSessionTimer = () => {
    sessionStartTime.current = Date.now();
    timerInterval.current = setInterval(() => {
      const elapsedSeconds = Math.floor((Date.now() - sessionStartTime.current) / 1000);
      setSessionTime(elapsedSeconds);
    }, 1000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const fetchMemories = async () => {
    if (!userId.current) {
      setIsLoading(false);
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/memories?userId=${userId.current}`, {
        headers: {
          'x-auth-token': token || ''
        }
      });
      
      if (!response.ok) {
        if (response.status !== 404) {
          const error = await response.text();
          throw new Error(error);
        }
        setMemories([]);
        setIsLoading(false);
        return;
      }
      
      const data = await response.json();
      setMemories(data);
      
      // Set current memory if exists for today
      const todayMemory = data.find((m: Memory) => m.date === today);
      setCurrentMemory(todayMemory?.content || "");
    } catch (error) {
      console.error("Failed to load memories:", error);
      setMessage({
        type: "error",
        text: "Failed to load memories. Please try again later."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const logGameSession = async (status: 'completed' | 'abandoned' | 'in-progress') => {
    if (!userId.current) return;
    
    try {
      const token = localStorage.getItem('token');
      const duration = Math.floor((Date.now() - sessionStartTime.current) / 1000);
      
      // Don't log 0 duration sessions unless they're in-progress
      if (duration === 0 && status !== 'in-progress') return;
      
      await fetch('/api/gameLogs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token || ''
        },
        body: JSON.stringify({
          userId: userId.current,
          gameType: 'notes',
          duration: duration,
          completionStatus: status,
          notes: currentMemory.substring(0, 50) + (currentMemory.length > 50 ? '...' : ''),
          metadata: {
            date: today,
            wordCount: currentMemory.split(/\s+/).length,
            characterCount: currentMemory.length
          }
        }),
      });
    } catch (error) {
      console.error("Failed to log game session:", error);
      // Don't show user error for logging
    }
  };

  const handleSaveMemory = async () => {
    if (!currentMemory.trim()) {
      setMessage({
        type: "error",
        text: "Please write something before saving"
      });
      return;
    }

    try {
      setIsSaving(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/memories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token || ''
        },
        body: JSON.stringify({
          userId: userId.current,
          date: today,
          content: currentMemory,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save memory');
      }

      await fetchMemories(); // Refresh memories after saving
      
      // Log the completed game session only if not already logged
      if (!hasLoggedEnd.current) {
        await logGameSession('completed');
        hasLoggedEnd.current = true;
      }
      
      // Reset session timer and logging state for potential new session
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
      startSessionTimer();
      sessionStartTime.current = Date.now();
      hasLoggedStart.current = false;
      hasLoggedEnd.current = false;
      
      // Log new session start
      logGameSession('in-progress');
      hasLoggedStart.current = true;
      
      setMessage({
        type: "success",
        text: "Memory saved successfully!"
      });
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setMessage({ type: "", text: "" });
      }, 3000);
    } catch (error) {
      console.error("Failed to save memory:", error);
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to save memory"
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleExit = async () => {
    // Log session as abandoned if not already logged and there's content
    if (!hasLoggedEnd.current && currentMemory.trim().length > 0) {
      await logGameSession('abandoned');
      hasLoggedEnd.current = true;
    }
    
    // Return to games selection
    router.push('/patient/Gamification');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center p-6 space-y-6 bg-gray-900 min-h-screen text-white">
      <div className="w-full flex justify-between max-w-md mb-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleExit}
          className="flex items-center gap-2 text-white bg-transparent"
        >
          <ArrowLeft size={16} />
          Exit Game
        </Button>
        <h1 className="text-2xl font-bold">My Memory Diary</h1>
      </div>
      <div className="flex items-center justify-between w-full max-w-md">
        <p className="text-lg">Today's Date: {today}</p>
        <div className="flex items-center text-yellow-400">
          <Clock className="h-4 w-4 mr-1" />
          <span>{formatTime(sessionTime)}</span>
        </div>
      </div>
      {message.text && (
        <Alert className={`w-96 ${message.type === 'error' ? 'bg-red-900/20 border-red-900/50' : 'bg-green-900/20 border-green-900/50'}`}>
          <AlertDescription className="flex items-center">
            {message.type === 'success' && <Check className="h-4 w-4 mr-2 text-green-500" />}
            {message.text}
          </AlertDescription>
        </Alert>
      )}
      <Card className="w-96 p-4 bg-gray-800 shadow-lg border-2 border-yellow-500 rounded-lg relative">
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-10 h-2 bg-gray-300 rounded-full"></div>
        <CardContent className="flex flex-col space-y-4 p-6 bg-[url('/hindi-notebook.png')] bg-cover bg-no-repeat bg-white rounded-lg border border-gray-300 shadow-md">
          <Textarea
            value={currentMemory}
            onChange={(e) => setCurrentMemory(e.target.value)}
            placeholder="Write your best memory of the day..."
            className="bg-transparent p-2 text-black text-lg leading-relaxed"
            style={{ fontFamily: "cursive", minHeight: "200px", border: "none", outline: "none" }}
          />
          <Button 
            onClick={handleSaveMemory} 
            className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-4 rounded"
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Memory'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default MemoryNotepad;