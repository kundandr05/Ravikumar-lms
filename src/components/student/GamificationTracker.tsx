'use client';

import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Flame } from 'lucide-react';

export function GamificationTracker() {
  const { appUser } = useAuth();
  const [streak, setStreak] = useState<number>(0);
  const [points, setPoints] = useState<number>(0);

  useEffect(() => {
    if (!appUser || appUser.role !== 'student') return;

    setStreak(appUser.currentStreak || 0);
    setPoints(appUser.focusPoints || 0);

    const checkAndAwardStreak = async () => {
      const today = new Date().toISOString().split('T')[0];
      const lastLogin = appUser.lastLoginDate;

      if (lastLogin === today) {
        // Already logged in today, do nothing.
        return;
      }

      let newStreak = appUser.currentStreak || 0;
      
      if (lastLogin) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (lastLogin === yesterdayStr) {
          // Streak continues!
          newStreak += 1;
          fireConfetti();
        } else {
          // Streak broken
          newStreak = 1;
        }
      } else {
        // First ever login
        newStreak = 1;
        fireConfetti();
      }

      setStreak(newStreak);

      // Update Firebase
      try {
        const userRef = doc(db, 'users', appUser.uid);
        await updateDoc(userRef, {
          currentStreak: newStreak,
          lastLoginDate: today
        });
      } catch (error) {
        console.error("Failed to update streak:", error);
      }
    };

    checkAndAwardStreak();
  }, [appUser]);

  const fireConfetti = () => {
    const duration = 3 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#f59e0b', '#d97706', '#fbbf24']
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#f59e0b', '#d97706', '#fbbf24']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  };

  if (!appUser || appUser.role !== 'student') return null;

  return (
    <div className="flex items-center space-x-4 bg-amber-500/10 px-4 py-2 rounded-full border border-amber-500/20">
      <div className="flex items-center text-amber-500 font-bold space-x-1" title="Daily Streak">
        <Flame className="w-5 h-5 animate-pulse" />
        <span>{streak}</span>
      </div>
      <div className="w-px h-4 bg-amber-500/30"></div>
      <div className="text-sm font-medium text-amber-600 dark:text-amber-400" title="Focus Points">
        {points} FP
      </div>
    </div>
  );
}
