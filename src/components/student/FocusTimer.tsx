'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Timer, Play, Pause, X, Award } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import confetti from 'canvas-confetti';

export function FocusTimer() {
  const { appUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'focus' | 'break'>('focus');

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      setIsActive(false);
      if (mode === 'focus') {
        handleFocusComplete();
      }
    }

    return () => clearInterval(interval);
  }, [isActive, timeLeft, mode]);

  const handleFocusComplete = async () => {
    // Reward points!
    fireConfetti();
    setMode('break');
    setTimeLeft(5 * 60); // 5 minute break

    if (appUser && appUser.uid) {
      try {
        const newPoints = (appUser.focusPoints || 0) + 10;
        const userRef = doc(db, 'users', appUser.uid);
        await updateDoc(userRef, { focusPoints: newPoints });
        // The context doesn't automatically update local state instantly unless refreshed,
        // but it will sync on next load.
      } catch (e) {
        console.error("Error updating points:", e);
      }
    }
  };

  const fireConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    setMode('focus');
    setTimeLeft(25 * 60);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!isOpen) {
    return (
      <Button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 md:bottom-6 right-6 rounded-full shadow-xl bg-amber-500 hover:bg-amber-600 text-white w-14 h-14 p-0 z-50 flex items-center justify-center animate-bounce"
        title="Start Focus Mode"
      >
        <Timer className="w-6 h-6" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-20 md:bottom-6 right-6 w-72 shadow-2xl z-50 border-amber-500/30 border-2 overflow-hidden">
      <div className="bg-amber-500 text-white px-4 py-2 flex justify-between items-center">
        <span className="font-bold flex items-center gap-2">
          <Timer className="w-4 h-4" /> Focus Mode
        </span>
        <button onClick={() => setIsOpen(false)} className="hover:bg-amber-600 p-1 rounded">
          <X className="w-4 h-4" />
        </button>
      </div>
      <CardContent className="p-6 text-center space-y-4">
        <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          {mode === 'focus' ? 'Study Time' : 'Break Time'}
        </div>
        
        <div className="text-5xl font-black tabular-nums text-foreground tracking-tight">
          {formatTime(timeLeft)}
        </div>

        <div className="flex justify-center gap-3 pt-2">
          <Button variant={isActive ? "secondary" : "default"} size="icon" onClick={toggleTimer} className={!isActive ? "bg-amber-500 hover:bg-amber-600" : ""}>
            {isActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </Button>
          <Button variant="outline" size="sm" onClick={resetTimer}>
            Reset
          </Button>
        </div>

        <div className="text-xs text-muted-foreground pt-4 flex flex-col items-center gap-1 border-t">
          <span className="flex items-center gap-1 text-amber-500 font-medium">
            <Award className="w-3 h-3" /> Complete 25m to earn 10 Focus Points
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
