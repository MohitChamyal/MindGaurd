import axios from 'axios';

export interface HealthQuestionnaireData {
  user_id?: string;
  mood: number;
  anxiety: string;
  sleep_quality: number;
  self_care: string;
  stress_factors: string;
}

export interface HealthAnalysisResponse {
  insights: {
    mainInsight: string;
    riskAnalysis: {
      low: number;
      moderate: number;
      high: number;
    };
    anxietyTrend: {
      status: 'increasing' | 'decreasing' | 'stable';
      percentage: number;
      detail: string;
    };
    stressResponse: {
      status: 'improving' | 'worsening' | 'stable';
      percentage: number;
      detail: string;
    };
    moodStability: {
      status: 'stable' | 'fluctuating';
      detail: string;
    };
    patterns: string[];
  };
  progress: {
    moodData: Array<{
      date: string;
      mood: number;
      anxiety: number;
      stress: number;
    }>;
    sleepData: Array<{
      date: string;
      hours: number;
      quality: number;
    }>;
    activityData: Array<{
      date: string;
      exercise: number;
      meditation: number;
      social: number;
    }>;
    summary: {
      mood: { change: number };
      anxiety: { change: number };
      stress: { change: number };
      sleep: { durationChange: number; qualityChange: number };
      activities: {
        exerciseChange: number;
        meditationChange: number;
        socialChange: number;
      };
    };
  };
  recommendations: {
    articles: Array<{
      title: string;
      type: string;
      duration: string;
      description: string;
      action: {
        label: string;
        url: string;
      };
    }>;
    videos: Array<{
      title: string;
      type: string;
      duration: string;
      description: string;
      action: {
        label: string;
        url: string;
      };
    }>;
  };
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const healthTrackingService = {
  async submitQuestionnaire(data: HealthQuestionnaireData): Promise<HealthAnalysisResponse> {
    try {
      const response = await axios.post(`${API_BASE_URL}/health-tracking`, {
        user_id: localStorage.getItem('mindguard_user_id'),
        ...data
      });
      return response.data;
    } catch (error) {
      console.error('Error submitting health questionnaire:', error);
      throw error;
    }
  },

  async getHealthHistory(userId: string): Promise<HealthAnalysisResponse> {
    try {
      const response = await axios.get(`${API_BASE_URL}/health-history/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching health history:', error);
      throw error;
    }
  }
}; 