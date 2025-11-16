import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import { Card, CardContent } from "../ui/card"
import { BookOpen, Video, Brain, Heart, Activity, Pill, AlertTriangle } from "lucide-react"

interface Resource {
  title: string;
  type: string;
  duration: string;
  description: string;
  action: {
    label: string;
    url: string;
  };
}

interface LifestyleItem {
  title: string;
  type: string;
  duration: string;
  description: string;
  steps: string[];
}

interface ExerciseItem {
  title: string;
  type: string;
  duration: string;
  description: string;
  routine: string[];
}

interface MindfulnessItem {
  title: string;
  type: string;
  duration: string;
  description: string;
  techniques: string[];
}

interface NaturalRemedy {
  title: string;
  type: string;
  description: string;
  remedies: string[];
  disclaimer: string;
}

interface Wellness {
  lifestyle: LifestyleItem[];
  exercises: ExerciseItem[];
  mindfulness: MindfulnessItem[];
  natural_remedies: NaturalRemedy[];
}

interface Recommendations {
  articles: Resource[];
  videos: Resource[];
  wellness: Wellness;
}

interface RecommendationsProps {
  recommendations?: Recommendations;
  insights?: {
    mainInsight: { [key: string]: number };
    riskAnalysis: {
      low: number;
      moderate: number;
      high: number;
    };
    anxietyTrend: {
      status: "increasing" | "decreasing" | "stable";
      percentage: number;
    };
    stressResponse: {
      status: "improving" | "worsening" | "stable";
      percentage: number;
    };
    moodStability: {
      status: "stable" | "fluctuating";
    };
    risk_factors?: string[];
  };
}

const defaultRecommendations = {
  articles: [
    {
      title: "Understanding Your Mental Health",
      type: "Article",
      duration: "5 min read",
      description: "A comprehensive guide to mental health awareness and self-care practices.",
      action: {
        label: "Read More",
        url: "https://www.mind.org.uk/information-support/",
      },
    },
    {
      title: "Stress Management Techniques",
      type: "Guide",
      duration: "10 min read",
      description: "Learn effective strategies to manage stress in daily life.",
      action: {
        label: "Read More",
        url: "https://www.nhs.uk/mental-health/self-help/guides-tools-and-activities/tips-to-reduce-stress/",
      },
    },
  ],
  videos: [
    {
      title: "Guided Meditation for Beginners",
      type: "Video",
      duration: "10 min",
      description: "A simple guided meditation to help you relax and reduce anxiety.",
      action: {
        label: "Watch Now",
        url: "https://www.youtube.com/results?search_query=guided+meditation+for+beginners",
      },
    },
    {
      title: "Exercise for Mental Health",
      type: "Video",
      duration: "15 min",
      description: "Simple exercises you can do at home to improve your mental well-being.",
      action: {
        label: "Watch Now",
        url: "https://www.youtube.com/results?search_query=exercise+for+mental+health",
      },
    },
  ],
  wellness: {
    lifestyle: [
      {
        title: "Morning Routine for Mental Wellness",
        type: "Routine",
        duration: "30 min",
        description: "Start your day with mindfulness meditation, light stretching, and positive affirmations.",
        steps: [
          "5 min meditation",
          "10 min gentle yoga",
          "5 min journaling",
          "10 min healthy breakfast"
        ]
      },
      {
        title: "Evening Wind-Down Routine",
        type: "Routine",
        duration: "45 min",
        description: "Prepare your mind and body for restful sleep.",
        steps: [
          "Digital device shutdown",
          "Warm bath or shower",
          "Light reading",
          "Relaxation exercises"
        ]
      }
    ],
    exercises: [
      {
        title: "Anxiety-Reducing Exercise Plan",
        type: "Physical",
        duration: "20 min",
        description: "Low-impact exercises designed to reduce anxiety and improve mood.",
        routine: [
          "5 min walking or marching in place",
          "5 min stretching",
          "5 min body-weight exercises",
          "5 min deep breathing"
        ]
      },
      {
        title: "Stress-Relief Yoga Sequence",
        type: "Yoga",
        duration: "15 min",
        description: "Simple yoga poses to release tension and promote relaxation.",
        routine: [
          "Child's pose",
          "Cat-cow stretch",
          "Forward fold",
          "Legs up the wall"
        ]
      }
    ],
    mindfulness: [
      {
        title: "Grounding Techniques",
        type: "Mental",
        duration: "5-10 min",
        description: "Quick exercises to center yourself during anxiety or stress.",
        techniques: [
          "5-4-3-2-1 sensory exercise",
          "Box breathing",
          "Body scan meditation",
          "Progressive muscle relaxation"
        ]
      }
    ],
    natural_remedies: [
      {
        title: "Natural Calm",
        type: "Herbal",
        description: "Natural supplements and herbs known for their calming properties.",
        remedies: [
          "Chamomile tea before bed",
          "Lavender essential oil",
          "Magnesium-rich foods",
          "B-complex vitamins"
        ],
        disclaimer: "Consult healthcare provider before starting any supplement regimen."
      }
    ]
  }
};

