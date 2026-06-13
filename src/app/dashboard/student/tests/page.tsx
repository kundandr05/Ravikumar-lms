'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Test, TestAttempt } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { Clock, CalendarX2, PlayCircle, AlertCircle, CheckCircle } from 'lucide-react';

const CountdownTimer = ({ targetDate }: { targetDate: Date }) => {
  const [timeLeft, setTimeLeft] = useState<{ d: number, h: number, m: number, s: number } | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate.getTime() - now;

      if (distance < 0) {
        clearInterval(interval);
        setTimeLeft({ d: 0, h: 0, m: 0, s: 0 });
      } else {
        setTimeLeft({
          d: Math.floor(distance / (1000 * 60 * 60 * 24)),
          h: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          m: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          s: Math.floor((distance % (1000 * 60)) / 1000)
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  if (!timeLeft) return <span className="text-muted-foreground animate-pulse">Calculating...</span>;

  return (
    <div className="flex gap-2 text-sm font-bold text-amber-600 bg-amber-50 p-2 rounded items-center">
      <Clock className="w-4 h-4" />
      <span>{timeLeft.d}d {timeLeft.h}h {timeLeft.m}m remaining</span>
    </div>
  );
};

export default function StudentTestsDashboard() {
  const { appUser } = useAuth();
  
  const [upcoming, setUpcoming] = useState<(Test & { courseName: string })[]>([]);
  const [active, setActive] = useState<(Test & { courseName: string })[]>([]);
  const [completed, setCompleted] = useState<(Test & { courseName: string, attempt: TestAttempt })[]>([]);
  const [missed, setMissed] = useState<(Test & { courseName: string })[]>([]);
  const [expired, setExpired] = useState<(Test & { courseName: string })[]>([]);
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (appUser?.uid) {
      fetchTestsAndAttempts();
    }
  }, [appUser]);

  const fetchTestsAndAttempts = async () => {
    setLoading(true);
    try {
      // 1. Get enrolled courses
      const enrollQuery = query(collection(db, 'enrollments'), where('studentId', '==', appUser!.uid));
      const enrollSnap = await getDocs(enrollQuery);
      if (enrollSnap.empty) {
        setLoading(false);
        return;
      }

      const enrolledCourseIds = new Set<string>();
      enrollSnap.forEach(doc => enrolledCourseIds.add(doc.data().courseId));

      // 2. Fetch course names for display mapping
      const coursesSnap = await getDocs(collection(db, 'courses'));
      const courseMap: Record<string, string> = {};
      coursesSnap.forEach(doc => {
        courseMap[doc.id] = doc.data().title;
      });

      // 3. Fetch Test Attempts for this student
      const attemptsQuery = query(collection(db, 'testAttempts'), where('studentId', '==', appUser!.uid));
      const attemptsSnap = await getDocs(attemptsQuery);
      const attemptsMap: Record<string, TestAttempt> = {};
      attemptsSnap.forEach(d => {
        const attempt = { attemptId: d.id, ...d.data() } as TestAttempt;
        attemptsMap[attempt.testId] = attempt;
      });

      // 4. Fetch all tests and categorize
      const testsQuery = query(collection(db, 'tests'), orderBy('createdAt', 'desc'));
      const testsSnap = await getDocs(testsQuery);
      
      const upc: any[] = [];
      const act: any[] = [];
      const comp: any[] = [];
      const miss: any[] = [];
      const exp: any[] = [];
      
      const now = new Date();

      testsSnap.forEach(d => {
        const t = { testId: d.id, ...d.data() } as Test;
        if (!enrolledCourseIds.has(t.courseId)) return;

        const testWithMeta = { ...t, courseName: courseMap[t.courseId] || 'Unknown Course' };
        const attempt = attemptsMap[t.testId!];

        if (attempt) {
          // Completed or Locked
          comp.push({ ...testWithMeta, attempt });
          return;
        }

        const from = t.availableFrom?.toDate ? t.availableFrom.toDate() : (t.availableFrom ? new Date(t.availableFrom) : null);
        const until = t.availableUntil?.toDate ? t.availableUntil.toDate() : (t.availableUntil ? new Date(t.availableUntil) : null);

        if (!from && !until) {
          act.push(testWithMeta); // Open forever
        } else if (from && now < from) {
          upc.push(testWithMeta);
        } else if (until && now > until) {
          // If past deadline and no attempt, it's Missed/Expired
          miss.push(testWithMeta);
          exp.push(testWithMeta); // We can show missed in both or just missed
        } else {
          act.push(testWithMeta); // We are between from and until
        }
      });
      
      setUpcoming(upc);
      setActive(act);
      setCompleted(comp);
      setMissed(miss);
      setExpired(exp);

    } catch (error) {
      console.error("Error fetching tests:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderTestCard = (test: any, type: 'active' | 'upcoming' | 'missed' | 'completed') => {
    const until = test.availableUntil?.toDate ? test.availableUntil.toDate() : (test.availableUntil ? new Date(test.availableUntil) : null);
    const from = test.availableFrom?.toDate ? test.availableFrom.toDate() : (test.availableFrom ? new Date(test.availableFrom) : null);
    
    return (
      <Card key={test.testId} className="flex flex-col hover:shadow-lg transition-shadow border-slate-200">
        <div className={`h-2 w-full rounded-t-xl ${type === 'active' ? 'bg-blue-600' : type === 'upcoming' ? 'bg-amber-400' : type === 'missed' ? 'bg-red-500' : 'bg-green-500'}`}></div>
        <CardContent className="p-6 flex flex-col flex-1">
          <div className="text-xs font-semibold text-primary mb-2 uppercase tracking-wider">{test.courseName}</div>
          <h3 className="text-xl font-bold text-foreground mb-2">{test.title}</h3>
          <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{test.description}</p>
          
          <div className="mt-auto space-y-4">
            <div className="flex items-center text-sm font-medium text-slate-700 bg-slate-50 p-2 rounded">
              <Clock className="w-4 h-4 mr-2 opacity-50" />
              {test.durationMinutes} Minutes
            </div>

            {type === 'active' && until && (
              <CountdownTimer targetDate={until} />
            )}

            {type === 'upcoming' && from && (
              <div className="flex items-center text-sm font-medium text-amber-700 bg-amber-50 p-2 rounded">
                <CalendarX2 className="w-4 h-4 mr-2" />
                Available: {from.toLocaleString()}
              </div>
            )}

            {type === 'missed' && (
              <div className="flex items-center text-sm font-bold text-red-600 bg-red-50 p-2 rounded">
                <AlertCircle className="w-4 h-4 mr-2" />
                Missed Deadline
              </div>
            )}

            {type === 'completed' && test.attempt && (
              <div className={`flex items-center text-sm font-bold p-2 rounded ${
                test.attempt.status === 'LOCKED_FOR_REVIEW' ? 'text-red-700 bg-red-100' : 
                test.attempt.status === 'NEEDS_REVIEW' ? 'text-amber-700 bg-amber-100' :
                'text-green-700 bg-green-100'
              }`}>
                {test.attempt.status === 'LOCKED_FOR_REVIEW' ? (
                  <><AlertCircle className="w-4 h-4 mr-2" /> Locked (Integrity Violation)</>
                ) : test.attempt.status === 'NEEDS_REVIEW' ? (
                  <><AlertCircle className="w-4 h-4 mr-2" /> Pending Admin Approval</>
                ) : (
                  <><CheckCircle className="w-4 h-4 mr-2" /> Completed: {test.attempt.score} / {test.attempt.totalQuestions || test.attempt.totalScore}</>
                )}
              </div>
            )}

            {type === 'active' && (
              <Link href={`/dashboard/student/courses/${test.courseId}/tests/${test.testId}/attempt`} className={buttonVariants({ className: "w-full" })}>
                <PlayCircle className="w-4 h-4 mr-2" /> Start Test
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Global Test Center</h1>
        <p className="text-muted-foreground mt-2">Manage all your exams, track deadlines, and view results.</p>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent mb-6">
          <TabsTrigger value="active" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-6 py-3">Active ({active.length})</TabsTrigger>
          <TabsTrigger value="upcoming" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-6 py-3">Upcoming ({upcoming.length})</TabsTrigger>
          <TabsTrigger value="completed" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-6 py-3">Completed ({completed.length})</TabsTrigger>
          <TabsTrigger value="missed" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-6 py-3">Missed ({missed.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          {loading ? <div className="animate-pulse p-8 text-center">Loading tests...</div> : 
            active.length === 0 ? <p className="text-muted-foreground py-8">No active tests right now.</p> :
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{active.map(t => renderTestCard(t, 'active'))}</div>
          }
        </TabsContent>

        <TabsContent value="upcoming">
          {upcoming.length === 0 ? <p className="text-muted-foreground py-8">No upcoming tests scheduled.</p> :
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{upcoming.map(t => renderTestCard(t, 'upcoming'))}</div>
          }
        </TabsContent>

        <TabsContent value="completed">
          {completed.length === 0 ? <p className="text-muted-foreground py-8">You haven't completed any tests yet.</p> :
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{completed.map(t => renderTestCard(t, 'completed'))}</div>
          }
        </TabsContent>

        <TabsContent value="missed">
          {missed.length === 0 ? <p className="text-muted-foreground py-8">Great job! You haven't missed any tests.</p> :
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{missed.map(t => renderTestCard(t, 'missed'))}</div>
          }
        </TabsContent>
      </Tabs>
    </div>
  );
}
