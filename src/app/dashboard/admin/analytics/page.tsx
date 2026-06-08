'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase/firebase';
import { collection, getDocs, query, where, getCountFromServer, getAggregateFromServer, average, Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';

export default function AdvancedAnalyticsPage() {
  const [loading, setLoading] = useState(true);

  // Metrics
  const [totalStudents, setTotalStudents] = useState(0);
  const [avgScore, setAvgScore] = useState(0);
  const [participationRate, setParticipationRate] = useState(0);
  
  // Chart Data
  const [dailyActiveData, setDailyActiveData] = useState<any[]>([]);
  const [watchedLessonsData, setWatchedLessonsData] = useState<any[]>([]);
  const [completionPieData, setCompletionPieData] = useState<any[]>([]);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const now = new Date();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 7);
        const sevenDaysAgoTimestamp = Timestamp.fromDate(sevenDaysAgo);

        // 1. Aggregations (Optimized Firestore Queries)
        const studentsQuery = query(collection(db, 'users'), where('role', '==', 'student'));
        const studentsCountSnap = await getCountFromServer(studentsQuery);
        const studentsCount = studentsCountSnap.data().count;
        setTotalStudents(studentsCount);

        const testAttemptsRef = collection(db, 'testAttempts');
        const attemptsCountSnap = await getCountFromServer(testAttemptsRef);
        const totalAttempts = attemptsCountSnap.data().count;
        
        // Participation Rate (Attempts / Total Students)
        setParticipationRate(studentsCount > 0 ? Math.round((totalAttempts / studentsCount) * 100) : 0);

        // Average Score via Aggregate
        const scoreAgg = await getAggregateFromServer(testAttemptsRef, {
          avgScore: average('scorePercentage')
        });
        setAvgScore(Math.round(scoreAgg.data().avgScore || 0));

        // 2. Activity Data (Last 7 Days) for Line Chart
        // Fetch recent lesson progress
        const recentLessonsQ = query(
          collection(db, 'lessonProgress'), 
          where('completedAt', '>=', sevenDaysAgoTimestamp)
        );
        const recentLessonsSnap = await getDocs(recentLessonsQ);
        
        // Fetch recent test attempts
        const recentTestsQ = query(
          collection(db, 'testAttempts'), 
          where('submittedAt', '>=', sevenDaysAgoTimestamp)
        );
        const recentTestsSnap = await getDocs(recentTestsQ);

        // Group active students by Date
        const dailyActiveMap = new Map<string, Set<string>>(); // DateString -> Set of StudentIDs
        
        // Initialize last 7 days with empty sets
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(now.getDate() - i);
          const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          dailyActiveMap.set(dateStr, new Set());
        }

        const addToDailyMap = (timestamp: any, studentId: string) => {
          if (!timestamp || !timestamp.toDate) return;
          const dateStr = timestamp.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          if (dailyActiveMap.has(dateStr)) {
            dailyActiveMap.get(dateStr)!.add(studentId);
          }
        };

        recentLessonsSnap.forEach(d => addToDailyMap(d.data().completedAt, d.data().studentId));
        recentTestsSnap.forEach(d => addToDailyMap(d.data().submittedAt, d.data().studentId));

        const dailyActiveArr = Array.from(dailyActiveMap.entries()).map(([date, students]) => ({
          date,
          activeStudents: students.size
        }));
        setDailyActiveData(dailyActiveArr);

        // 3. Most Watched Lessons (Bar Chart)
        // We fetch all lessonProgress to count. In production with millions of rows, this should be a backend cron job.
        const allProgressSnap = await getDocs(collection(db, 'lessonProgress'));
        const lessonCounts = new Map<string, number>();
        allProgressSnap.forEach(d => {
          const lId = d.data().lessonId;
          lessonCounts.set(lId, (lessonCounts.get(lId) || 0) + 1);
        });

        // We need lesson titles. Fetch all lessons.
        const lessonsSnap = await getDocs(collection(db, 'lessons'));
        const lessonTitles = new Map<string, string>();
        lessonsSnap.forEach(d => {
          lessonTitles.set(d.id, d.data().title);
        });

        const watchedArr = Array.from(lessonCounts.entries())
          .map(([lId, count]) => ({
            name: lessonTitles.get(lId) || `Lesson ${lId.substring(0,4)}`,
            views: count
          }))
          .sort((a, b) => b.views - a.views)
          .slice(0, 5); // Top 5
        setWatchedLessonsData(watchedArr);

        // 4. Course Completion Rates (Pie Chart)
        // Calculate how many courses are 100% completed vs In Progress vs Not Started
        // For simplicity, we just look at the data we generated in progress/page.tsx, but we recreate the aggregation here.
        const enrollSnap = await getDocs(collection(db, 'enrollments'));
        const totalEnrollments = enrollSnap.size;
        
        const coursesSnap = await getDocs(collection(db, 'courses'));
        const courseLessonCount = new Map<string, number>();
        coursesSnap.forEach(d => courseLessonCount.set(d.id, 0));
        lessonsSnap.forEach(d => {
          const cId = d.data().courseId;
          if (courseLessonCount.has(cId)) courseLessonCount.set(cId, courseLessonCount.get(cId)! + 1);
        });

        const progressMap = new Map<string, number>(); // studentId_courseId -> completed lessons
        allProgressSnap.forEach(d => {
          const key = `${d.data().studentId}_${d.data().courseId}`;
          progressMap.set(key, (progressMap.get(key) || 0) + 1);
        });

        let completed = 0;
        let inProgress = 0;
        let notStarted = 0;

        enrollSnap.forEach(d => {
          const e = d.data();
          const totalL = courseLessonCount.get(e.courseId) || 0;
          const completedL = progressMap.get(`${e.studentId}_${e.courseId}`) || 0;
          
          if (completedL === 0) notStarted++;
          else if (completedL >= totalL && totalL > 0) completed++;
          else inProgress++;
        });

        setCompletionPieData([
          { name: 'Completed', value: completed },
          { name: 'In Progress', value: inProgress },
          { name: 'Not Started', value: notStarted }
        ]);

      } catch (error) {
        console.error("Error fetching advanced analytics", error);
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 animate-pulse">Running Firestore Aggregations...</p>
      </div>
    );
  }

  const PIE_COLORS = ['#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Advanced Analytics</h1>
        <p className="text-slate-500 mt-2">Deep insights powered by optimized server-side aggregations.</p>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-sm border-slate-200">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Students</p>
            <h3 className="text-4xl font-black text-slate-900 mt-2">{totalStudents}</h3>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-blue-100 bg-blue-50/50">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-blue-600 uppercase tracking-wider">Avg Test Score</p>
            <h3 className="text-4xl font-black text-blue-900 mt-2">{avgScore}%</h3>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-emerald-100 bg-emerald-50/50">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-emerald-600 uppercase tracking-wider">Test Participation</p>
            <h3 className="text-4xl font-black text-emerald-900 mt-2">{participationRate}%</h3>
            <p className="text-xs text-emerald-700/70 mt-1">Attempts per student</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-purple-100 bg-purple-50/50">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-purple-600 uppercase tracking-wider">Weekly Actives</p>
            <h3 className="text-4xl font-black text-purple-900 mt-2">
              {dailyActiveData.reduce((sum, day) => sum + day.activeStudents, 0)}
            </h3>
            <p className="text-xs text-purple-700/70 mt-1">Unique student actions in 7 days</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Line Chart: Daily Active Students */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Daily Active Students</CardTitle>
            <CardDescription>Unique students completing lessons or tests.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyActiveData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                  />
                  <Line type="monotone" dataKey="activeStudents" name="Active Students" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Bar Chart: Most Watched Lessons */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Most Watched Lessons</CardTitle>
            <CardDescription>Top 5 lessons based on completion count.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={watchedLessonsData} layout="vertical" margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} allowDecimals={false} />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} width={120} />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="views" name="Completions" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pie Chart: Course Completion Rates */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Overall Course Completion</CardTitle>
            <CardDescription>Distribution of enrollment progress across all courses.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center items-center">
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={completionPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    labelLine={false}
                  >
                    {completionPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
