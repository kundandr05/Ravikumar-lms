'use client';

import { useEffect, useState, use } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import { Test } from '@/types';
import Link from 'next/link';

export default function StudentPreTestPage({ params }: { params: Promise<{ courseId: string, testId: string }> }) {
  const { courseId, testId } = use(params);
  const { appUser } = useAuth();
  
  const [testData, setTestData] = useState<Test | null>(null);
  const [questionCount, setQuestionCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);

  useEffect(() => {
    async function fetchTestData() {
      if (!appUser?.uid) return;

      try {
        // 1. Check Enrollment
        const enrollQuery = query(
          collection(db, 'enrollments'), 
          where('studentId', '==', appUser.uid),
          where('courseId', '==', courseId)
        );
        const enrollSnap = await getDocs(enrollQuery);
        
        if (enrollSnap.empty) {
          setIsEnrolled(false);
          setLoading(false);
          return;
        }
        setIsEnrolled(true);

        // 2. Fetch Test Data
        const testDoc = await getDoc(doc(db, 'tests', testId));
        if (testDoc.exists()) {
          setTestData({ testId: testDoc.id, ...testDoc.data() } as Test);
        }

        // 3. Count Questions
        const questionsQuery = query(collection(db, 'questions'), where('testId', '==', testId));
        const questionsSnap = await getDocs(questionsQuery);
        setQuestionCount(questionsSnap.size);

      } catch (error) {
        console.error("Error fetching test data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchTestData();
  }, [courseId, testId, appUser]);

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading test details...</div>;
  }

  if (!isEnrolled) {
    return (
      <div className="p-8 text-center max-w-lg mx-auto mt-12 space-y-4">
        <h2 className="text-2xl font-bold text-foreground">Access Denied</h2>
        <p className="text-muted-foreground">You must be enrolled in this course to take this test.</p>
        <Link href="/courses" className={buttonVariants()}>Browse Public Courses</Link>
      </div>
    );
  }

  if (!testData) {
    return <div className="p-8 text-center text-red-500">Test not found.</div>;
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-8">
      <Link href={`/dashboard/student/courses/${courseId}`} className="text-primary hover:text-amber-700 text-sm font-medium flex items-center gap-1">
        &larr; Back to Course
      </Link>

      <Card className="border-0 shadow-lg overflow-hidden">
        <div className="bg-card text-card-foreground p-8">
          <h1 className="text-3xl font-bold mb-2">{testData.title}</h1>
          <p className="text-slate-300">{testData.description}</p>
        </div>
        <CardContent className="p-8 space-y-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <span className="block text-2xl font-bold text-foreground">{questionCount}</span>
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Questions</span>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <span className="block text-2xl font-bold text-foreground">{testData.durationMinutes}</span>
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Minutes</span>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <span className="block text-2xl font-bold text-foreground">{questionCount}</span>
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Max Score</span>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <span className="block text-2xl font-bold text-foreground">MCQ</span>
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Format</span>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-foreground text-lg border-b pb-2">Important Instructions</h3>
            <ul className="space-y-2 text-muted-foreground text-sm">
              <li className="flex gap-2">
                <svg className="w-5 h-5 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                The timer will start as soon as you click the button below. It cannot be paused.
              </li>
              <li className="flex gap-2">
                <svg className="w-5 h-5 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Your test will be automatically submitted when the time limit runs out.
              </li>
              <li className="flex gap-2">
                <svg className="w-5 h-5 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Make sure you have a stable internet connection before starting.
              </li>
            </ul>
          </div>

          <div className="pt-4 text-center">
            {questionCount > 0 ? (
              <Link 
                href={`/dashboard/student/courses/${courseId}/tests/${testId}/attempt`} 
                className={buttonVariants({ size: "lg", className: "w-full md:w-auto px-12 py-6 text-lg" })}
              >
                Start Test Now
              </Link>
            ) : (
              <div className="text-primary bg-amber-50 p-4 rounded-lg font-medium">
                This test has no questions yet. Please check back later.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
