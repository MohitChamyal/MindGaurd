export interface Task {
  id: string
  title: string
  description: string
  category: string
  startTime: string
  endTime: string
  duration: number
  reward: string
  completed: boolean
  progress: number
}

export interface UserStats {
  points: number
  streak: number
  lastCompletedDate: string | null
}

