'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase/firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Announcement } from '@/types';
import Link from 'next/link';

export default function StudentDashboard() {
  const { appUser, user } = useAuth();
  const [metrics, setMetrics] = useState({
    enrolledCourses: 0,
    testsTaken: 0,
    averageScore: 0,
  });
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
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

        // Fetch Recent Announcements
        const enrolledCourseIds = enrollmentsSnap.docs.map(d => d.data().courseId);
        
        // We fetch announcements targeting 'all' OR targeting their enrolled courses
        // Due to Firestore limitations with OR queries on arrays vs strings, we'll fetch all and filter client side
        // Or we can just fetch all recent and filter.
        const annQuery = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'), limit(20));
        const annSnap = await getDocs(annQuery);
        const annData: Announcement[] = [];
        annSnap.forEach(d => {
          const ann = { announcementId: d.id, ...d.data() } as Announcement;
          if (ann.targetAudience === 'all' || enrolledCourseIds.includes(ann.targetAudience)) {
            annData.push(ann);
          }
        });
        setAnnouncements(annData);

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
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground">Welcome back, {appUser.name?.split(' ')[0] || 'Student'}!</h1>
        <p className="text-muted-foreground mt-2">Ready to continue your learning journey?</p>
      </div>

      {announcements.length > 0 && (
        <div className="space-y-4">
          {announcements.map(ann => (
            <div key={ann.announcementId} className="bg-indigo-50 border-l-4 border-indigo-500 p-4 rounded-r-lg shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-indigo-800 font-bold text-lg">{ann.title}</h3>
                  <p className="text-indigo-700 mt-1 whitespace-pre-line">{ann.message}</p>
                </div>
                <span className="text-xs font-semibold text-indigo-400 bg-indigo-100 px-2 py-1 rounded">
                  {ann.createdAt?.toDate ? ann.createdAt.toDate().toLocaleDateString() : ''}
                </span>
              </div>
              {ann.meetingLink && (
                <div className="mt-3">
                  <a href={ann.meetingLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    Join Live Class
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {user && !user.emailVerified && user.providerData.some(p => p.providerId === 'password') && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg flex items-start gap-3">
          <svg className="w-5 h-5 shrink-0 mt-0.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="font-semibold">Please verify your email address.</p>
            <p className="text-sm">We sent a verification link to {user.email}. Please check your inbox to ensure you have full access to all features.</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardHeader className="pb-2"><Skeleton className="h-4 w-1/2" /></CardHeader>
              <CardContent><Skeleton className="h-10 w-1/3" /></CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-t-4 border-t-amber-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Enrolled Courses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-black text-foreground">{metrics.enrolledCourses}</div>
              </CardContent>
            </Card>

            <Card className="border-t-4 border-t-blue-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Tests Taken</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-black text-foreground">{metrics.testsTaken}</div>
              </CardContent>
            </Card>

            <Card className="border-t-4 border-t-green-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Average Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-black text-foreground">{metrics.averageScore}%</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="shadow-sm border-0 bg-card text-card-foreground">
              <CardHeader>
                <CardTitle>Continue Learning</CardTitle>
              </CardHeader>
              <CardContent>
                {metrics.enrolledCourses > 0 ? (
                  <div className="space-y-4">
                    <p className="text-muted-foreground">Jump right back into your courses.</p>
                    <Link href="/dashboard/student/courses" className={buttonVariants({ className: "w-full sm:w-auto" })}>Go to My Courses</Link>
                  </div>
                ) : (
                  <div className="space-y-4 text-center py-6 border-2 border-dashed border-slate-200 rounded-xl bg-muted/50">
                    <div className="w-12 h-12 bg-amber-100 text-primary rounded-full flex items-center justify-center mx-auto mb-2">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                    </div>
                    <p className="text-muted-foreground">You haven't enrolled in any courses yet.</p>
                    <Link href="/courses" className={buttonVariants({ variant: "outline" })}>Explore Public Courses</Link>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm border-0 bg-card text-card-foreground">
              <CardHeader>
                <CardTitle>Recent Results</CardTitle>
              </CardHeader>
              <CardContent>
                {metrics.testsTaken > 0 ? (
                  <div className="space-y-4">
                    <p className="text-muted-foreground">Check your latest test performance.</p>
                    <Link href="/dashboard/student/results" className={buttonVariants({ variant: "secondary", className: "w-full sm:w-auto" })}>View All Results</Link>
                  </div>
                ) : (
                  <div className="space-y-4 text-center py-6 border-2 border-dashed border-slate-200 rounded-xl bg-muted/50">
                    <p className="text-muted-foreground">You haven't taken any tests yet.</p>
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
