"use client";

import React from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import Image from "next/image";

export function Testimonials() {
  return (
    <section id="testimonials" className="py-20 relative overflow-hidden hidden md:block">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl font-poppins">
            <span className="gradient-text">What Our Users Say</span>
          </h2>
          <p className="mt-4 text-xl text-muted-foreground max-w-3xl mx-auto">
            Real stories from people who have experienced the benefits of MindGuard.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <TestimonialCard 
            quote="MindGuard has been a lifesaver during my most stressful days. The AI chatbot feels like talking to a friend who really understands me."
            name="Sarah J."
            role="College Student"
            avatar="https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            rating={5}
            delay={0.1}
          />
          <TestimonialCard 
            quote="As someone who couldn't afford regular therapy, MindGuard has given me access to mental health support I never thought possible."
            name="Michael T."
            role="Retail Worker"
            avatar="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            rating={5}
            delay={0.2}
          />
          <TestimonialCard 
            quote="The mood tracking feature has helped me identify patterns in my anxiety that I never noticed before. It's been transformative."
            name="Emily R."
            role="Marketing Executive"
            avatar="https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=1961&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            rating={4}
            delay={0.3}
          />
          <TestimonialCard 
            quote="The combination of AI support and occasional sessions with a therapist has been perfect for my needs. It's flexible and effective."
            name="David L."
            role="Software Developer"
            avatar="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            rating={5}
            delay={0.4}
          />
          <TestimonialCard 
            quote="I was skeptical about AI therapy, but MindGuard has proven me wrong. The personalized exercises have helped me manage my depression."
            name="Jessica K."
            role="Teacher"
            avatar="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            rating={5}
            delay={0.5}
          />
          <TestimonialCard 
            quote="Living in a rural area, I had limited access to mental health services. MindGuard has bridged that gap for me and many others."
            name="Robert M."
            role="Farmer"
            avatar="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            rating={4}
            delay={0.6}
          />
        </div>
      </div>
    </section>
  );
}

interface TestimonialCardProps {
  quote: string;
  name: string;
  role: string;
  avatar: string;
  rating: number;
  delay: number;
}

function TestimonialCard({ quote, name, role, avatar, rating, delay }: TestimonialCardProps) {
  return (
    <motion.div 
      className="bg-card rounded-xl p-6 shadow-sm border"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
    >
      <div className="flex space-x-1 mb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star 
            key={i} 
            className={`h-5 w-5 ${i < rating ? 'text-yellow-500 fill-yellow-500' : 'text-muted'}`} 
          />
        ))}
      </div>
      <p className="mb-6 italic">&ldquo;{quote}&rdquo;</p>
      <div className="flex items-center space-x-3">
        <div className="relative w-10 h-10 rounded-full overflow-hidden">
          <Image 
            src={avatar} 
            alt={name} 
            fill
            className="object-cover"
          />
        </div>
        <div>
          <h4 className="font-semibold">{name}</h4>
          <p className="text-sm text-muted-foreground">{role}</p>
        </div>
      </div>
    </motion.div>
  );
}