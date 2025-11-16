"use client";
import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PuzzlePage() {
  const router = useRouter();
  const [tiles, setTiles] = useState<number[]>([]);
  const [seconds, setSeconds] = useState(0);
  const [moves, setMoves] = useState(0);
  const [complete, setComplete] = useState(false);
  const [difficulty, setDifficulty] = useState<3 | 4 | 5>(3);
  const [start, setStart] = useState(false);
  const [reward, setReward] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionStartTime = useRef(Date.now());
  const [sessionScore, setSessionScore] = useState(0);
  const hasLoggedStart = useRef(false);
  const hasLoggedEnd = useRef(false);
  
  useEffect(() => {
    // Log game start when component mounts, but only once
    if (!hasLoggedStart.current) {
      logGameSession('in-progress');
      hasLoggedStart.current = true;
    }
    
    return () => {
      // Log game abandonment when component unmounts if not completed and not already logged
      if (!complete && !hasLoggedEnd.current) {
        logGameSession('abandoned');
        hasLoggedEnd.current = true;
      }
      
      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (start && !complete) {
      timerRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else if (complete || !start) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [start, complete]);

  useEffect(() => {
    if (tiles.length > 0) {
      // Check if the puzzle is solved
      const checkSolved = () => {
        for (let i = 0; i < tiles.length - 1; i++) {
          if (tiles[i] !== i + 1) {
            return false;
          }
        }
        return tiles[tiles.length - 1] === 0;
      };

      if (checkSolved() && start) {
        setComplete(true);
        // Calculate score based on difficulty, moves, and time
        const newScore = Math.max(
          10, 
          Math.floor((difficulty * 100) - (moves * 2) - (seconds * 0.5))
        );
        setSessionScore(newScore);
        
        // Award a random reward
        const rewards = ["Puzzle Master", "Quick Solver", "Pattern Genius"];
        setReward(rewards[Math.floor(Math.random() * rewards.length)]);
        
        // Log completed game only once
        if (!hasLoggedEnd.current) {
          logGameSession('completed');
          hasLoggedEnd.current = true;
        }
      }
    }
  }, [tiles, start, difficulty, moves, seconds]);

  const startGame = (size: 3 | 4 | 5) => {
    setDifficulty(size);
    setStart(true);
    setComplete(false);
    setSeconds(0);
    setMoves(0);
    setReward(null);
    sessionStartTime.current = Date.now();
    // Reset logging flags for the new game
    hasLoggedStart.current = false;
    hasLoggedEnd.current = false;
    
    // Log start of new game
    logGameSession('in-progress');
    hasLoggedStart.current = true;

    // Generate puzzle
    const totalTiles = size * size;
    let newTiles: number[] = [];

    // Create ordered array
    for (let i = 0; i < totalTiles - 1; i++) {
      newTiles.push(i + 1);
    }
    newTiles.push(0); // Empty tile

    // Shuffle tiles (ensuring it's solvable)
    let solvable = false;
    while (!solvable) {
      shuffleTiles(newTiles);
      solvable = isSolvable(newTiles, size);
    }

    setTiles(newTiles);
  };

  const shuffleTiles = (tilesArray: number[]) => {
    for (let i = tilesArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [tilesArray[i], tilesArray[j]] = [tilesArray[j], tilesArray[i]];
    }
  };

  // Check if puzzle is solvable
  const isSolvable = (tilesArray: number[], size: number): boolean => {
    let inversions = 0;
    let emptyPosition = 0;

    // Find number of inversions
    for (let i = 0; i < tilesArray.length; i++) {
      if (tilesArray[i] === 0) {
        emptyPosition = Math.floor(i / size) + 1; // Row of empty tile (1-indexed)
        continue;
      }

      for (let j = i + 1; j < tilesArray.length; j++) {
        if (tilesArray[j] !== 0 && tilesArray[i] > tilesArray[j]) {
          inversions++;
        }
      }
    }

    // For odd grid size (3x3, 5x5), puzzle is solvable if inversions is even
    if (size % 2 === 1) {
      return inversions % 2 === 0;
    } 
    // For even grid size (4x4), puzzle is solvable if:
    // (inversions odd && empty on even row) || (inversions even && empty on odd row)
    else {
      return (inversions % 2 === 1 && emptyPosition % 2 === 0) || 
             (inversions % 2 === 0 && emptyPosition % 2 === 1);
    }
  };

  const handleTileClick = (index: number) => {
    if (complete) return;

    const emptyIndex = tiles.indexOf(0);
    const size = difficulty;
    
    // Check if tile is adjacent to empty space
    if (
      // Left
      (index % size !== 0 && index - 1 === emptyIndex) ||
      // Right
      (index % size !== size - 1 && index + 1 === emptyIndex) ||
      // Above
      (index - size === emptyIndex) ||
      // Below
      (index + size === emptyIndex)
    ) {
      // Swap tiles
      const newTiles = [...tiles];
      [newTiles[index], newTiles[emptyIndex]] = [newTiles[emptyIndex], newTiles[index]];
      setTiles(newTiles);
      setMoves(moves + 1);
    }
  };
  
  const logGameSession = async (status: 'completed' | 'abandoned' | 'in-progress') => {
    try {
      const userId = localStorage.getItem('mindguard_user_id');
      const token = localStorage.getItem('token');
      
      if (!userId || !token) return;
      
      const duration = Math.floor((Date.now() - sessionStartTime.current) / 1000);
      
      // Don't log 0 duration sessions unless they're in-progress
      if (duration === 0 && status !== 'in-progress') return;
      
      await fetch('/api/gameLogs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({
          userId,
          gameType: 'puzzle',
          duration,
          completionStatus: status,
          score: sessionScore,
          notes: `Puzzle game - ${difficulty}x${difficulty} grid, ${moves} moves`,
          metadata: {
            difficulty,
            moves,
            timeSeconds: seconds,
            reward: reward || 'none'
          }
        }),
      });
    } catch (error) {
      console.error('Failed to log game session:', error);
    }
  };
  
  const handleExit = async () => {
    // Log session as abandoned if not completed and not already logged
    if (!complete && !hasLoggedEnd.current) {
      await logGameSession('abandoned');
      hasLoggedEnd.current = true;
    }
    
    // Return to games selection
    router.push('/patient/Gamification');
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-blue-100 p-6">
      <div className="w-full max-w-md flex justify-between mb-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleExit}
          className="flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          Exit Game
        </Button>
        {sessionScore > 0 && <div className="font-medium">Score: {sessionScore}</div>}
      </div>
    
      <Card className="p-6 max-w-md w-full text-center shadow-lg rounded-2xl bg-white">
        <CardContent>
          <h2 className="text-2xl font-semibold mb-4">Puzzle Game</h2>
          
          {!start ? (
            <div className="space-y-4">
              <p className="text-gray-600 mb-6">Select difficulty level:</p>
              <div className="flex justify-center gap-4">
                <Button onClick={() => startGame(3)}>Easy 3×3</Button>
                <Button onClick={() => startGame(4)}>Medium 4×4</Button>
                <Button onClick={() => startGame(5)}>Hard 5×5</Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex justify-between mb-4">
                <div>Moves: {moves}</div>
                <div>Time: {formatTime(seconds)}</div>
              </div>
              
              <div 
                className="grid gap-1 p-1 bg-blue-50 rounded-lg mb-4" 
                style={{ 
                  gridTemplateColumns: `repeat(${difficulty}, 1fr)`,
                  width: difficulty === 3 ? '240px' : difficulty === 4 ? '280px' : '320px',
                  height: difficulty === 3 ? '240px' : difficulty === 4 ? '280px' : '320px',
                  margin: '0 auto'
                }}
              >
                {tiles.map((tile, index) => (
                  <motion.div
                    key={index}
                    whileHover={tile !== 0 && !complete ? { scale: 1.05 } : {}}
                    onClick={() => handleTileClick(index)}
                    className={`
                      flex items-center justify-center rounded-md
                      ${tile !== 0 ? 'bg-white shadow-md cursor-pointer' : 'bg-transparent'}
                      ${complete ? 'bg-green-100' : ''}
                    `}
                    style={{ 
                      width: '100%', 
                      height: '100%'
                    }}
                  >
                    {tile !== 0 && (
                      <span className={`text-lg font-bold ${complete ? 'text-green-700' : ''}`}>
                        {tile}
                      </span>
                    )}
                  </motion.div>
                ))}
              </div>
              
              {complete && (
                <div className="mt-4">
                  <p className="text-green-600 font-bold mb-2">🎉 Puzzle Completed! 🎉</p>
                  {reward && <p className="text-green-600 mb-4">Reward: {reward}</p>}
                  <Button onClick={() => startGame(difficulty)}>Play Again</Button>
                  <Button variant="outline" onClick={() => setStart(false)} className="ml-2">
                    Change Difficulty
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}