export default function Recommendations({ recommendations, insights }: RecommendationsProps) {
  const getPersonalizedRecommendations = () => {
    let personalizedRecs = { ...defaultRecommendations };

    if (insights) {
      // Add anxiety-specific recommendations
      if (insights.anxietyTrend.status === "increasing") {
        personalizedRecs.articles.push({
          title: "Managing Anxiety: A Step-by-Step Guide",
          type: "Guide",
          duration: "8 min read",
          description: "Learn practical techniques to manage increasing anxiety levels.",
          action: {
            label: "Read More",
            url: "https://www.mind.org.uk/information-support/types-of-mental-health-problems/anxiety-and-panic-attacks/",
          },
        });
        personalizedRecs.videos.push({
          title: "Anxiety Relief Breathing Exercises",
          type: "Exercise",
          duration: "5 min",
          description: "Quick breathing techniques to help reduce anxiety symptoms.",
          action: {
            label: "Watch Now",
            url: "https://www.youtube.com/results?search_query=anxiety+relief+breathing+exercises",
          },
        });
      }

      // Add stress-specific recommendations
      if (insights.stressResponse.status === "worsening") {
        personalizedRecs.articles.push({
          title: "Stress Reduction Strategies",
          type: "Guide",
          duration: "7 min read",
          description: "Effective methods to reduce stress and improve well-being.",
          action: {
            label: "Read More",
            url: "https://www.nhs.uk/mental-health/self-help/guides-tools-and-activities/tips-to-reduce-stress/",
          },
        });
      }

      // Add mood stability recommendations
      if (insights.moodStability.status === "fluctuating") {
        personalizedRecs.articles.push({
          title: "Understanding Mood Patterns",
          type: "Article",
          duration: "6 min read",
          description: "Learn about mood fluctuations and how to maintain emotional balance.",
          action: {
            label: "Read More",
            url: "https://www.mind.org.uk/information-support/types-of-mental-health-problems/depression/",
          },
        });
      }

      // Add high-risk recommendations
      if (insights.riskAnalysis.high > 0) {
        personalizedRecs.articles.unshift({
          title: "Crisis Support and Resources",
          type: "Important",
          duration: "5 min read",
          description: "Immediate support resources and crisis helpline information.",
          action: {
            label: "Get Help Now",
            url: "https://www.mind.org.uk/need-urgent-help/",
          },
        });
      }

      // Add personalized exercise recommendations based on anxiety levels
      if (insights.anxietyTrend.status === "increasing") {
        personalizedRecs.wellness.exercises.unshift({
          title: "Anxiety Management Workout",
          type: "Physical",
          duration: "30 min",
          description: "Targeted exercises to reduce anxiety symptoms and promote relaxation.",
          routine: [
            "10 min brisk walking",
            "5 min deep breathing exercises",
            "10 min gentle stretching",
            "5 min mindful cool-down"
          ]
        });
      }

      // Add stress-specific mindfulness practices
      if (insights.stressResponse.status === "worsening") {
        personalizedRecs.wellness.mindfulness.unshift({
          title: "Rapid Stress Relief",
          type: "Mental",
          duration: "10 min",
          description: "Quick techniques for immediate stress reduction.",
          techniques: [
            "4-7-8 breathing technique",
            "Progressive muscle relaxation",
            "Mindful walking",
            "Quick body scan"
          ]
        });
      }

      // Add mood-stabilizing routines
      if (insights.moodStability.status === "fluctuating") {
        personalizedRecs.wellness.lifestyle.unshift({
          title: "Mood Stabilization Routine",
          type: "Routine",
          duration: "Daily practice",
          description: "Daily practices to help stabilize mood fluctuations.",
          steps: [
            "Regular sleep schedule",
            "Mood tracking",
            "Social connection time",
            "Nature exposure"
          ]
        });
      }
    }

    return personalizedRecs;
  };

  const finalRecommendations = recommendations || getPersonalizedRecommendations();

  return (
    <div className="space-y-6">
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
        <div className="flex items-center">
          <AlertTriangle className="h-5 w-5 text-yellow-400 mr-2" />
          <p className="text-sm text-yellow-700">
            <strong>Medical Disclaimer:</strong> These recommendations are generated by AI for informational purposes only. 
            Always consult with healthcare professionals before starting any new treatment or exercise routine.
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <h3 className="font-medium">Articles & Guides</h3>
          </div>
          <div className="mt-4 space-y-3">
            {finalRecommendations.articles.map((article, index) => (
              <div key={index} className="rounded-md border p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{article.title}</p>
                    {article.type === "Important" && (
                      <Badge variant="destructive">Important</Badge>
                    )}
                  </div>
                  <Badge variant="outline">{article.duration}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {article.description}
                </p>
                <Button 
                  variant="link" 
                  className="h-auto p-0 text-xs mt-1"
                  onClick={() => window.open(article.action.url, '_blank')}
                >
                  {article.action.label}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <h3 className="font-medium">Exercise & Movement</h3>
          </div>
          <div className="mt-4 space-y-4">
            {finalRecommendations.wellness.exercises.map((exercise, index) => (
              <div key={index} className="rounded-md border p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{exercise.title}</p>
                    <Badge variant="secondary">{exercise.type}</Badge>
                  </div>
                  <Badge variant="outline">{exercise.duration}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-2">{exercise.description}</p>
                <ul className="list-disc list-inside text-xs space-y-1">
                  {exercise.routine.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2">
            <Pill className="h-5 w-5 text-primary" />
            <h3 className="font-medium">Natural Remedies</h3>
          </div>
          <div className="mt-4 space-y-4">
            {finalRecommendations.wellness.natural_remedies.map((remedy, index) => (
              <div key={index} className="rounded-md border p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{remedy.title}</p>
                    <Badge variant="outline">{remedy.type}</Badge>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mb-2">{remedy.description}</p>
                <ul className="list-disc list-inside text-xs space-y-1">
                  {remedy.remedies.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
                <p className="text-xs text-yellow-600 mt-2 italic">{remedy.disclaimer}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2">
            <Video className="h-5 w-5 text-primary" />
            <h3 className="font-medium">Videos & Exercises</h3>
          </div>
          <div className="mt-4 space-y-3">
            {finalRecommendations.videos.map((video, index) => (
              <div key={index} className="rounded-md border p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{video.title}</p>
                    {video.type === "Exercise" && (
                      <Badge variant="secondary">Exercise</Badge>
                    )}
                  </div>
                  <Badge variant="outline">{video.duration}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {video.description}
                </p>
                <Button 
                  variant="link" 
                  className="h-auto p-0 text-xs mt-1"
                  onClick={() => window.open(video.action.url, '_blank')}
                >
                  {video.action.label}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}