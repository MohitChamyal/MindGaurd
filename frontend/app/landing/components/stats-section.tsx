"use client";

import React from "react";
import { motion } from "framer-motion";
import { Brain, Users, Clock, DollarSign } from "lucide-react";

export function StatsSection() {
  return (
    <section className="py-12 bg-muted/50">
      <div className="container px-4 md:px-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard 
            icon={<Users className="h-8 w-8 text-primary" />}
            value="970M+"
            label="People globally suffering from mental disorders"
            delay={0.1}
          />
          <StatCard 
            icon={<Brain className="h-8 w-8 text-primary" />}
            value="1 in 6"
            label="People affected by anxiety & depression"
            delay={0.2}
          />
          <StatCard 
            icon={<Clock className="h-8 w-8 text-primary" />}
            value="10-20"
            label="Years of reduced life expectancy"
            delay={0.3}
          />
          <StatCard 
            icon={<DollarSign className="h-8 w-8 text-primary" />}
            value="$100-300"
            label="Average cost per therapy session"
            delay={0.4}
          />
        </div>
      </div>
    </section>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  value: string;
  label: string;
  delay: number;
}

function StatCard({ icon, value, label, delay }: StatCardProps) {
  return (
    <motion.div 
      className="flex flex-col items-center text-center p-6 bg-card rounded-lg shadow-sm border"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
    >
      <div className="mb-4 p-3 bg-primary/10 rounded-full">{icon}</div>
      <h3 className="text-3xl font-bold mb-2 font-poppins">{value}</h3>
      <p className="text-muted-foreground">{label}</p>
    </motion.div>
  );
}