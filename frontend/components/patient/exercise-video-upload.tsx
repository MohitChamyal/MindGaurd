"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Upload, CheckCircle, AlertCircle, Activity } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { 
  uploadExerciseVideo,
  uploadPlankVideo, 
  uploadPushupVideo,
  uploadSquatsVideo,
  uploadBicepCurlsVideo 
} from "@/lib/api/exercise";
import { Progress } from "@/components/ui/progress";

interface ExerciseVideoUploadProps {
  exerciseType: "plank" | "pushup" | "squats" | "bicepcurls";
  taskId?: string;
  taskTitle?: string;
  onExerciseComplete: (duration: number) => void;
  onExerciseError: (error: string) => void;
  disabled?: boolean;
}

export function ExerciseVideoUpload({
  exerciseType,
  taskId,
  taskTitle,
  onExerciseComplete,
  onExerciseError,
  disabled = false,
}: ExerciseVideoUploadProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [uploadStartTime, setUploadStartTime] = useState<number | null>(null);
  const [uploadTimer, setUploadTimer] = useState<NodeJS.Timeout | null>(null);
  const [wellnessScore, setWellnessScore] = useState<number>(0);
  const [wellnessMessage, setWellnessMessage] = useState<string>("");

  // Log task information on mount for debugging
  useEffect(() => {
    if (taskId) {
      console.log(`ExerciseVideoUpload mounted for task ID: ${taskId}, type: ${exerciseType}, title: ${taskTitle || 'unknown'}`);
    }
  }, [taskId, exerciseType, taskTitle]);

  // Add a safety timeout to auto-complete exercise if backend takes too long
  useEffect(() => {
    if (uploadStatus === "uploading" && !uploadTimer) {
      const startTime = Date.now();
      setUploadStartTime(startTime);
      
      // Set a timeout to auto-complete after 30 seconds
      const timer = setTimeout(() => {
        // Only trigger fallback if still uploading after 30 seconds
        if (uploadStatus === "uploading") {
          console.log("Upload timeout reached - triggering fallback completion");
          setUploadStatus("success");
          onExerciseComplete(10); // Default 10 second duration as fallback
          
          toast({
            title: "Exercise Recorded",
            description: "The analysis is taking longer than expected, but we've recorded your exercise.",
          });
        }
      }, 30000);
      
      setUploadTimer(timer);
      
      return () => {
        if (uploadTimer) {
          clearTimeout(uploadTimer);
        }
      };
    }
  }, [uploadStatus, uploadTimer, onExerciseComplete, toast]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (uploadTimer) {
        clearTimeout(uploadTimer);
      }
    };
  }, [uploadTimer]);

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("video/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload a video file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 100MB)
    if (file.size > 100 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Video must be less than 100MB.",
        variant: "destructive",
      });
      return;
    }

    // Create a unique ID for this upload attempt
    const uploadId = `upload-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    setIsUploading(true);
    setUploadStatus("uploading");
    setUploadStartTime(Date.now());

    try {
      // Use the specific API function based on the exercise type
      let result;
      
      // Log context information for debugging
      console.log(`Starting ${exerciseType} video upload for task ID: ${taskId || 'unknown'}...`, file);
      
      // Store this upload attempt in session storage to prevent duplicate processing
      sessionStorage.setItem('lastExerciseUpload', uploadId);
      
      // Standardize exercise type to ensure consistent API calls
      const normalizedExerciseType = exerciseType.toLowerCase().trim();
      
      switch (normalizedExerciseType) {
        case 'plank':
          result = await uploadPlankVideo(file);
          break;
        case 'pushup':
          result = await uploadPushupVideo(file);
          break;
        case 'squats':
          result = await uploadSquatsVideo(file);
          break;
        case 'bicepcurls':
          result = await uploadBicepCurlsVideo(file);
          break;
        default:
          // Fallback to generic function - should not happen with typed props
          console.warn(`No specific API for exercise type "${exerciseType}", using generic upload`);
          result = await uploadExerciseVideo(exerciseType, file);
      }

      // Double-check this is still the active upload attempt
      if (sessionStorage.getItem('lastExerciseUpload') !== uploadId) {
        console.log('Upload superseded by another upload, ignoring results');
        return;
      }

      // Clear the upload timer since we got a response
      if (uploadTimer) {
        clearTimeout(uploadTimer);
        setUploadTimer(null);
      }

      if (!result.success) {
        throw new Error(result.message || "Failed to upload video");
      }

      // Log the response from backend, particularly focusing on treasure
      console.log(`${exerciseType} analysis results:`, result);

      // Important: If treasure is earned, immediately clear the safety timer
      if (result.treasureEarned === true) {
        console.log(`Exercise treasureEarned=true detected in ExerciseVideoUpload. Clearing safety timer immediately.`);
        // Clear any existing safety timer - this is crucial and we need multiple layers
        // of protection to ensure it doesn't fire incorrectly
        const safetyTimerId = window.sessionStorage.getItem("taskSafetyTimer");
        if (safetyTimerId) {
          clearTimeout(parseInt(safetyTimerId));
          window.sessionStorage.removeItem("taskSafetyTimer");
          console.log("Safety timer cleared from ExerciseVideoUpload component due to treasureEarned=true");
          // Also clear any task completion ID to prevent racing
          window.sessionStorage.removeItem("currentTaskCompletionId");
        }
      }

      // Set states before calling callbacks to avoid race conditions
      setUploadStatus("success");
      setWellnessScore(result.wellnessScore || 0);
      setWellnessMessage(result.wellnessMessage || '');
      
      toast({
        title: result.treasureEarned ? "Exercise Completed!" : "Exercise Analyzed",
        description: result.wellnessMessage || 
          `You maintained the ${exerciseType} for ${result.duration?.toFixed(2) || "0"} seconds.`,
      });
      
      // Explicitly log that we're calling the completion handler
      console.log(`Calling onExerciseComplete with duration: ${result.duration || 0}`);
      
      // Create a delay to ensure the UI updates with success state first
      setTimeout(() => {
        // Call the onExerciseComplete callback with the duration
        // This will trigger task completion in the parent component
        onExerciseComplete(result.duration || 0);
      }, 100);
    } catch (error) {
      // Double-check this is still the active upload attempt
      if (sessionStorage.getItem('lastExerciseUpload') !== uploadId) {
        console.log('Upload superseded by another upload, ignoring error');
        return;
      }
      
      // Clear the upload timer
      if (uploadTimer) {
        clearTimeout(uploadTimer);
        setUploadTimer(null);
      }
      
      // Calculate how long we've been trying
      const uploadDuration = uploadStartTime ? (Date.now() - uploadStartTime) / 1000 : 0;
      
      // If we've been trying for more than 15 seconds, consider it a partial success for UX reasons
      if (uploadDuration > 15) {
        setUploadStatus("success");
        
        toast({
          title: "Exercise Recorded",
          description: "There was an issue with the analysis, but we've recorded your exercise.",
        });
        
        console.log("Calling onExerciseComplete with fallback duration due to error after long attempt");
        setTimeout(() => {
          onExerciseComplete(5); // Default 5 second duration as fallback
        }, 100);
      } else {
        setUploadStatus("error");
        const errorMsg = error instanceof Error ? error.message : "An unknown error occurred";
        setErrorMessage(errorMsg);
        
        console.error(`Error in handleFileChange: ${errorMsg}`);
        onExerciseError(errorMsg);
        
        toast({
          title: "Analysis failed",
          description: errorMsg,
          variant: "destructive",
        });
      }
    } finally {
      setIsUploading(false);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <Card className="p-4">
      <div className="flex flex-col items-center space-y-4">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="video/*"
          className="hidden"
          disabled={disabled || isUploading}
        />
        
        {uploadStatus === "idle" && (
          <Button 
            onClick={handleButtonClick} 
            disabled={disabled || isUploading}
            className="w-full"
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload {exerciseType.charAt(0).toUpperCase() + exerciseType.slice(1)} Video
          </Button>
        )}
        
        {uploadStatus === "uploading" && (
          <div className="flex flex-col items-center space-y-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p>Analyzing your {exerciseType} exercise...</p>
            <p className="text-xs text-muted-foreground">This may take up to 30 seconds.</p>
          </div>
        )}
        
        {uploadStatus === "success" && (
          <div className="flex flex-col items-center space-y-2 w-full">
            <div className="text-green-500 flex items-center">
              <CheckCircle className="h-6 w-6 mr-2" />
              <p className="font-medium">Exercise analysis complete!</p>
            </div>
            
            {wellnessScore > 0 && (
              <div className="w-full px-4 py-3 bg-blue-50 rounded-lg mt-2">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="h-5 w-5 text-blue-500" />
                  <h4 className="font-medium text-blue-700">Wellness Impact</h4>
                </div>
                <p className="text-sm text-blue-600 mb-2">{wellnessMessage}</p>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Score</span>
                    <span className="font-medium">{wellnessScore}/100</span>
                  </div>
                  <Progress 
                    value={wellnessScore} 
                    className="h-2 bg-blue-100" 
                    indicatorClassName={`${
                      wellnessScore > 70 ? 'bg-green-500' :
                      wellnessScore > 40 ? 'bg-blue-500' : 'bg-orange-500'
                    }`}
                  />
                </div>
              </div>
            )}
            
            <Button 
              onClick={() => {
                setUploadStatus("idle");
                setWellnessScore(0);
                setWellnessMessage('');
              }}
              variant="outline"
              size="sm"
              className="mt-2"
            >
              Upload Another Video
            </Button>
          </div>
        )}
        
        {uploadStatus === "error" && (
          <div className="flex flex-col items-center space-y-2 text-red-500">
            <AlertCircle className="h-8 w-8" />
            <p>{errorMessage || "Failed to analyze video"}</p>
            <Button 
              onClick={() => setUploadStatus("idle")}
              variant="outline"
              size="sm"
            >
              Try Again
            </Button>
            <Button
              onClick={() => {
                setUploadStatus("success");
                setWellnessScore(30); // Default score
                setWellnessMessage(`Exercise recorded (estimated score)`);
                onExerciseComplete(5); // Default duration
              }}
              variant="default"
              size="sm"
              className="mt-2"
            >
              Skip Analysis & Complete Exercise
            </Button>
          </div>
        )}
        
        <p className="text-xs text-muted-foreground text-center">
          Upload a video of you performing the {exerciseType} exercise. 
          The system will analyze your form and duration.
        </p>
      </div>
    </Card>
  );
}