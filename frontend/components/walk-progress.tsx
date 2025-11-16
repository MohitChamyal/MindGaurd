import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Clock, Footprints } from "lucide-react";

interface WalkProgressProps {
  startTime: Date | null;
  stepCount: number;
  targetSteps: number;
  targetMinutes: number;
}

export function WalkProgress({ startTime, stepCount, targetSteps, targetMinutes }: WalkProgressProps) {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (!startTime) {
      setElapsedTime(0);
      return;
    }

    const timer = setInterval(() => {
      const elapsed = (new Date().getTime() - startTime.getTime()) / (1000 * 60); // minutes
      setElapsedTime(elapsed);
    }, 1000);

    return () => clearInterval(timer);
  }, [startTime]);

  const timeProgress = Math.min((elapsedTime / targetMinutes) * 100, 100);
  const stepProgress = Math.min((stepCount / targetSteps) * 100, 100);

  return (
    <Card className="p-4 space-y-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Clock className="h-4 w-4" />
            <span>Time Progress</span>
          </div>
          <span className="text-sm font-medium">
            {Math.floor(elapsedTime)}:{String(Math.floor((elapsedTime % 1) * 60)).padStart(2, "0")} / {targetMinutes}:00
          </span>
        </div>
        <Progress value={timeProgress} className="h-2" />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Footprints className="h-4 w-4" />
            <span>Step Progress</span>
          </div>
          <span className="text-sm font-medium">
            {stepCount} / {targetSteps} steps
          </span>
        </div>
        <Progress value={stepProgress} className="h-2" />
      </div>

      {startTime && (
        <div className="text-center text-sm text-muted-foreground">
          {timeProgress >= 100 && stepProgress >= 100 ? (
            <span className="text-green-500 font-medium">Great job! You can complete the task now.</span>
          ) : (
            <span>Keep going! You're doing great.</span>
          )}
        </div>
      )}
    </Card>
  );
} 