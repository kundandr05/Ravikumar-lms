'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase/firebase';
import { collection, query, getDocs, where, getCountFromServer, limit, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState({
    students: 0,
    courses: 0,
    enrollments: 0,
    reviews: 0,
  });
  const [recentTests, setRecentTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        // Fetch Students count
        const studentsQuery = query(collection(db, 'users'), where('role', '==', 'student'));
        const studentsSnap = await getCountFromServer(studentsQuery);
        
        // Fetch Courses count
        const coursesSnap = await getCountFromServer(collection(db, 'courses'));
        
        // Fetch Enrollments count
        const enrollmentsSnap = await getCountFromServer(collection(db, 'enrollments'));
        
        // Fetch Reviews count
        const reviewsSnap = await getCountFromServer(collection(db, 'reviews'));

        setMetrics({
          students: studentsSnap.data().count,
          courses: coursesSnap.data().count,
          enrollments: enrollmentsSnap.data().count,
          reviews: reviewsSnap.data().count,
        });

        // Fetch recent test scores for the chart
        const recentTestsQuery = query(collection(db, 'testAttempts'), where('status', '==', 'COMPLETED'), orderBy('submittedAt', 'desc'), limit(10));
        const testsSnap = await getDocs(recentTestsQuery);
        const testsData = testsSnap.docs.map((doc, idx) => {
          const data = doc.data();
          return {
            name: `Test ${idx + 1}`,
            score: data.totalScore > 0 ? Math.round((data.score / data.totalScore) * 100) : 0,
            student: data.studentName || 'Student'
          };
        }).reverse();
        
        setRecentTests(testsData);

      } catch (error) {
        console.error("Error fetching admin metrics:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchMetrics();
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard Overview</h1>
        <p className="text-muted-foreground mt-2">Welcome back to your administration panel.</p>
      </div>

      {user && !user.emailVerified && user.providerData.some(p => p.providerId === 'password') && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg flex items-start gap-3 shadow-sm">
          <svg className="w-5 h-5 shrink-0 mt-0.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="font-semibold">Please verify your email address.</p>
            <p className="text-sm">We sent a verification link to {user.email}. Please check your inbox.</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse border-slate-800">
              <CardHeader className="pb-2"><div className="h-4 bg-slate-800 rounded w-1/2"></div></CardHeader>
              <CardContent><div className="h-10 bg-slate-800 rounded w-1/3"></div></CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-slate-800 bg-card/50 backdrop-blur hover:bg-card transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">Total Students</CardTitle>
                <div className="bg-indigo-500/10 p-2 rounded-lg">
                  <svg className="h-4 w-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-black text-foreground">{metrics.students}</div>
              </CardContent>
            </Card>

            <Card className="border-slate-800 bg-card/50 backdrop-blur hover:bg-card transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">Active Courses</CardTitle>
                <div className="bg-emerald-500/10 p-2 rounded-lg">
                  <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-black text-foreground">{metrics.courses}</div>
              </CardContent>
            </Card>

            <Card className="border-slate-800 bg-card/50 backdrop-blur hover:bg-card transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">Total Enrollments</CardTitle>
                <div className="bg-amber-500/10 p-2 rounded-lg">
                  <svg className="h-4 w-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-black text-foreground">{metrics.enrollments}</div>
              </CardContent>
            </Card>

            <Card className="border-slate-800 bg-card/50 backdrop-blur hover:bg-card transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">Reviews Submitted</CardTitle>
                <div className="bg-pink-500/10 p-2 rounded-lg">
                  <svg className="h-4 w-4 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-black text-foreground">{metrics.reviews}</div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8">
            <Card className="border-slate-800 bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle>Recent Test Performances</CardTitle>
                <CardDescription>A quick look at the latest 10 completed board exams.</CardDescription>
              </CardHeader>
              <CardContent>
                {recentTests.length > 0 ? (
                  <div className="h-72 w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={recentTests} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} domain={[0, 100]} />
                        <Tooltip 
                          cursor={{ fill: '#1e293b', opacity: 0.4 }}
                          contentStyle={{ borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0f172a' }}
                          formatter={(value: any, name: any, props: any) => [`${value}%`, `Student: ${props.payload.student}`]}
                        />
                        <Bar dataKey="score" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-72 flex items-center justify-center text-slate-500 border border-slate-800 rounded border-dashed">
                    No recent tests found.
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
