"use client"

import { useState, useEffect } from "react"
import type { Task } from "@/types"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { CheckCircle, Circle, Clock, TrendingUp, Brain, Heart, Droplets, Dumbbell, Trophy, XCircle } from "lucide-react"
import { 
  uploadExerciseVideo,
  uploadPlankVideo,
  uploadPushupVideo,
  uploadSquatsVideo,
  uploadBicepCurlsVideo,
  uploadWalkingVideo
} from "@/lib/api/exercise"

interface TaskTimelineProps {
  tasks: Task[]
  currentTaskIndex: number
  onCompleteTask: (taskId: string, duration?: number) => void
}

export function TaskTimeline({ tasks, currentTaskIndex, onCompleteTask }: TaskTimelineProps) {
  const [animatedProgress, setAnimatedProgress] = useState<Record<string, number>>({})
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const [activeVideoTask, setActiveVideoTask] = useState<string | null>(null)
  const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [videoError, setVideoError] = useState<string | null>(null)
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null)
  const [isAudioPlaying, setIsAudioPlaying] = useState(false)
  const [showRewardsPopup, setShowRewardsPopup] = useState(false)
  const [currentReward, setCurrentReward] = useState<string | null>(null)
  const [isHydrationVideoPlaying, setIsHydrationVideoPlaying] = useState(false)
  const [activeHydrationTask, setActiveHydrationTask] = useState<string | null>(null)
  const [hydrationVideoRef, setHydrationVideoRef] = useState<HTMLVideoElement | null>(null)
  const [isWalkingVideoPlaying, setIsWalkingVideoPlaying] = useState(false)
  const [activeWalkingTask, setActiveWalkingTask] = useState<string | null>(null)
  const [walkingVideoRef, setWalkingVideoRef] = useState<HTMLVideoElement | null>(null)
  const [showVideoUpload, setShowVideoUpload] = useState<boolean>(false)
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null)
  const [walkingPercentage, setWalkingPercentage] = useState<number | null>(null)
  const [analysisMessage, setAnalysisMessage] = useState<string | null>(null)
  const [analysisHistory, setAnalysisHistory] = useState<any[]>([])
  const [showFailurePopup, setShowFailurePopup] = useState(false)
  const [isPlankVideoPlaying, setIsPlankVideoPlaying] = useState(false)
  const [activePlankTask, setActivePlankTask] = useState<string | null>(null)
  const [plankVideoRef, setPlankVideoRef] = useState<HTMLVideoElement | null>(null)
  const [plankAnalysis, setPlankAnalysis] = useState<any>(null)
  const [showPlankUpload, setShowPlankUpload] = useState<boolean>(false)
  const [currentExerciseType, setCurrentExerciseType] = useState<string | null>(null)
  const [showExerciseUpload, setShowExerciseUpload] = useState<boolean>(false)
  const [lastAnalysisData, setLastAnalysisData] = useState<any>(null)

  // Initialize animated progress values
  useEffect(() => {
    const initialProgress: Record<string, number> = {}
    tasks.forEach((task) => {
      initialProgress[task.id] = task.progress || 0
    })
    setAnimatedProgress(initialProgress)
  }, [tasks])

  // Add this useEffect to handle both video and audio
  useEffect(() => {
    if (videoRef && audioRef && isVideoPlaying && activeVideoTask) {
      const playMedia = async () => {
        try {
          console.log("Attempting to play video and audio");
          // Reset both media to start
          videoRef.currentTime = 0;
          audioRef.currentTime = 0;
          
          // Try to play both media
          const videoPromise = videoRef.play();
          const audioPromise = audioRef.play();
          
          await Promise.all([videoPromise, audioPromise]);
          console.log("Both video and audio playing successfully");
        } catch (error) {
          console.error("Error playing media:", error);
          setVideoError("Failed to play meditation content");
          setIsVideoPlaying(false);
          setIsAudioPlaying(false);
          setActiveVideoTask(null);
        }
      };
      playMedia();
    }
  }, [videoRef, audioRef, isVideoPlaying, activeVideoTask]);

  // Add debug logging for video events
  useEffect(() => {
    if (videoRef) {
      videoRef.addEventListener('loadstart', () => console.log('Video loading started'));
      videoRef.addEventListener('loadeddata', () => console.log('Video data loaded'));
      videoRef.addEventListener('playing', () => console.log('Video is playing'));
      videoRef.addEventListener('error', (e) => {
        console.error('Video error:', videoRef.error);
        setVideoError(videoRef.error?.message || 'Error loading video');
      });
    }
  }, [videoRef]);

  // Get task icon based on category
  const getTaskIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case "walk":
        return <Dumbbell className="h-5 w-5" />
      case "meditation":
        return <Brain className="h-5 w-5" />
      case "exercise":
        return <Dumbbell className="h-5 w-5" />
      case "hydration":
        return <Droplets className="h-5 w-5" />
      case "wellness":
        return <Heart className="h-5 w-5" />
      default:
        return <TrendingUp className="h-5 w-5" />
    }
  }

  // Format time to 12-hour format
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number)
    const period = hours >= 12 ? "PM" : "AM"
    const formattedHours = hours % 12 || 12
    return `${formattedHours}:${minutes.toString().padStart(2, "0")} ${period}`
  }

  const handleVideoEnd = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    setIsVideoPlaying(false);
    setIsAudioPlaying(false);
    setActiveVideoTask(null);
    
    if (audioRef) {
      audioRef.pause();
      audioRef.currentTime = 0;
    }
    
    // Show rewards popup for meditation
    if (task && task.category.toLowerCase() === "meditation") {
      setCurrentReward(task.reward);
      setShowRewardsPopup(true);
      setTimeout(() => {
        onCompleteTask(taskId);
        setShowRewardsPopup(false);
        setCurrentReward(null);
      }, 3000);
    }
  };

  const fetchAnalysisHistory = async () => {
    try {
      // Instead of using the external analysis service that's not available,
      // use our API that we know works
      const response = await fetch('/api/exercise/history')
      if (!response.ok) {
        console.log('Analysis history not available')
        return // Fail silently - this is not a critical functionality
      }
      const data = await response.json()
      if (data.history) {
        setAnalysisHistory(data.history)
      }
    } catch (error) {
      console.log('Analysis history feature not enabled')
      // Don't show error to user as this is not critical functionality
    }
  }

  useEffect(() => {
    // Only fetch if needed - or simply disable until we have a working endpoint
    // fetchAnalysisHistory()
  }, [])

  const handleExerciseVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>, taskCategory: string, taskTitle?: string) => {
    const file = event.target.files?.[0]
    if (file) {
      try {
        // Set selected video to show preview
        setSelectedVideo(file)
        
        // Get the current task
        const currentTask = tasks[currentTaskIndex];
        
        // Determine the specific exercise type from the task info
        // This is more reliable than using filename or category
        let exerciseType = "unknown";
        
        // First, check the task title as it's most reliable
        if (currentTask && currentTask.title) {
          const title = currentTask.title.toLowerCase();
          if (title.includes("plank")) {
            exerciseType = "plank";
          } else if (title.includes("push-up") || title.includes("pushup")) {
            exerciseType = "pushup";
          } else if (title.includes("squat")) {
            exerciseType = "squats";
          } else if (title.includes("bicep curl") || title.includes("bicepcurl")) {
            exerciseType = "bicepcurls";
          } else if (title.includes("walk")) {
            exerciseType = "walking";
          }
        }
        
        // If task title didn't help, try the provided taskTitle param or fallback to category
        if (exerciseType === "unknown") {
          if (taskTitle) {
            const title = taskTitle.toLowerCase();
            if (title.includes("plank")) {
              exerciseType = "plank";
            } else if (title.includes("push-up") || title.includes("pushup")) {
              exerciseType = "pushup";
            } else if (title.includes("squat")) {
              exerciseType = "squats";
            } else if (title.includes("bicep curl") || title.includes("bicepcurl")) {
              exerciseType = "bicepcurls";
            } else if (title.includes("walk")) {
              exerciseType = "walking";
            }
          } else if (taskCategory && taskCategory !== "exercise") {
            exerciseType = taskCategory;
          }
        }
        
        // As a last resort, if we still don't know the type, check the filename 
        // (less reliable but better than nothing)
        if (exerciseType === "unknown") {
          const fileName = file.name.toLowerCase();
          if (fileName.includes('push') || fileName.includes('pushup')) {
            exerciseType = 'pushup';
          } else if (fileName.includes('squat')) {
            exerciseType = 'squats';
          } else if (fileName.includes('bicep') || fileName.includes('curl')) {
            exerciseType = 'bicepcurls';
          } else if (fileName.includes('plank')) {
            exerciseType = 'plank';
          } else if (fileName.includes('walk')) {
            exerciseType = 'walking';
          } else {
            // If all else fails, use a default type
            exerciseType = 'plank';
          }
        }
        
        // Before using currentExerciseType, if it's explicitly set, prioritize it
        if (currentExerciseType && ["plank", "pushup", "squats", "bicepcurls", "walking"].includes(currentExerciseType)) {
          exerciseType = currentExerciseType;
          console.log(`Using explicitly set exercise type from state: ${exerciseType}`);
        }
        
        console.log(`Starting ${exerciseType} video upload for task ID ${currentTask?.id}...`, file)
        setIsLoading(true)
        setVideoError(null)
        setAnalysisMessage(`Uploading ${file.name}...`)

        // Use the proper API function instead of direct fetch
        try {
          // Log the exercise type before upload to confirm it's correct
          console.log(`Exercise type determined to be: ${exerciseType}`)
          
          // Use the specific API function for each exercise type
          let data;
          // Convert exercise type to lowercase and normalize
          const normalizedExerciseType = exerciseType.toLowerCase().trim();
          
          switch (normalizedExerciseType) {
            case 'plank':
              data = await uploadPlankVideo(file);
              break;
            case 'pushup':
            case 'push-up':
            case 'push up':
              data = await uploadPushupVideo(file);
              break;
            case 'squats':
            case 'squat':
              data = await uploadSquatsVideo(file);
              break;
            case 'bicepcurls':
            case 'bicep curl':
            case 'bicep curls':
            case 'bicep-curl':
              data = await uploadBicepCurlsVideo(file);
              break;
            case 'walking':
            case 'walk':
              data = await uploadWalkingVideo(file);
              break;
            default:
              // Fallback to generic function
              console.warn(`No specific API for exercise type "${exerciseType}", using generic upload`);
              data = await uploadExerciseVideo(exerciseType, file);
          }
          
          console.log(`${exerciseType} analysis results:`, data)

          // Store analysis data in sessionStorage for reference
          if (typeof window !== 'undefined') {
            try {
              window.sessionStorage.setItem(`${exerciseType}Analysis`, JSON.stringify(data));
            } catch (e) {
              console.error('Error storing analysis data in sessionStorage:', e);
            }
          }

          // Update the lastAnalysisData state with the received data
          setLastAnalysisData(data);

          if (data.success) {
            // Directly complete the exercise if treasureEarned is true
            if (data.treasureEarned === true) {
              console.log(`Exercise ${exerciseType} completed with treasureEarned=true. Calling directlyCompleteExercise`);
              directlyCompleteExercise(data);
              return; // Exit early to prevent further processing
            }

            // This code will only run if treasureEarned is not true
            if (exerciseType === 'plank') {
              console.log("PLANK DATA RECEIVED:", JSON.stringify(data)); // Add debugging log
              setPlankAnalysis(data)
              setIsPlankVideoPlaying(true)
              setActivePlankTask(tasks[currentTaskIndex].id)
              
              // Store in localStorage for direct access
              if (typeof window !== 'undefined') {
                try {
                  localStorage.setItem('plankAnalysisData', JSON.stringify(data));
                } catch (e) {
                  console.error('Error storing plank data:', e);
                }
              }
            } else {
              // For other exercises
              setAnalysisMessage(`${exerciseType} analyzed successfully! Duration: ${data.duration?.toFixed(2) || 0} seconds`)
            }

            // Show appropriate message based on whether treasure was earned
            if (data.treasureEarned) {
              // For plank exercises, don't auto-complete - user must click Complete button
              if (exerciseType === 'plank') {
                // Just show the analysis results and let the user complete via button
                // Don't show reward popup here, it will be shown when user clicks Complete
                setIsLoading(false);
                setSelectedVideo(null);
              } else {
                // For non-plank exercises, use the original auto-complete behavior
                // Show success message and reward
                setCurrentReward(tasks[currentTaskIndex].reward)
                setShowRewardsPopup(true)
                
                // Complete task immediately when treasure is earned
                onCompleteTask(tasks[currentTaskIndex].id)
                
                // Keep reward popup visible for a moment
                setTimeout(() => {
                  setShowRewardsPopup(false)
                  setCurrentReward(null)
                  
                  // Clear states
                  setIsLoading(false)
                  setSelectedVideo(null)
                  setAnalysisMessage("")
                  
                  // For plank exercise
                  if (exerciseType === 'plank') {
                    setIsPlankVideoPlaying(false)
                    setActivePlankTask(null)
                    setPlankAnalysis(null)
                  }
                }, 3000)
              }
            } else {
              // For plank exercises with failed analysis, don't show generic failure popup
              if (exerciseType === 'plank') {
                // Just show the analysis results and let the user try again via button
                setIsLoading(false);
                setSelectedVideo(null);
              } else {
                // For non-plank exercises, show failure popup
                // Show attempt message but DO NOT complete the task
                setShowFailurePopup(true)
                
                // DO NOT complete the task if treasure is not earned
                // onCompleteTask(tasks[currentTaskIndex].id) - removed
                
                setTimeout(() => {
                  setShowFailurePopup(false)
                  
                  // Clear states
                  setIsLoading(false)
                  setSelectedVideo(null)
                  setAnalysisMessage("")
                  
                  // For plank exercise
                  if (exerciseType === 'plank') {
                    setIsPlankVideoPlaying(false)
                    setActivePlankTask(null)
                    setPlankAnalysis(null)
                  }
                }, 3000)
              }
            }
          } else {
            throw new Error(data.message || 'Analysis failed')
          }
        } catch (fetchError) {
          console.error(`Fetch error in ${exerciseType} video upload:`, fetchError)
          setVideoError(`Server error: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}. Please ensure the server is running.`)
          
          // Reset appropriate state based on exercise type
          if (exerciseType === 'plank') {
            setIsPlankVideoPlaying(false)
            setActivePlankTask(null)
          }
        }
      } catch (error) {
        console.error(`Error in exercise video upload:`, error)
        setVideoError(error instanceof Error ? error.message : 'Failed to process video')
        
        // Reset appropriate state based on exercise type
        setIsPlankVideoPlaying(false)
        setActivePlankTask(null)
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleStartTask = async (task: Task) => {
    if (task.category.toLowerCase() === "walk") {
      try {
        setIsLoading(true);
        console.log("Starting walking task...");
        setVideoError(null);
        setShowVideoUpload(true);
      } catch (error) {
        console.error("Task start error:", error);
        setVideoError("Failed to start walking task");
        setShowVideoUpload(false);
      } finally {
        setIsLoading(false);
      }
    } else if (task.category.toLowerCase() === "meditation") {
      try {
        setIsLoading(true);
        console.log("Starting meditation task...");
        setVideoError(null);
        setIsVideoPlaying(true);
        setIsAudioPlaying(true);
        setActiveVideoTask(task.id);
      } catch (error) {
        console.error("Task start error:", error);
        setVideoError("Failed to start meditation");
        setIsVideoPlaying(false);
        setIsAudioPlaying(false);
        setActiveVideoTask(null);
      } finally {
        setIsLoading(false);
      }
    } else if (task.category.toLowerCase() === "hydration") {
      try {
        setIsLoading(true);
        console.log("Starting hydration task...");
        setVideoError(null);
        setIsHydrationVideoPlaying(true);
        setActiveHydrationTask(task.id);
      } catch (error) {
        console.error("Task start error:", error);
        setVideoError("Failed to start hydration task");
        setIsHydrationVideoPlaying(false);
        setActiveHydrationTask(null);
      } finally {
        setIsLoading(false);
      }
    } else if (task.category.toLowerCase() === "exercise") {
      try {
        setIsLoading(true);
        console.log(`Starting ${task.title} exercise...`);
        setVideoError(null);
        
        // Determine the exercise type
        const title = task.title.toLowerCase();
        if (title.includes("plank")) {
          setShowPlankUpload(true);
        } else if (title.includes("push-up") || title.includes("pushup")) {
          // Use the video upload component for pushups
          setCurrentExerciseType("pushup");
          setShowExerciseUpload(true);
        } else if (title.includes("squat")) {
          // Use the video upload component for squats
          setCurrentExerciseType("squats");
          setShowExerciseUpload(true);
        } else if (title.includes("bicep curl")) {
          // Use the video upload component for bicep curls
          setCurrentExerciseType("bicepcurls");
          setShowExerciseUpload(true);
        } else {
          // Default fallback - just complete the task
          onCompleteTask(task.id);
        }
      } catch (error) {
        console.error("Task start error:", error);
        setVideoError(`Failed to start ${task.title} exercise`);
        setShowPlankUpload(false);
        setShowExerciseUpload(false);
      } finally {
        setIsLoading(false);
      }
    } else {
      onCompleteTask(task.id);
    }
  };

  const handleHydrationVideoEnd = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    setIsHydrationVideoPlaying(false);
    setActiveHydrationTask(null);
    
    // Show rewards popup for hydration
    if (task && task.category.toLowerCase() === "hydration") {
      setCurrentReward(task.reward);
      setShowRewardsPopup(true);
      setTimeout(() => {
        onCompleteTask(taskId);
        setShowRewardsPopup(false);
        setCurrentReward(null);
      }, 3000);
    }
  };

  const handleWalkingVideoEnd = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    setIsWalkingVideoPlaying(false);
    setActiveWalkingTask(null);
    
    if (task) {
      setCurrentReward(task.reward);
      setShowRewardsPopup(true);
      setTimeout(() => {
        onCompleteTask(taskId);
        setShowRewardsPopup(false);
        setCurrentReward(null);
      }, 3000);
    }
  };

  // Add useEffect for hydration video
  useEffect(() => {
    if (hydrationVideoRef && isHydrationVideoPlaying && activeHydrationTask) {
      const playVideo = async () => {
        try {
          console.log("Attempting to play hydration video");
          hydrationVideoRef.currentTime = 0;
          await hydrationVideoRef.play();
          console.log("Hydration video playing successfully");
        } catch (error) {
          console.error("Error playing hydration video:", error);
          setVideoError("Failed to play hydration video");
          setIsHydrationVideoPlaying(false);
          setActiveHydrationTask(null);
        }
      };
      playVideo();
    }
  }, [hydrationVideoRef, isHydrationVideoPlaying, activeHydrationTask]);

  // Add this useEffect for walking video
  // useEffect(() => {
  //   if (walkingVideoRef && isWalkingVideoPlaying && activeWalkingTask) {
  //     const playVideo = async () => {
  //       try {
  //         console.log("Attempting to play walking video");
  //         walkingVideoRef.currentTime = 0;
  //         await walkingVideoRef.play();
  //         console.log("Walking video playing successfully");
  //       } catch (error) {
  //         console.error("Error playing walking video:", error);
  //         
  //         setIsWalkingVideoPlaying(false);
  //         setActiveWalkingTask(null);
  //       }
  //     };
  //     playVideo();
  //   }
  // }, [walkingVideoRef, isWalkingVideoPlaying, activeWalkingTask]);

  // Add this useEffect for cleanup
  useEffect(() => {
    return () => {
      // Cleanup video URLs when component unmounts
      if (selectedVideo) {
        URL.revokeObjectURL(URL.createObjectURL(selectedVideo))
      }
    }
  }, [selectedVideo])

  // Add this function to clear safety timer
  const clearSafetyTimer = () => {
    try {
      const safetyTimerId = window.sessionStorage.getItem("taskSafetyTimer");
      if (safetyTimerId) {
        clearTimeout(parseInt(safetyTimerId));
        window.sessionStorage.removeItem("taskSafetyTimer");
        console.log("Safety timer cleared from TaskTimeline");
      }
    } catch (error) {
      console.error("Error clearing safety timer:", error);
    }
  };

  // Add this new function to immediately complete treasureEarned exercises and bypass the safety timer
  const directlyCompleteExercise = (data: any) => {
    if (!data || !data.success) return;
    
    try {
      // Only proceed if we have valid data and treasureEarned is true
      if (data.treasureEarned === true) {
        // Get the current task
        const currentTask = tasks[currentTaskIndex];
        
        if (!currentTask) return;
        
        console.log(`Exercise analysis successful with treasureEarned=true. Directly completing task: ${currentTask.title}`);
        
        // Clear any safety timer first - crucial step
        clearSafetyTimer();
        
        // Clear states immediately
        setIsLoading(false);
        setSelectedVideo(null);
        setAnalysisMessage("");
        setShowExerciseUpload(false);
        setShowPlankUpload(false);
        
        // Reset plank specific states if needed
        if (currentExerciseType === 'plank') {
          setIsPlankVideoPlaying(false);
          setActivePlankTask(null);
        }
        
        // Show reward immediately  
        setCurrentReward(currentTask.reward);
        setShowRewardsPopup(true);
        
        // *** FIX: Pass the duration from the analysis data ***
        const duration = data.duration || 0; // Use 0 as fallback if duration is missing
        console.log(`Calling onCompleteTask with duration: ${duration}`);
        onCompleteTask(currentTask.id, duration); // Pass duration here
        
        // Hide reward popup after a moment
        setTimeout(() => {
          setShowRewardsPopup(false);
          setCurrentReward(null);
        }, 3000);
      }
    } catch (error) {
      console.error("Error in directlyCompleteExercise:", error);
      // Attempt to complete anyway as a fallback
      const currentTask = tasks[currentTaskIndex];
      if (currentTask) {
        onCompleteTask(currentTask.id, 0); // Pass 0 duration on error
      }
    }
  };

  return (
    <div className="relative max-w-3xl mx-auto">
      {/* Debug data display for immediate visibility */}
      {plankAnalysis && (
        <div className="mb-6 p-4 bg-black text-white rounded-lg shadow-lg">
          <h3 className="text-lg font-bold mb-2">Last Plank Analysis Data:</h3>
          <pre className="whitespace-pre-wrap break-words text-xs bg-gray-800 text-green-400 p-3 rounded border border-gray-700 max-h-60 overflow-auto">
            {JSON.stringify(plankAnalysis, null, 2)}
          </pre>
        </div>
      )}

      {lastAnalysisData && (
        <div className="mb-6 p-4 bg-black text-white rounded-lg shadow-lg">
          <h3 className="text-lg font-bold mb-2">Last Analysis Data:</h3>
          <pre className="whitespace-pre-wrap break-words text-xs bg-gray-800 text-green-400 p-3 rounded border border-gray-700 max-h-60 overflow-auto">
            {JSON.stringify(lastAnalysisData, null, 2)}
          </pre>
        </div>
      )}

      {/* Central track line */}
      <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-500/50 to-pink-500/50 transform -translate-x-1/2 rounded-full" />

      {/* Train marker (current position) */}
      {currentTaskIndex < tasks.length && (
        <div
          className="absolute left-1/2 w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full transform -translate-x-1/2 z-10 shadow-lg shadow-purple-500/20 flex items-center justify-center"
          style={{
            top: `${(currentTaskIndex / tasks.length) * 100}%`,
            transition: "top 0.5s ease-in-out",
          }}
        >
          <div className="w-2 h-2 bg-white rounded-full" />
        </div>
      )}

      {tasks.map((task, index) => {
        const isCompleted = task.completed
        const isCurrent = index === currentTaskIndex
        const isPending = index > currentTaskIndex

        // Determine status color
        const statusColor = isCompleted
          ? "from-green-500 to-emerald-500"
          : isCurrent
            ? "from-purple-500 to-pink-500"
            : "from-slate-400 to-slate-500"

        // Determine card position (left or right)
        const isLeft = index % 2 === 0

        return (
          <div key={task.id} className="relative mb-16">
            {/* Time indicator before task */}
            {index === 0 && (
              <div
                className={cn(
                  "absolute top-0 text-sm font-medium text-muted-foreground",
                  isLeft ? "left-[calc(50%+1.5rem)]" : "right-[calc(50%+1.5rem)]",
                )}
              >
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{formatTime(task.startTime)}</span>
                </div>
              </div>
            )}

            {/* Task card */}
            <div
              className={cn(
                "relative grid gap-2 p-4 rounded-xl transition-all",
                "bg-card border shadow-lg hover:shadow-xl",
                isCurrent && "ring-2 ring-purple-500/50 animate-pulse-slow",
                isLeft ? "mr-[calc(50%+1rem)] rounded-tr-none" : "ml-[calc(50%+1rem)] rounded-tl-none",
              )}
            >
              {/* Task header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn("p-1.5 rounded-full bg-gradient-to-br", statusColor)}>
                    {getTaskIcon(task.category)}
                  </div>
                  <h3 className="font-semibold">{task.title}</h3>
                </div>
                {/* Corrected right side: Moved span inside the div */}
                <div className="flex items-center gap-1">
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-secondary">{task.category}</span>
                </div>
              </div>

              {/* Task description */}
              <p className="text-sm text-muted-foreground">{task.description}</p>

              {/* Add plank image for plank task */}
              {task.category.toLowerCase() === "exercise" && task.title.toLowerCase() === "plank" && (
                <div className="mt-4 relative rounded-lg overflow-hidden">
                  <video
                    className="w-full rounded-lg"
                    src={`${window.location.origin}/plank.gif`}
                    poster="/plank.gif"
                    playsInline
                  />
                  <Button
                    className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-full shadow-lg"
                    onClick={() => setShowPlankUpload(true)}
                    disabled={isLoading}
                  >
                    Start Plank Exercise
                  </Button>
                </div>
              )}

              {showPlankUpload && !isPlankVideoPlaying && isCurrent && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
                  <div className="p-6 bg-white rounded-lg max-w-sm w-full">
                    <h3 className="text-lg font-medium mb-4 text-center">Upload Plank Video</h3>
                    <p className="text-sm text-gray-600 mb-6 text-center">
                      Upload a video of your plank exercise for analysis.
                    </p>
                    
                    {selectedVideo && (
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-700">Selected: {selectedVideo.name}</p>
                      </div>
                    )}
                    
                    <div className="flex flex-col gap-3">
                      <input
                        id="plankVideoUpload"
                        type="file"
                        accept="video/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setSelectedVideo(file);
                            setVideoError(null);
                          }
                        }}
                        disabled={isLoading}
                      />
                      
                      <Button 
                        onClick={() => document.getElementById('plankVideoUpload')?.click()}
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                        disabled={isLoading}
                      >
                        {isLoading ? "Processing..." : selectedVideo ? "Change Video" : "Select Video"}
                      </Button>
                      
                      {selectedVideo && !isLoading && (
                        <Button 
                          onClick={() => {
                            if (selectedVideo) {
                              handleExerciseVideoUpload({ target: { files: [selectedVideo] } } as any, 'plank', task.title);
                              setShowPlankUpload(false);
                            }
                          }}
                          className="w-full bg-green-500 hover:bg-green-600 text-white"
                        >
                          Upload & Analyze
                        </Button>
                      )}
                      
                      <Button 
                        onClick={() => setShowPlankUpload(false)}
                        className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800"
                        disabled={isLoading}
                      >
                        Cancel
                      </Button>
                    </div>
                    
                    {videoError && (
                      <div className="mt-4 text-red-500 text-sm bg-red-50 border border-red-200 rounded p-3">
                        {videoError}
                      </div>
                    )}
                    
                    {isLoading && (
                      <div className="mt-4 flex items-center justify-center">
                        <div className="animate-spin mr-2">
                          <svg className="w-5 h-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        </div>
                        <p className="text-sm text-blue-700">Analyzing your plank video...</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Plank results display */}
              {task.category.toLowerCase() === "exercise" && task.title.toLowerCase() === "plank" && isPlankVideoPlaying && activePlankTask === task.id && (
                <div className="mt-4 relative rounded-lg overflow-hidden">
                  {videoError && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-2">
                      {videoError}
                    </div>
                  )}
                  
                  {plankAnalysis && (
                    <div className={`p-4 rounded-lg ${plankAnalysis.treasureEarned ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className={`font-medium ${plankAnalysis.treasureEarned ? 'text-green-800' : 'text-red-800'}`}>
                            {plankAnalysis.treasureEarned ? 'Plank Exercise Complete!' : 'Plank Exercise Failed'}
                          </h4>
                          <p className={`text-sm ${plankAnalysis.treasureEarned ? 'text-green-600' : 'text-red-600'}`}>
                            Duration: {plankAnalysis.duration} seconds
                          </p>
                          <p className={`text-sm ${plankAnalysis.treasureEarned ? 'text-green-600' : 'text-red-600'}`}>
                            {plankAnalysis.message}
                          </p>
                        </div>
                        <div className={`h-10 w-10 ${plankAnalysis.treasureEarned ? 'bg-green-100' : 'bg-red-100'} rounded-full flex items-center justify-center`}>
                          {plankAnalysis.treasureEarned ? (
                            <CheckCircle className="h-6 w-6 text-green-500" />
                          ) : (
                            <XCircle className="h-6 w-6 text-red-500" />
                          )}
                        </div>
                      </div>
                      
                      {/* Add explicit complete/try again buttons */}
                      <div className="mt-4">
                        {plankAnalysis.treasureEarned ? (
                          <Button
                            onClick={() => {
                              onCompleteTask(task.id);
                              setIsPlankVideoPlaying(false);
                              setActivePlankTask(null);
                              setPlankAnalysis(null);
                            }}
                            className="w-full bg-green-500 hover:bg-green-600 text-white"
                          >
                            Complete Task & Claim Reward
                          </Button>
                        ) : (
                          <Button
                            onClick={() => {
                              setIsPlankVideoPlaying(false);
                              setActivePlankTask(null);
                              setPlankAnalysis(null);
                              setShowPlankUpload(true);
                            }}
                            className="w-full bg-red-500 hover:bg-red-600 text-white"
                          >
                            Try Again
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Video player for walking tasks */}
              {task.category.toLowerCase() === "walk" && !isWalkingVideoPlaying && isCurrent && (
                <div className="mt-4 relative rounded-lg overflow-hidden">
                  {showVideoUpload ? (
                    <div className="flex flex-col gap-2">
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                        <p className="text-sm text-blue-700">
                          Upload a video of your walking exercise. 
                          The system will analyze your movement patterns.
                        </p>
                      </div>

                      {/* Show video preview if a file is selected */}
                      {selectedVideo && (
                        <div className="mb-4 relative rounded-lg overflow-hidden">
                          <video 
                            className="w-full rounded-lg"
                            src={URL.createObjectURL(selectedVideo)}
                            controls
                            playsInline
                          />
                          <div className="mt-2 text-sm text-gray-600">
                            Selected: {selectedVideo.name} ({(selectedVideo.size / (1024 * 1024)).toFixed(2)} MB)
                          </div>
                        </div>
                      )}
                      
                      <Button 
                        onClick={() => document.getElementById('videoUpload')?.click()}
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                        disabled={isLoading}
                      >
                        {isLoading ? "Analyzing..." : selectedVideo ? "Change Video" : "Upload Walking Video"}
                      </Button>
                      
                      {selectedVideo && !isLoading && (
                        <Button 
                          onClick={() => {
                            if (selectedVideo) {
                              handleExerciseVideoUpload({ target: { files: [selectedVideo] } } as any, 'walking', task.title)
                            }
                          }}
                          className="w-full bg-green-500 hover:bg-green-600 text-white mt-2"
                        >
                          Analyze Walking Video
                        </Button>
                      )}
                      
                      <input
                        id="videoUpload"
                        type="file"
                        accept="video/*"
                        className="hidden"
                        onChange={(e) => {
                          // Just set the file without starting upload
                          const file = e.target.files?.[0]
                          if (file) {
                            setSelectedVideo(file)
                            setVideoError(null)
                          }
                        }}
                        disabled={isLoading}
                      />
                      
                      {task.category.toLowerCase() === "walk" && isWalkingVideoPlaying && activeWalkingTask === task.id && (
                        <div className="mt-4 relative rounded-lg overflow-hidden">
                          {videoError && (
                            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-2">
                              {videoError}
                            </div>
                          )}
                          {(walkingPercentage ?? 0) < 35 && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-medium text-red-800">Task Failed!</h4>
                                  <p className="text-sm text-red-600">
                                    You failed the morning walk task. Please try again.
                                  </p>
                                </div>
                                <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center">
                                  <XCircle className="h-6 w-6 text-red-500" />
                                </div>
                              </div>
                            </div>
                          )}
                          {( walkingPercentage ?? 0 ) >= 35 && (
                            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-medium text-green-800">Task Completed!</h4>
                                  <p className="text-sm text-green-600">
                                    Great job! You've completed your morning walk.
                                  </p>
                                </div>
                                <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                                  <CheckCircle className="h-6 w-6 text-green-500" />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {videoError && (
                        <div className="text-red-500 text-sm mt-1 bg-red-50 border border-red-200 rounded px-4 py-2">
                          {videoError}
                        </div>
                      )}
                      
                      {isLoading && (
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mt-4 flex items-center">
                          <div className="animate-spin mr-2">
                            <svg className="w-5 h-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          </div>
                          <p className="text-sm text-blue-700">Analyzing your walking video... Please wait.</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                        <p>Upload a video to analyze your walking progress.</p>
                    </div>
                  )}
                </div>
              )}

               {/* Video player for meditation tasks */}
               {task.category.toLowerCase() === "meditation" && !isVideoPlaying && isCurrent && (
                <div className="mt-4 relative rounded-lg overflow-hidden">
                  <video
                    className="w-full rounded-lg"
                    src="https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4"
                    poster="/meditation.png"
                    playsInline
                  />
                </div>
              )}

              {task.category.toLowerCase() === "meditation" && isVideoPlaying && activeVideoTask === task.id && (
                <div className="mt-4 relative rounded-lg overflow-hidden">
                  {videoError && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-2">
                      {videoError}
                    </div>
                  )}
                  <audio
                    ref={setAudioRef}
                    src={`${window.location.origin}/relaxing-music.mp3`}
                    preload="auto"
                    loop={false}
                    onError={(e) => {
                      console.error("Audio error event:", e);
                      setVideoError("Error playing audio");
                    }}
                  />
                  <video
                    ref={setVideoRef}
                    className="w-full rounded-lg"
                    src={`${window.location.origin}/meditation.mp4`}
                    controls={false}
                    playsInline
                    muted={false}
                    autoPlay
                    preload="auto"
                    onLoadStart={() => console.log("Meditation video load started")}
                    onLoadedData={() => console.log("Meditation video data loaded")}
                    onPlay={() => console.log("Meditation video play event")}
                    onPlaying={() => console.log("Meditation video playing event")}
                    onEnded={() => {
                      console.log("Meditation video ended");
                      handleVideoEnd(task.id);
                    }}
                    onError={(e) => {
                      console.error("Meditation video error event:", e);
                      setVideoError("Error playing meditation video");
                    }}
                    style={{ pointerEvents: 'none' }}
                  />
                </div>
              )}

              {/* Video player for hydration tasks */}
              {task.category.toLowerCase() === "hydration" && !isHydrationVideoPlaying && isCurrent && (
                <div className="mt-4 relative rounded-lg overflow-hidden">
                  <video
                    className="w-full rounded-lg"
                    src={`${window.location.origin}/hydration-preview.mp4`}
                    poster="/hydrate.png"
                    playsInline
                  />
                </div>
              )}

              {task.category.toLowerCase() === "hydration" && isHydrationVideoPlaying && activeHydrationTask === task.id && (
                <div className="mt-4 relative rounded-lg overflow-hidden">
                  {videoError && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-2">
                      {videoError}
                    </div>
                  )}
                  <video
                    ref={setHydrationVideoRef}
                    className="w-full rounded-lg"
                    src={`${window.location.origin}/hydration.mp4`}
                    controls={false}
                    playsInline
                    muted={false}
                    autoPlay
                    preload="auto"
                    onLoadStart={() => console.log("Hydration video load started")}
                    onLoadedData={() => console.log("Hydration video data loaded")}
                    onPlay={() => console.log("Hydration video play event")}
                    onPlaying={() => console.log("Hydration video playing event")}
                    onEnded={() => {
                      console.log("Hydration video ended");
                      handleHydrationVideoEnd(task.id);
                    }}
                    onError={(e) => {
                      console.error("Hydration video error event:", e);
                      setVideoError("Error playing hydration video");
                    }}
                    style={{ pointerEvents: 'none' }}
                  />
                </div>
              )}

              {/* Video upload for exercise tasks */}
              {task.category.toLowerCase() === "exercise" && 
               !isPlankVideoPlaying && 
               isCurrent && 
               task.title.toLowerCase() !== "plank" && (
                <div className="mt-4 relative rounded-lg overflow-hidden">
                  {showExerciseUpload && currentExerciseType && (
                    <div className="flex flex-col gap-2">
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                        <p className="text-sm text-blue-700">
                          Upload a video of you performing the {task.title} exercise. 
                          The system will analyze your form and technique.
                        </p>
                      </div>
                      
                      {/* Show video preview if a file is selected */}
                      {selectedVideo && (
                        <div className="mb-4 relative rounded-lg overflow-hidden">
                          <video 
                            className="w-full rounded-lg"
                            src={URL.createObjectURL(selectedVideo)}
                            controls
                            playsInline
                          />
                          <div className="mt-2 text-sm text-gray-600">
                            Selected: {selectedVideo.name} ({(selectedVideo.size / (1024 * 1024)).toFixed(2)} MB)
                          </div>
                        </div>
                      )}
                      
                      <Button 
                        onClick={() => document.getElementById('exerciseVideoUpload')?.click()}
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                        disabled={isLoading}
                      >
                        {isLoading ? "Analyzing..." : selectedVideo ? "Change Video" : `Upload ${task.title} Video`}
                      </Button>
                      
                      {selectedVideo && !isLoading && (
                        <Button 
                          onClick={() => {
                            if (selectedVideo) {
                              handleExerciseVideoUpload(
                                { target: { files: [selectedVideo] } } as any, 
                                currentExerciseType, 
                                task.title
                              );
                            }
                          }}
                          className="w-full bg-green-500 hover:bg-green-600 text-white mt-2"
                        >
                          Analyze Video
                        </Button>
                      )}
                      
                      <input
                        id="exerciseVideoUpload"
                        type="file"
                        accept="video/*"
                        className="hidden"
                        onChange={(e) => {
                          // Just set the file without starting upload
                          const file = e.target.files?.[0]
                          if (file) {
                            setSelectedVideo(file)
                            setVideoError(null)
                          }
                        }}
                        disabled={isLoading}
                      />
                      
                      {videoError && (
                        <div className="text-red-500 text-sm mt-1 bg-red-50 border border-red-200 rounded px-4 py-2">
                          {videoError}
                        </div>
                      )}
                      
                      {analysisMessage && (
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg mt-4">
                          <p className="text-sm text-green-700">{analysisMessage}</p>
                          
                          {/* Add raw data display for other exercise types */}
                          {currentExerciseType && (
                            <div className="mt-4 border border-gray-200 rounded-lg p-3 bg-gray-50">
                              <h5 className="text-sm font-medium mb-2">Raw Analysis Data:</h5>
                              <pre className="text-xs overflow-auto max-h-40 bg-white p-2 rounded border border-gray-200">
                                {/* Get data safely from sessionStorage */}
                                {(() => {
                                  if (typeof window === 'undefined') return "No data available";
                                  const rawData = window.sessionStorage.getItem(`${currentExerciseType}Analysis`);
                                  if (!rawData) return "No detailed data available";
                                  try {
                                    return JSON.stringify(JSON.parse(rawData), null, 2);
                                  } catch {
                                    return rawData;
                                  }
                                })()}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {isLoading && (
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mt-4 flex items-center">
                          <div className="animate-spin mr-2">
                            <svg className="w-5 h-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          </div>
                          <p className="text-sm text-blue-700">Analyzing your exercise video... Please wait.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Task progress */}
              <div className="mt-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium">Progress</span>
                  <span className="text-xs font-medium">{task.progress}%</span>
                </div>
                <Progress
                  value={task.progress}
                  className={cn(
                    "h-2",
                    isCompleted
                      ? "bg-muted [&>div]:bg-gradient-to-r [&>div]:from-green-500 [&>div]:to-emerald-500"
                      : isCurrent
                        ? "bg-muted [&>div]:bg-gradient-to-r [&>div]:from-purple-500 [&>div]:to-pink-500"
                        : "bg-muted [&>div]:bg-slate-400",
                  )}
                />
              </div>

              {/* Reward indicator */}
              <div className="flex items-center gap-2 mt-1">
                <div className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500">
                  Reward: {task.reward}
                </div>
              </div>

              {/* Modified action button */}
              <Button
                className={cn(
                  "mt-2 w-full",
                  isCompleted
                    ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                    : isCurrent
                      ? task.category.toLowerCase() === "walk"
                        ? isLoading
                          ? "Loading..."
                          : isWalkingVideoPlaying && activeWalkingTask === task.id
                            ? "Walking in Progress..."
                            : showVideoUpload
                              ? "bg-gray-400"
                              : "Start Walking"
                        : task.category.toLowerCase() === "meditation"
                          ? isLoading
                            ? "Loading..."
                            : isVideoPlaying && activeVideoTask === task.id
                              ? "Meditation in Progress..."
                              : "Start Meditation"
                          : task.category.toLowerCase() === "hydration"
                            ? isLoading
                              ? "Loading..."
                              : isHydrationVideoPlaying && activeHydrationTask === task.id
                                ? "Hydration in Progress..."
                                : "Start Hydration"
                            : "Upload Video"
                      : "bg-muted text-muted-foreground",
                )}
                disabled={
                  isCompleted || 
                  isPending || 
                  (isVideoPlaying && activeVideoTask === task.id) || 
                  (isHydrationVideoPlaying && activeHydrationTask === task.id) ||
                  (task.category.toLowerCase() === "walk" && showVideoUpload)
                }
                onClick={() => {
                  if (task.category.toLowerCase() !== "walk" && 
                      task.category.toLowerCase() !== "meditation" && 
                      task.category.toLowerCase() !== "hydration") {
                    document.getElementById('videoUpload')?.click();
                  } else {
                    handleStartTask(task);
                  }
                }}
              >
                {isCompleted 
                  ? "Completed" 
                  : isCurrent 
                    ? task.category.toLowerCase() === "walk"
                      ? isLoading
                        ? "Loading..."
                        : isWalkingVideoPlaying && activeWalkingTask === task.id
                          ? "Walking in Progress..."
                          : showVideoUpload
                            ? "Upload Video Active"
                            : "Start Walking"
                    : task.category.toLowerCase() === "meditation"
                      ? isLoading
                        ? "Loading..."
                        : isVideoPlaying && activeVideoTask === task.id
                          ? "Meditation in Progress..."
                          : "Start Meditation"
                      : task.category.toLowerCase() === "hydration"
                        ? isLoading
                          ? "Loading..."
                          : isHydrationVideoPlaying && activeHydrationTask === task.id
                            ? "Hydration in Progress..."
                            : "Start Hydration"
                        : "Upload Video"
                    : "Locked"}
              </Button>

              {/* Hidden file input for video upload */}
              <input
                id="videoUpload"
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => handleExerciseVideoUpload(e, task.category.toLowerCase(), task.title)}
                disabled={isLoading}
              />
            </div>

            {/* Status circle */}
            <div
              className={cn(
                "absolute left-1/2 top-12 w-8 h-8 rounded-full transform -translate-x-1/2 z-10",
                "flex items-center justify-center border-2",
                isCompleted
                  ? "border-green-500 bg-green-500/20"
                  : isCurrent
                    ? "border-purple-500 bg-purple-500/20 animate-pulse"
                    : "border-slate-400 bg-slate-400/20",
              )}
            >
              {isCompleted ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <Circle className={cn("h-5 w-5", isCurrent ? "text-purple-500" : "text-slate-400")} />
              )}
            </div>

            {/* Task number */}
            <div
              className={cn(
                "absolute top-12 text-xs font-bold",
                isLeft ? "left-[calc(50%-3rem)]" : "right-[calc(50%-3rem)]",
              )}
            >
              {index + 1}
            </div>

            {/* Time indicator after task */}
            {index === tasks.length - 1 && (
              <div
                className={cn(
                  "absolute bottom-0 text-sm font-medium text-muted-foreground",
                  isLeft ? "left-[calc(50%+1.5rem)]" : "right-[calc(50%+1.5rem)]",
                )}
              >
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{formatTime(task.endTime)}</span>
                </div>
              </div>
            )}
          </div>
        )
      })}

      {/* Final destination */}
      <div className="relative mt-8 mb-16">
        <div className="absolute left-1/2 transform -translate-x-1/2 -top-4 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center z-10">
          <Trophy className="h-5 w-5 text-white" />
        </div>
        <div className="text-center pt-6 pb-2 px-4 max-w-xs mx-auto rounded-lg bg-card border shadow-md">
          <h3 className="font-semibold">Final Destination</h3>
          <p className="text-sm text-muted-foreground">Complete all tasks to reach your wellness goal!</p>
        </div>
      </div>

      {/* Rewards Popup */}
      {showRewardsPopup && currentReward && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 animate-in fade-in slide-in-from-bottom-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full mx-auto flex items-center justify-center mb-4">
                <Trophy className="h-8 w-8 text-yellow-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Congratulations!</h3>
              <p className="text-sm text-gray-600 mb-4">
                {tasks.find(t => t.id === activeVideoTask)?.category === "meditation" && "You've completed your meditation session and earned:"}
                {tasks.find(t => t.id === activeHydrationTask)?.category === "hydration" && "You've completed your hydration task and earned:"}
                {tasks.find(t => t.id === activeWalkingTask)?.category === "walk" && "You've completed your walking task and earned:"}
              </p>
              <div className="bg-amber-100 text-amber-700 px-4 py-2 rounded-full font-medium">
                {currentReward}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Failure Popup */}
      {showFailurePopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 animate-in fade-in slide-in-from-bottom-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full mx-auto flex items-center justify-center mb-4">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-red-600">Task Not Completed</h3>
              <p className="text-sm text-gray-600 mb-4">
                Task did not complete, please try again
              </p>
              <div className="bg-red-100 text-red-700 px-4 py-2 rounded-full font-medium">
                Please try again with better form or longer duration
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

