"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LucideBrain, LucideArrowRight, LucideHistory } from "lucide-react";
import Link from "next/link";

const games = [
  {
    id: "breathe",
    title: "Breathing",
    description: "A calming game to help you relax and practice mindfulness.",
    icon: <LucideBrain size={40} className="text-primary" />,
    link: "Gamification/lets-breathe",
  },
  {
    id: "puzzle",
    title: "puzzle",
    description: "A puzzle game to help you focus.",
    icon: <LucideBrain size={40} className="text-primary" />,
    link: "Gamification/puzzle",
  },
  {
    id: "notes",
    title: "notes",
    description: "A notes game to help you practice mindfulness.",
    icon: <LucideBrain size={40} className="text-primary" />,
    link: "Gamification/notes",
  },
];

export default function GamesPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center bg-background text-foreground">
      <div className="w-full flex items-center justify-between mb-6">
        <h1 className="text-3xl font-semibold gradient-text">Select a Game</h1>
        <Link href="/patient/Gamification/history">
          <Button variant="outline" className="flex items-center gap-2">
            <LucideHistory size={18} />
            Game History
          </Button>
        </Link>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 staggered-fade-in">
        {games.map((game) => (
          <Card
            key={game.id}
            className="feature-card max-w-sm w-full text-center cursor-pointer"
            onClick={() => router.push(game.link)}
          >
            <CardContent className="flex flex-col items-center">
              {game.icon}
              <h2 className="text-xl font-semibold mt-4">{game.title}</h2>
              <p className="text-muted-foreground mt-2">{game.description}</p>
              <Button variant="outline" className="mt-4 flex items-center gap-2">
                Play <LucideArrowRight size={18} />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
