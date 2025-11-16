"use client";

import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function FaqSection() {
  return (
    <section id="faq" className="py-20 bg-muted/30">
      <div className="container px-4 md:px-6 max-w-4xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl font-poppins">
            <span className="gradient-text">Frequently Asked Questions</span>
          </h2>
          <p className="mt-4 text-xl text-muted-foreground">
            Find answers to common questions about MindGuard.
          </p>
        </div>
        
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger className="text-left font-medium">
              How does MindGuard's AI chatbot work?
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              MindGuard's AI chatbot uses Natural Language Processing (NLP) and sentiment analysis to understand your emotional state and provide appropriate responses. It's trained on therapeutic techniques like Cognitive Behavioral Therapy (CBT) to offer evidence-based support.
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-2">
            <AccordionTrigger className="text-left font-medium">
              Is my data secure and private?
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              Yes, we take your privacy seriously. All conversations are encrypted, and your personal data is never shared with third parties. You can also choose to anonymize your data for the AI training process or opt out entirely.
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-3">
            <AccordionTrigger className="text-left font-medium">
              Can MindGuard replace traditional therapy?
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              MindGuard is designed to complement traditional therapy, not replace it. While our AI can provide support for mild to moderate mental health concerns, we recommend consulting with a licensed therapist for severe conditions. Our platform also offers connections to professional therapists when needed.
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-4">
            <AccordionTrigger className="text-left font-medium">
              How much does MindGuard cost?
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              MindGuard offers a free basic plan with limited features. Our premium plans start at $9.99/month, which includes unlimited AI chat support, mood tracking, and guided exercises. Therapy sessions with licensed professionals are available at additional costs, but still significantly lower than traditional therapy.
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-5">
            <AccordionTrigger className="text-left font-medium">
              How does the mood tracking feature work?
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              Our mood tracking feature allows you to log your emotional state daily. The AI analyzes these entries over time to identify patterns and triggers. Based on this analysis, MindGuard provides personalized insights and recommendations to help improve your mental well-being.
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-6">
            <AccordionTrigger className="text-left font-medium">
              Is MindGuard available worldwide?
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              Yes, MindGuard is available globally. Our AI chatbot supports multiple languages, and we're continuously adding more. However, therapist availability may vary by region and language.
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-7">
            <AccordionTrigger className="text-left font-medium">
              How do I become a therapist on MindGuard?
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              Licensed mental health professionals can apply to join our platform through the "Register as a Doctor" option in the footer. We verify credentials and provide training on our hybrid AI-human therapy model before onboarding.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </section>
  );
}