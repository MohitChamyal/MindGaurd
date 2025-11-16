"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { 
  MessageSquare, 
  BarChart3, 
  Brain, 
  Database, 
  Sparkles, 
  LineChart 
} from "lucide-react";

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 bg-muted/30 relative overflow-hidden">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl font-poppins">
            <span className="gradient-text">How MindGuard Works</span>
          </h2>
          <p className="mt-4 text-xl text-muted-foreground max-w-3xl mx-auto">
            Our AI-powered platform uses advanced technology to provide personalized mental health support.
          </p>
        </div>
        
        <div className="grid gap-12 md:gap-16">
          <WorkflowStep 
            number={1}
            title="User Interaction"
            description="Start a conversation with our AI chatbot about how you're feeling or what's on your mind."
            icon={<MessageSquare className="h-10 w-10 text-primary" />}
            image="https://images.unsplash.com/photo-1565895405138-6c3a1555da6a?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            imageAlt="Person chatting with AI assistant"
            reverse={false}
          />
          
          <WorkflowStep 
            number={2}
            title="AI Processing"
            description="Our AI analyzes your input using Natural Language Processing to understand your emotional state and needs."
            icon={<Brain className="h-10 w-10 text-primary" />}
            image="https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            imageAlt="AI processing visualization"
            reverse={true}
          />
          
          <WorkflowStep 
            number={3}
            title="Backend Processing"
            description="Your data is securely processed and stored, with our system handling requests and preparing personalized responses."
            icon={<Database className="h-10 w-10 text-primary" />}
            image="https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=2034&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            imageAlt="Secure data processing"
            reverse={false}
          />
          
          <WorkflowStep 
            number={4}
            title="Personalized Response"
            description="The AI generates tailored responses, exercises, or recommendations based on your specific situation and history."
            icon={<Sparkles className="h-10 w-10 text-primary" />}
            image="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            imageAlt="Personalized mental health recommendations"
            reverse={true}
          />
          
          <WorkflowStep 
            number={5}
            title="Progress Tracking"
            description="Your mental health journey is continuously tracked, with insights and improvements suggested over time."
            icon={<LineChart className="h-10 w-10 text-primary" />}
            image="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            imageAlt="Mental health progress tracking"
            reverse={false}
          />
          
          <WorkflowStep 
            number={6}
            title="Continuous Improvement"
            description="Our AI learns from your interactions to provide increasingly personalized support tailored to your unique needs."
            icon={<BarChart3 className="h-10 w-10 text-primary" />}
            image="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            imageAlt="AI continuous improvement"
            reverse={true}
          />
        </div>
      </div>
    </section>
  );
}

interface WorkflowStepProps {
  number: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  image: string;
  imageAlt: string;
  reverse: boolean;
}

function WorkflowStep({ number, title, description, icon, image, imageAlt, reverse }: WorkflowStepProps) {
  return (
    <motion.div 
      className={`grid items-center gap-6 ${reverse ? 'md:grid-cols-[1fr_1.5fr]' : 'md:grid-cols-[1.5fr_1fr]'}`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <div className={`space-y-4 ${reverse ? 'md:order-2' : 'md:order-1'}`}>
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold text-xl">
            {number}
          </div>
          <div className="p-2 bg-primary/10 rounded-full">{icon}</div>
        </div>
        <h3 className="text-2xl font-bold font-poppins">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </div>
      <div className={`${reverse ? 'md:order-1' : 'md:order-2'}`}>
        <div className="relative overflow-hidden rounded-xl shadow-lg aspect-video">
          <Image 
            src={image} 
            alt={imageAlt} 
            fill
            className="object-cover transition-transform duration-500 hover:scale-105"
          />
        </div>
      </div>
    </motion.div>
  );
}