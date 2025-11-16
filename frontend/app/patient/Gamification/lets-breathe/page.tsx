"use client";
import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

const breathingSteps = [
  "Inhale deeply...",
  "Hold your breath...",
  "Exhale slowly...",
];

const breathingExplanations = {
  "Inhale deeply...": "Take a slow, deep breath through your nose, filling your lungs completely.",
  "Hold your breath...": "Pause for a moment and let your body absorb the oxygen.",
  "Exhale slowly...": "Gently breathe out through your mouth, releasing tension."
};

const breathingImages = {
  "Inhale deeply...": "/inhale.jpg",
  "Hold your breath...": "/hold.jpg",
  "Exhale slowly...": "/exhale.jpg"
};

const rewards = ["Relaxation Badge", "Mindfulness Star", "Focus Master"];

export default function MindGuardGame() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [reward, setReward] = useState<string | null>(null);
  const [level, setLevel] = useState(1);
  const [timeLeft, setTimeLeft] = useState(60);
  const [timerActive, setTimerActive] = useState(false);
  const [showNextStep, setShowNextStep] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const sessionStartTime = useRef(Date.now());
  const [sessionScore, setSessionScore] = useState(0);
  const hasLoggedStart = useRef(false);
  const hasLoggedEnd = useRef(false);

  // Initialize audio
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio('/relaxing-music.mp3');
      if (audioRef.current) {
        audioRef.current.loop = true;
      }
    }

    // Log game start only once
    if (!hasLoggedStart.current) {
      logGameSession('in-progress');
      hasLoggedStart.current = true;
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      
      // Log game abandonment if not completed with a reward and not already logged
      if (!reward && !hasLoggedEnd.current) {
        logGameSession('abandoned');
        hasLoggedEnd.current = true;
      }
    };
  }, []);

  // Timer effect
  useEffect(() => {
    if (timerActive && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      completeLevel();
    }
  }, [timeLeft, timerActive]);

  // Step interval effect
  useEffect(() => {
    const stepInterval = setInterval(() => {
      setShowNextStep(true);
    }, 3000);
    return () => clearInterval(stepInterval);
  }, []);

  const toggleAudio = async () => {
    if (!audioRef.current) return;

    try {
      if (isAudioPlaying) {
        audioRef.current.pause();
      } else {
        await audioRef.current.play();
      }
      setIsAudioPlaying(!isAudioPlaying);
    } catch (error) {
      console.error('Error toggling audio:', error);
    }
  };

  const startLevel = async () => {
    setGameStarted(true);
    setTimerActive(true);
    setTimeLeft(level === 1 ? 60 : level * 300);
    setShowNextStep(false);

    try {
      if (audioRef.current && !isAudioPlaying) {
        await audioRef.current.play();
        setIsAudioPlaying(true);
      }
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };

  const completeLevel = () => {
    setTimerActive(false);
    const newReward = rewards[Math.floor(Math.random() * rewards.length)];
    setReward(newReward);
    // Increase score for completion
    const newScore = sessionScore + (level * 10);
    setSessionScore(newScore);

    if (audioRef.current) {
      audioRef.current.pause();
      setIsAudioPlaying(false);
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setTimeout(() => {
        const speech = new SpeechSynthesisUtterance(`Congratulations! You earned ${newReward}`);
        window.speechSynthesis.speak(speech);
      }, 500);
    }
    
    // Log completed session only once
    if (!hasLoggedEnd.current) {
      logGameSession('completed');
      hasLoggedEnd.current = true;
    }
  };
  
  const logGameSession = async (status: 'completed' | 'abandoned' | 'in-progress') => {
    try {
      const userId = localStorage.getItem('mindguard_user_id');
      const token = localStorage.getItem('token');
      
      if (!userId || !token) return;
      
      const duration = Math.floor((Date.now() - sessionStartTime.current) / 1000);
      
      // Don't log 0 duration sessions unless they're in-progress
      if (duration === 0 && status !== 'in-progress') return;
      
      await fetch('/api/gameLogs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({
          userId,
          gameType: 'breathing',
          duration,
          completionStatus: status,
          score: sessionScore,
          notes: `Breathing exercise - Level: ${level}`,
          metadata: {
            level,
            reward: reward || 'none'
          }
        }),
      });
    } catch (error) {
      console.error('Failed to log game session:', error);
    }
  };
  
  const handleExit = async () => {
    // Log session as abandoned if no reward was earned and not already logged
    if (!reward && !hasLoggedEnd.current) {
      await logGameSession('abandoned');
      hasLoggedEnd.current = true;
    }
    
    // Return to games selection
    router.push('/patient/Gamification');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-blue-100 p-6">
      <div className="w-full max-w-md flex justify-between mb-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleExit}
          className="flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          Exit Game
        </Button>
        {sessionScore > 0 && <div className="font-medium">Score: {sessionScore}</div>}
      </div>
      
      <Card className="p-6 max-w-md w-full text-center shadow-lg rounded-2xl bg-white">
        <CardContent>
          {!gameStarted ? (
            <>
              <h2 className="text-2xl font-semibold mb-4">Lets Breathe</h2>
              <p className="text-gray-600 mb-6">A calming game to help you relax.</p>
              <div className="space-y-4">
                <Button onClick={startLevel} className="mr-2">Start Level {level}</Button>
                <Button 
                  variant="outline" 
                  onClick={toggleAudio}
                >
                  {isAudioPlaying ? "Pause Music" : "Play Music"}
                </Button>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold mb-4">Level {level}: Breathing Exercise</h2>
              <p className="text-gray-600 mb-2">
                Time Left: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
              </p>
              <motion.h2
                key={step}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-lg font-semibold mb-4"
              >
                {breathingSteps[step]}
              </motion.h2>
              <p className="text-gray-500 mb-4">
                {breathingExplanations[breathingSteps[step] as keyof typeof breathingExplanations]}
              </p>
              <img 
                src={breathingImages[breathingSteps[step] as keyof typeof breathingImages]} 
                alt={breathingSteps[step]} 
                className="mb-4 w-48 h-48 object-contain mx-auto" 
              />

              {showNextStep && (
                <Button 
                  onClick={() => { 
                    setStep((step + 1) % breathingSteps.length); 
                    setShowNextStep(false); 
                  }} 
                  className="mt-4 mb-4"
                >
                  Next Step
                </Button>
              )}
              {timeLeft === 0 && (
                <Button 
                  onClick={() => { 
                    setLevel(level + 1); 
                    setGameStarted(false); 
                    setReward(null);
                    // Reset session start time for the next level
                    sessionStartTime.current = Date.now();
                    // Reset logging flags for the new level
                    hasLoggedStart.current = false;
                    hasLoggedEnd.current = false;
                  }} 
                  className="mt-4"
                >
                  Next Level
                </Button>
              )}
              {reward && (
                <p className="text-green-600 mt-4">🎉 Reward Earned: {reward} 🎉</p>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
