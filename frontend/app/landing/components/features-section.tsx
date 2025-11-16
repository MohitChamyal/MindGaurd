"use client";

import React from "react";
import { motion } from "framer-motion";
import { 
  MessageSquare, 
  BarChart3, 
  Users, 
  Sparkles, 
  Trophy, 
  Brain, 
  Music, 
  Calendar, 
  Heart 
} from "lucide-react";

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 relative overflow-hidden">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl font-poppins">
            <span className="gradient-text">Key Features</span>
          </h2>
          <p className="mt-4 text-xl text-muted-foreground max-w-3xl mx-auto">
            MindGuard combines AI technology with proven therapeutic approaches to provide comprehensive mental health support.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <FeatureCard 
            icon={<MessageSquare className="h-8 w-8 text-primary" />}
            title="24/7 AI Chatbot Support"
            description="AI-driven virtual assistant for real-time emotional support using Sentiment Analysis & NLP to understand your moods."
            delay={0.1}
          />
          <FeatureCard 
            icon={<BarChart3 className="h-8 w-8 text-primary" />}
            title="Mood Tracking & Insights"
            description="AI dynamically analyzes mood patterns and suggests improvements based on your historical data."
            delay={0.2}
          />
          <FeatureCard 
            icon={<Users className="h-8 w-8 text-primary" />}
            title="Hybrid Human + AI Therapy"
            description="Connect with licensed therapists for one-on-one consultations with AI assistance for personalized strategies."
            delay={0.3}
          />
          <FeatureCard 
            icon={<Sparkles className="h-8 w-8 text-primary" />}
            title="Guided Mood Exercises"
            description="Mindfulness, breathing exercises, and journaling prompts to manage anxiety with personalized well-being plans."
            delay={0.4}
          />
          <FeatureCard 
            icon={<Trophy className="h-8 w-8 text-primary" />}
            title="Gamified Engagement"
            description="Earn achievement badges, streak points, and daily mental health scores to encourage consistent engagement."
            delay={0.5}
          />
          <FeatureCard 
            icon={<Brain className="h-8 w-8 text-primary" />}
            title="CBT Guidance"
            description="AI-driven Cognitive Behavioral Therapy programs to help reframe negative thoughts with self-paced exercises."
            delay={0.6}
          />
          <FeatureCard 
            icon={<Music className="h-8 w-8 text-primary" />}
            title="AI-Powered Music Therapy"
            description="AI curates playlists, binaural beats, and guided meditation tracks tailored for stress relief and relaxation."
            delay={0.7}
          />
          <FeatureCard 
            icon={<Calendar className="h-8 w-8 text-primary" />}
            title="Professional Consultation"
            description="Schedule virtual therapy with licensed mental health professionals with AI-assisted analysis."
            delay={0.8}
          />
          <FeatureCard 
            icon={<Heart className="h-8 w-8 text-primary" />}
            title="Community & NGO Support"
            description="Join anonymous support groups and connect with mental health NGOs in a safe, AI-moderated environment."
            delay={0.9}
          />
        </div>
      </div>
    </section>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: number;
}

function FeatureCard({ icon, title, description, delay }: FeatureCardProps) {
  return (
    <motion.div 
      className="feature-card"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
    >
      <div className="mb-4 p-3 bg-primary/10 rounded-full inline-block">{icon}</div>
      <h3 className="text-xl font-bold mb-2 font-poppins">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </motion.div>
  );
}