"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Navbar } from "@/components/navbar"
import { TaskTimeline } from "@/components/task-timeline"
import { RewardPopup } from "@/components/reward-popup"
import { WalkProgress } from "@/components/walk-progress"
import { ExerciseVideoUpload } from "@/components/patient/exercise-video-upload"
import type { Task, UserStats } from "@/types"
import { tasks as initialTasks } from "@/data/tasks"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/components/ui/use-toast"

export default function ChallengesList() {
  const { toast } = useToast()
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0)
  const [showRewardPopup, setShowRewardPopup] = useState(false)
  const [rewardPoints, setRewardPoints] = useState(0)
  const [userStats, setUserStats] = useState<UserStats>({
    points: 0,
    streak: 0,
    lastCompletedDate: null,
  })
  const [showRewardPopups, setShowRewardPopups] = useState(true)
  const [walkStartTime, setWalkStartTime] = useState<Date | null>(null)
  const [stepCount, setStepCount] = useState(0)
  const initialStepCountRef = useRef<number | null>(null)
  const tasksRef = useRef<Task[]>(initialTasks)
  // State for exercise videos
  const [showExerciseUpload, setShowExerciseUpload] = useState(false)
  const [currentExerciseType, setCurrentExerciseType] = useState<"plank" | "pushup" | "squats" | "bicepcurls" | null>(null)

  // Load user stats from localStorage on initial render
  useEffect(() => {
    const savedStats = localStorage.getItem("mindTrackUserStats")
    const savedTasks = localStorage.getItem("mindTrackTasks")
    const savedCurrentTaskIndex = localStorage.getItem("mindTrackCurrentTaskIndex")

    if (savedStats) {
      setUserStats(JSON.parse(savedStats))
    }

    if (savedTasks) {
      setTasks(JSON.parse(savedTasks))
      tasksRef.current = JSON.parse(savedTasks)
    }

    if (savedCurrentTaskIndex) {
      setCurrentTaskIndex(Number.parseInt(savedCurrentTaskIndex))
    }

    // Check streak
    checkStreak()
  }, [])

  // Save user stats to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("mindTrackUserStats", JSON.stringify(userStats))
  }, [userStats])

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("mindTrackTasks", JSON.stringify(tasks))
    tasksRef.current = tasks
  }, [tasks])

  // Save current task index to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("mindTrackCurrentTaskIndex", currentTaskIndex.toString())
  }, [currentTaskIndex])

  // Setup step counter when walk starts
  useEffect(() => {
    if (!walkStartTime) return;

    let stepSensor: any = null;

    const startStepCounting = async () => {
      try {
        if ('Sensor' in window && 'StepCounter' in window) {
          stepSensor = new (window as any).StepCounter();
          initialStepCountRef.current = null;

          stepSensor.onreading = () => {
            const currentSteps = stepSensor.steps;
            
            if (initialStepCountRef.current === null) {
              initialStepCountRef.current = currentSteps;
              setStepCount(0);
              return;
            }

            const stepsTaken = currentSteps - initialStepCountRef.current;
            setStepCount(stepsTaken);
          };

          stepSensor.start();
          
          toast({
            title: "Step Counter Active",
            description: "Your steps are being counted automatically.",
          });
        } else {
          toast({
            title: "Step Counter Not Available",
            description: "Using timer-based tracking instead.",
          });
        }
      } catch (error) {
        console.error('Error starting step counter:', error);
        toast({
          title: "Step Counter Error",
          description: "Using timer-based tracking instead.",
        });
      }
    };

    startStepCounting();

    return () => {
      if (stepSensor) {
        stepSensor.stop();
      }
    };
  }, [walkStartTime]);

  const checkStreak = () => {
    const today = new Date().toDateString()
    const lastCompleted = userStats.lastCompletedDate

    if (!lastCompleted) return

    const lastDate = new Date(lastCompleted)
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    // If last completed date is before yesterday, reset streak
    if (lastDate < new Date(yesterday.toDateString())) {
      setUserStats((prev) => ({
        ...prev,
        streak: 0,
      }))

      toast({
        title: "Streak Reset",
        description: "You missed a day! Your streak has been reset.",
        variant: "destructive",
      })
    }
  }

  const startWalk = () => {
    setWalkStartTime(new Date());
    setStepCount(0);
    initialStepCountRef.current = null;
    toast({
      title: "Walk Started",
      description: "Your 15-minute walk has begun. Keep moving!",
    });
  };

  // Helper function to determine exercise type
  const getExerciseType = (taskTitle: string): "plank" | "pushup" | "squats" | "bicepcurls" | null => {
    const title = taskTitle.toLowerCase();
    if (title.includes("plank")) return "plank";
    if (title.includes("push-up") || title.includes("pushup")) return "pushup";
    if (title.includes("squat")) return "squats";
    if (title.includes("bicep curl")) return "bicepcurls";
    return null;
  };

  const handleCompleteTask = (taskId: string, duration?: number) => {
    console.log(`handleCompleteTask called with taskId: ${taskId}, duration: ${duration}`); // <<< ADD THIS LOG
    const taskIndex = tasks.findIndex((t) => t.id === taskId)
    if (taskIndex === -1 || taskIndex !== currentTaskIndex) {
      console.warn(`Attempted to complete task with ID ${taskId} at index ${taskIndex}, but current task index is ${currentTaskIndex}. Ignoring.`);
      return; // Prevent completing wrong task or already completed task
    }

    // Generate a unique ID for this specific completion attempt
    const completionAttemptId = `completion-${taskId}-${Date.now()}`;
    window.sessionStorage.setItem("currentTaskCompletionId", completionAttemptId);
    console.log(`Set currentTaskCompletionId: ${completionAttemptId}`);

    // Clear any previous safety timer before setting a new one
    const existingSafetyTimerId = window.sessionStorage.getItem("taskSafetyTimer");
    if (existingSafetyTimerId) {
      clearTimeout(parseInt(existingSafetyTimerId));
      window.sessionStorage.removeItem("taskSafetyTimer");
      console.log("Cleared existing safety timer before setting new one.");
    }

    // Set a safety timer (e.g., 15 seconds) to auto-complete if analysis hangs
    const safetyTimeout = 15000; // 15 seconds
    const safetyTimerId = setTimeout(() => {
      // *** CRITICAL CHECK ***
      // Only proceed if this specific completion attempt is still the active one
      const activeCompletionId = window.sessionStorage.getItem("currentTaskCompletionId");
      if (activeCompletionId !== completionAttemptId) {
        console.log(`Safety timer fired for ${completionAttemptId}, but active ID is ${activeCompletionId}. Aborting timer action.`);
        window.sessionStorage.removeItem("taskSafetyTimer"); // Clean up timer ID
        return;
      }
      
      console.log(`Safety timer triggered for ${completionAttemptId} - completing task automatically`);
      window.sessionStorage.removeItem("taskSafetyTimer"); // Clean up timer ID
      window.sessionStorage.removeItem("currentTaskCompletionId"); // Clean up completion ID
      
      // Find the task again *inside* the timeout callback to ensure freshness
      const currentTaskInTimeout = tasksRef.current.find(t => t.id === taskId);
      if (currentTaskInTimeout && !currentTaskInTimeout.completed) {
        completeTaskLogic(taskId, taskIndex, 5); // Use a default/fallback duration
      } else {
        console.log(`Safety timer for ${completionAttemptId}: Task already completed or not found.`);

      }
    }, safetyTimeout);

    // Store the new safety timer ID
    window.sessionStorage.setItem("taskSafetyTimer", safetyTimerId.toString());
    console.log(`Set safety timer ${safetyTimerId} for ${completionAttemptId} (${safetyTimeout}ms)`);

    // If duration is provided (meaning analysis completed), complete immediately
    if (duration !== undefined && duration > 0) {
      console.log(`Completing task ${taskId} immediately with duration ${duration}`);
      // Clear the safety timer we just set, as analysis finished quickly
      clearTimeout(safetyTimerId);
      window.sessionStorage.removeItem("taskSafetyTimer");
      window.sessionStorage.removeItem("currentTaskCompletionId"); // Clear completion ID
      console.log(`Cleared safety timer ${safetyTimerId} due to immediate completion.`);
      completeTaskLogic(taskId, taskIndex, duration);
    } else {
      console.log(`Task ${taskId} completion initiated, waiting for analysis or safety timer.`);
      // If no duration, it means we are waiting for analysis (e.g., video upload)
      // The safety timer will handle completion if analysis fails/hangs
    }
  }

  // Refactored completion logic into its own function
  const completeTaskLogic = (taskId: string, taskIndex: number, durationOrPoints: number) => {
    // Double check if task is already completed to prevent duplicate state updates
    if (tasksRef.current[taskIndex]?.completed) {
      console.warn(`completeTaskLogic called for already completed task: ${taskId}. Skipping.`);
      return;
    }

    // Clear safety timer just in case (redundancy is good here)
    const safetyTimerId = window.sessionStorage.getItem("taskSafetyTimer");
    if (safetyTimerId) {
      clearTimeout(parseInt(safetyTimerId));
      window.sessionStorage.removeItem("taskSafetyTimer");
      console.log("Safety timer cleared from completeTaskLogic");
    }
    // Also clear completion ID
    window.sessionStorage.removeItem("currentTaskCompletionId");

    // Add debug logging
    console.log("=== TASK COMPLETION DEBUG ===");
    console.log(`Current task index: ${currentTaskIndex}`);
    console.log(`Completing task at index: ${taskIndex}`);
    console.log(`Total tasks: ${tasks.length}`);

    // Update the task as completed using functional update
    setTasks(prevTasks => {
      const updatedTasks = [...prevTasks];
      if (updatedTasks[taskIndex]) {
        updatedTasks[taskIndex] = {
          ...updatedTasks[taskIndex],
          completed: true,
          progress: 100,
        };
        console.log(`Task marked as completed: ${updatedTasks[taskIndex].title}`);
      } else {
        console.error(`Task at index ${taskIndex} not found during state update!`);
      }
      return updatedTasks;
    });

    // Generate random reward points (10-50)
    const points = Math.floor(Math.random() * 41) + 10
    setRewardPoints(points)

    // Only show reward popup if enabled
    if (showRewardPopup) {
      console.log(`Showing reward popup with ${points} points`);
      setShowRewardPopup(true);
      // Auto-close popup after 3 seconds
      setTimeout(() => {
        setShowRewardPopup(false);
        console.log("Reward popup closed.");
        // Move to next task *after* popup closes
        advanceToNextTask(taskIndex);
      }, 3000);
    } else {
      // If popup is disabled, move to next task immediately
      advanceToNextTask(taskIndex);
    }
  };

  const advanceToNextTask = (completedTaskIndex: number) => {
    // Ensure we are advancing from the correct index
    if (completedTaskIndex === currentTaskIndex) {
      const nextIndex = completedTaskIndex + 1;
      if (nextIndex < tasks.length) {
        console.log(`UNLOCKING NEXT TASK: Moving from ${completedTaskIndex} to ${nextIndex}`);
        console.log(`Next task will be: ${tasks[nextIndex].title}`);
        setCurrentTaskIndex(nextIndex);
      } else {
        console.log("All tasks completed!");
        // Handle completion of all tasks (e.g., show final message)
      }
    } else {
      console.warn(`advanceToNextTask called with index ${completedTaskIndex}, but current index is ${currentTaskIndex}. Ignoring.`);
    }
    console.log("=== END DEBUG ===");
    // Log state after update
    const completedCount = tasksRef.current.filter(t => t.completed).length;
    console.log(`Popup closed. Total completed tasks: ${completedCount}/${tasksRef.current.length}`);
  };

  const resetTasks = () => {
    setTasks(initialTasks)
    setCurrentTaskIndex(0)
    toast({
      title: "Tasks Reset",
      description: "All tasks have been reset. Your points and streak remain.",
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/90 bg-[url('/pattern.svg')] bg-fixed">
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center mb-8">
          <h1 className="text-4xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-pink-500 mb-2">
            MindTrack Journey
          </h1>
          <p className="text-center text-muted-foreground max-w-2xl">
            Complete daily wellness tasks to earn rewards and maintain your streak. Your mental health journey
            visualized as a path to wellness.
          </p>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" onClick={resetTasks}>
              Reset Tasks
            </Button>
            {/* Debug button to manually advance to next task */}
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={() => {
                if (currentTaskIndex < tasks.length - 1) {
                  const nextIndex = currentTaskIndex + 1;
                  console.log(`DEBUG: Manually advancing to task ${nextIndex}`);
                  setCurrentTaskIndex(nextIndex);
                  localStorage.setItem("mindTrackCurrentTaskIndex", nextIndex.toString());
                  toast({
                    title: "Debug: Task Advanced",
                    description: `Manually unlocked ${tasks[nextIndex].title}`,
                  });
                } else {
                  toast({
                    title: "Debug: No More Tasks",
                    description: "Already at the last task",
                    variant: "destructive",
                  });
                }
              }}
            >
              Debug: Next Task
            </Button>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRewardPopups(!showRewardPopups)}
              className="text-xs"
            >
              {showRewardPopups ? "Disable" : "Enable"} Reward Popups
            </Button>
            <span className="text-xs text-muted-foreground">
              {showRewardPopups ? "Popups are enabled" : "Using toast notifications instead"}
            </span>
          </div>
        </div>

        {/* Show walk progress if afternoon walk is active */}
        {tasks[currentTaskIndex]?.title === "Afternoon Walk" && (
          <div className="max-w-md mx-auto mb-8">
            <WalkProgress
              startTime={walkStartTime}
              stepCount={stepCount}
              targetSteps={1500}
              targetMinutes={15}
            />
          </div>
        )}

        {/* Show exercise video upload if an exercise task is active */}
        {showExerciseUpload && currentExerciseType && (
          <div className="max-w-md mx-auto mb-8">
            <ExerciseVideoUpload
              exerciseType={currentExerciseType}
              taskId={tasks[currentTaskIndex]?.id}
              taskTitle={tasks[currentTaskIndex]?.title}
              onExerciseComplete={(duration) => handleCompleteTask(tasks[currentTaskIndex]?.id, duration)}
              onExerciseError={(error) => {
                console.error(`Exercise analysis error: ${error}`);
                handleCompleteTask(tasks[currentTaskIndex]?.id);
              }}
            />
          </div>
        )}

        <TaskTimeline 
          tasks={tasks} 
          currentTaskIndex={currentTaskIndex} 
          onCompleteTask={(taskId, duration) => handleCompleteTask(taskId, duration)} // Pass duration here
        />

        {showRewardPopup && <RewardPopup points={rewardPoints} onClose={() => setShowRewardPopup(false)} />}
      </main>
      <Toaster />
    </div>
  )
}

