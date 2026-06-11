'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import { Test, Course } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function StudentTestsPage() {
  const { appUser } = useAuth();
  const [tests, setTests] = useState<(Test & { courseName: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (appUser?.uid) {
      fetchTests();
    }
  }, [appUser]);

  const fetchTests = async () => {
    setLoading(true);
    try {
      // 1. Get enrolled courses
      const enrollQuery = query(collection(db, 'enrollments'), where('studentId', '==', appUser!.uid));
      const enrollSnap = await getDocs(enrollQuery);
      
      if (enrollSnap.empty) {
        setTests([]);
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

      // 3. Fetch all tests (Firestore 'in' query limited to 10, so fetch all and filter client-side for simplicity)
      const testsQuery = query(collection(db, 'tests'), orderBy('createdAt', 'desc'));
      const testsSnap = await getDocs(testsQuery);
      
      const availableTests: (Test & { courseName: string })[] = [];
      testsSnap.forEach(d => {
        const testData = { testId: d.id, ...d.data() } as Test;
        if (enrolledCourseIds.has(testData.courseId)) {
          availableTests.push({
            ...testData,
            courseName: courseMap[testData.courseId] || 'Unknown Course'
          });
        }
      });
      
      setTests(availableTests);
    } catch (error) {
      console.error("Error fetching tests:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">My Tests</h1>
        <p className="text-muted-foreground mt-2">Take online assessments and track your performance.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Available Assessments</CardTitle>
          <CardDescription>Tests and quizzes from your enrolled courses.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-muted-foreground flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mb-4"></div>
              Loading tests...
            </div>
          ) : tests.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed rounded-lg bg-muted/50 text-muted-foreground flex flex-col items-center">
              <svg className="w-12 h-12 text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
              <p className="text-lg font-medium text-foreground">No Tests Available</p>
              <p className="text-sm mt-1">There are currently no active tests in your enrolled courses.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tests.map((test) => (
                <Card key={test.testId} className="flex flex-col hover:shadow-lg transition-shadow border-slate-200">
                  <div className="bg-slate-900 h-2 w-full rounded-t-xl"></div>
                  <CardContent className="p-6 flex flex-col flex-1">
                    <div className="text-xs font-semibold text-primary mb-2 uppercase tracking-wider">{test.courseName}</div>
                    <h3 className="text-xl font-bold text-foreground mb-2">{test.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-4 flex-1">{test.description}</p>
                    
                    <div className="flex items-center gap-2 mb-6">
                      <span className="flex items-center gap-1.5 text-xs font-medium bg-muted text-foreground px-2.5 py-1 rounded-md">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {test.durationMinutes} Minutes
                      </span>
                    </div>

                    <Link 
                      href={`/dashboard/student/courses/${test.courseId}/tests/${test.testId}/attempt`} 
                      className={buttonVariants({ variant: "default", className: "w-full bg-slate-900 hover:bg-slate-800" })}
                    >
                      Start Test
                      <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
