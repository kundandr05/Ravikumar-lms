'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase/firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import Link from 'next/link';

export default function StudentDashboard() {
  const { appUser } = useAuth();
  const [metrics, setMetrics] = useState({
    enrolledCourses: 0,
    testsTaken: 0,
    averageScore: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStudentData() {
      if (!appUser?.uid) return;

      try {
        // Fetch Enrollments
        const enrollmentsQuery = query(collection(db, 'enrollments'), where('studentId', '==', appUser.uid));
        const enrollmentsSnap = await getDocs(enrollmentsQuery);
        const enrolledCount = enrollmentsSnap.size;

        // Fetch Test Attempts
        const attemptsQuery = query(collection(db, 'testAttempts'), where('studentId', '==', appUser.uid));
        const attemptsSnap = await getDocs(attemptsQuery);
        const attemptsCount = attemptsSnap.size;

        let totalScore = 0;
        attemptsSnap.forEach(doc => {
          totalScore += doc.data().scorePercentage || 0;
        });

        setMetrics({
          enrolledCourses: enrolledCount,
          testsTaken: attemptsCount,
          averageScore: attemptsCount > 0 ? Math.round(totalScore / attemptsCount) : 0,
        });
      } catch (error) {
        console.error("Error fetching student dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchStudentData();
  }, [appUser]);

  if (!appUser) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Welcome back, {appUser.name.split(' ')[0]}!</h1>
        <p className="text-slate-500 mt-2">Ready to continue your learning journey?</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2"><div className="h-4 bg-slate-200 rounded w-1/2"></div></CardHeader>
              <CardContent><div className="h-10 bg-slate-200 rounded w-1/3"></div></CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-t-4 border-t-amber-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">Enrolled Courses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-black text-slate-900">{metrics.enrolledCourses}</div>
              </CardContent>
            </Card>

            <Card className="border-t-4 border-t-blue-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">Tests Taken</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-black text-slate-900">{metrics.testsTaken}</div>
              </CardContent>
            </Card>

            <Card className="border-t-4 border-t-green-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">Average Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-black text-slate-900">{metrics.averageScore}%</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="shadow-sm border-0 bg-white">
              <CardHeader>
                <CardTitle>Continue Learning</CardTitle>
              </CardHeader>
              <CardContent>
                {metrics.enrolledCourses > 0 ? (
                  <div className="space-y-4">
                    <p className="text-slate-600">Jump right back into your courses.</p>
                    <Link href="/dashboard/student/courses" className={buttonVariants({ className: "w-full sm:w-auto" })}>Go to My Courses</Link>
                  </div>
                ) : (
                  <div className="space-y-4 text-center py-6 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                    <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-2">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                    </div>
                    <p className="text-slate-600">You haven't enrolled in any courses yet.</p>
                    <Link href="/courses" className={buttonVariants({ variant: "outline" })}>Explore Public Courses</Link>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm border-0 bg-white">
              <CardHeader>
                <CardTitle>Recent Results</CardTitle>
              </CardHeader>
              <CardContent>
                {metrics.testsTaken > 0 ? (
                  <div className="space-y-4">
                    <p className="text-slate-600">Check your latest test performance.</p>
                    <Link href="/dashboard/student/results" className={buttonVariants({ variant: "secondary", className: "w-full sm:w-auto" })}>View All Results</Link>
                  </div>
                ) : (
                  <div className="space-y-4 text-center py-6 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                    <p className="text-slate-600">You haven't taken any tests yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
