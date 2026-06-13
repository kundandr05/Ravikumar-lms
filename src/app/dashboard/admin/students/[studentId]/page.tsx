'use client';

import { use, useEffect, useState, useRef } from 'react';
import { db } from '@/lib/firebase/firebase';
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { format, differenceInDays } from 'date-fns';
import { AlertTriangle, Clock, PlayCircle, FileText, CheckCircle, XCircle, Download, Monitor, Activity, Flame, Target } from 'lucide-react';
// @ts-ignore
import html2pdf from 'html2pdf.js';

interface StudentInfo {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  status?: string;
  createdAt?: any;
}

export default function StudentIntelligenceDashboard({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = use(params);
  const [student, setStudent] = useState<StudentInfo | null>(null);
  const [analytics, setAnalytics] = useState<any>({});
  const [timeline, setTimeline] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [videoStats, setVideoStats] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const reportRef = useRef<HTMLDivElement>(null);

  // Derived metrics
  const [streak, setStreak] = useState(0);
  const [focusScore, setFocusScore] = useState(0);

  useEffect(() => {
    async function fetchIntelligence() {
      try {
        setLoading(true);

        // 1. Fetch Basic Info
        const userDoc = await getDoc(doc(db, 'users', studentId));
        if (userDoc.exists()) {
          setStudent({ uid: userDoc.id, ...userDoc.data() } as StudentInfo);
        }

        // 2. Fetch Sessions
        const sessionQ = query(collection(db, 'learningSessions'), where('studentId', '==', studentId), orderBy('startTime', 'desc'), limit(30));
        const sessionSnap = await getDocs(sessionQ);
        const sData = sessionSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setSessions(sData);

        // 3. Fetch Video Analytics
        const videoQ = query(collection(db, 'videoAnalytics'), where('studentId', '==', studentId));
        const videoSnap = await getDocs(videoQ);
        const vData = videoSnap.docs.map(d => d.data());
        setVideoStats(vData);

        // 4. Fetch Timeline
        const timelineQ = query(collection(db, 'studentTimeline'), where('studentId', '==', studentId), orderBy('timestamp', 'desc'), limit(50));
        const timelineSnap = await getDocs(timelineQ);
        setTimeline(timelineSnap.docs.map(d => d.data()));

        // 5. Fetch Enrollments
        const enrollQ = query(collection(db, 'enrollments'), where('studentId', '==', studentId));
        const enrollSnap = await getDocs(enrollQ);
        setEnrollments(enrollSnap.docs.map(d => d.data()));

        // 6. Fetch Student Analytics
        const analyticsDoc = await getDoc(doc(db, 'studentAnalytics', studentId));
        if (analyticsDoc.exists()) {
          setAnalytics(analyticsDoc.data());
        } else {
          setAnalytics({ totalLearningTimeSeconds: 0, totalLogins: 0 });
        }

        // 7. Calculate Streak from loginHistory
        const loginQ = query(collection(db, 'loginHistory'), where('studentId', '==', studentId), orderBy('loginTime', 'desc'), limit(30));
        const loginSnap = await getDocs(loginQ);
        
        let currentStreak = 0;
        let lastDate: Date | null = null;
        
        // Simple streak logic: check consecutive days backward from today/yesterday
        const today = new Date();
        today.setHours(0,0,0,0);
        
        for (const doc of loginSnap.docs) {
          const lData = doc.data();
          if (lData.loginTime) {
            const loginDate = lData.loginTime.toDate();
            loginDate.setHours(0,0,0,0);
            
            if (!lastDate) {
              const diff = differenceInDays(today, loginDate);
              if (diff === 0 || diff === 1) {
                currentStreak = 1;
                lastDate = loginDate;
              } else {
                break; // No streak
              }
            } else {
              const diff = differenceInDays(lastDate, loginDate);
              if (diff === 1) {
                currentStreak++;
                lastDate = loginDate;
              } else if (diff > 1) {
                break;
              }
            }
          }
        }
        setStreak(currentStreak);

        // Calculate Focus Score
        let fScore = 100;
        let totalSkips = 0;
        vData.forEach(v => {
          if (v.skippedDuration && v.skippedDuration > 30) totalSkips += 1;
        });
        fScore -= (totalSkips * 5);
        
        // Check test violations
        const testViolationsQ = query(collection(db, 'testViolations'), where('studentId', '==', studentId));
        const testViolationsSnap = await getDocs(testViolationsQ);
        fScore -= (testViolationsSnap.docs.length * 10);

        if (fScore < 0) fScore = 0;
        if (vData.length === 0 && testViolationsSnap.empty) fScore = 0; // No data = 0 focus
        setFocusScore(fScore);

        // Calculate Missed Tests
        const missedQ = query(collection(db, 'missedTests'), where('studentId', '==', studentId));
        const missedSnap = await getDocs(missedQ);
        setAnalytics((prev: any) => ({ ...prev, missedTestsCount: missedSnap.docs.length }));

      } catch (e) {
        console.error("Failed to load intelligence:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchIntelligence();
  }, [studentId]);

  const generatePDF = () => {
    if (!reportRef.current) return;
    const opt = {
      margin: 10,
      filename: `Report_${student?.name || 'Student'}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
    };
    html2pdf().set(opt).from(reportRef.current).save();
  };

  if (loading) return <div className="p-8 text-center animate-pulse">Loading Intelligence Engine...</div>;
  if (!student) return <div className="p-8 text-center text-red-500">Student not found</div>;

  // Calculate Insights
  let totalSessionSeconds = 0;
  sessions.forEach(s => totalSessionSeconds += (s.duration || 0));
  const totalLearningMinutes = Math.round((analytics.totalLearningTime || totalSessionSeconds) / 60);
  
  let totalWatchPercentage = 0;
  videoStats.forEach(v => totalWatchPercentage += (v.watchPercentage || 0));
  const avgWatchPercentage = videoStats.length > 0 ? Math.round(totalWatchPercentage / videoStats.length) : 0;

  let riskLevel = 'LOW RISK';
  let riskReason = 'Active Learning, Good Attendance, Good Completion Rate';
  if (enrollments.length === 0 || analytics.missedTestsCount >= 3 || totalLearningMinutes < 10) {
    riskLevel = 'HIGH RISK';
    riskReason = 'No Learning Activity, Repeated Missed Tests, Low Completion Rate';
  } else if (sessions.length < 5 || analytics.missedTestsCount >= 1) {
    riskLevel = 'MEDIUM RISK';
    riskReason = 'Low Activity, Multiple Missed Tasks';
  }
  
  const riskColor = riskLevel === 'HIGH RISK' ? 'text-red-600 bg-red-100' : riskLevel === 'MEDIUM RISK' ? 'text-amber-600 bg-amber-100' : 'text-green-600 bg-green-100';

  // Prepare chart data
  const sessionChartData = [...sessions].reverse().map(s => {
    const d = s.startTime?.toDate();
    return {
      date: d ? format(d, 'MMM dd') : 'N/A',
      active: 1
    };
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground">{student.name}</h1>
          <p className="text-muted-foreground flex items-center gap-2">
            {student.email} • {student.phone || 'No phone'}
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${riskColor}`}>{riskLevel}</span>
          </p>
        </div>
        <Button onClick={generatePDF} className="bg-blue-600 hover:bg-blue-700">
          <Download className="w-4 h-4 mr-2" /> Generate Parent Report
        </Button>
      </div>

      {/* Report Container (for PDF generation) */}
      <div ref={reportRef} className="space-y-6">
        
        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="text-sm font-medium opacity-80 uppercase tracking-wider mb-2">Total Learning Time</div>
              <div className="text-4xl font-black flex items-center gap-2">
                <Clock className="w-8 h-8 opacity-50" />
                {totalLearningMinutes} <span className="text-xl font-medium opacity-80">mins</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500 to-orange-600 text-white">
            <CardContent className="p-6">
              <div className="text-sm font-medium opacity-80 uppercase tracking-wider mb-2">Daily Streak</div>
              <div className="text-4xl font-black flex items-center gap-2">
                <Flame className="w-8 h-8 opacity-50" />
                {streak} <span className="text-xl font-medium opacity-80">days</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700">
            <CardContent className="p-6">
              <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Focus Score</div>
              <div className="text-4xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Target className="w-8 h-8 text-green-500 opacity-50" />
                {focusScore} <span className="text-xl font-medium opacity-80 text-muted-foreground">/100</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700">
            <CardContent className="p-6">
              <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Avg Watch Time</div>
              <div className="text-4xl font-black text-slate-800 dark:text-slate-100">{avgWatchPercentage}%</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
            <TabsTrigger value="overview" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-6 py-3">Overview & Risk</TabsTrigger>
            <TabsTrigger value="video" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-6 py-3">Video Analytics</TabsTrigger>
            <TabsTrigger value="timeline" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-6 py-3">Student Timeline</TabsTrigger>
            <TabsTrigger value="sessions" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-6 py-3">Login Sessions</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">AI Risk Insights</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className={`flex items-start gap-3 p-3 rounded-lg ${
                    riskLevel === 'HIGH RISK' ? 'bg-red-50 text-red-700' :
                    riskLevel === 'MEDIUM RISK' ? 'bg-amber-50 text-amber-700' :
                    'bg-green-50 text-green-700'
                  }`}>
                    {riskLevel === 'HIGH RISK' ? <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" /> : 
                     riskLevel === 'MEDIUM RISK' ? <Clock className="w-5 h-5 shrink-0 mt-0.5" /> : 
                     <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />}
                    <div>
                      <p className="font-bold">{riskLevel}</p>
                      <p className="text-sm opacity-80">{riskReason}</p>
                    </div>
                  </div>
                  {streak >= 3 ? (
                    <div className="flex items-start gap-3 p-3 bg-blue-50 text-blue-700 rounded-lg">
                      <Flame className="w-5 h-5 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">Highly Engaged Learner</p>
                        <p className="text-sm opacity-80">Student is on a {streak} day learning streak!</p>
                      </div>
                    </div>
                  ) : null}
                  {videoStats.some(v => v.skippedDuration && v.skippedDuration > 60) ? (
                    <div className="flex items-start gap-3 p-3 bg-orange-50 text-orange-700 rounded-lg">
                      <Activity className="w-5 h-5 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">Video Skipping Detected</p>
                        <p className="text-sm opacity-80">Student frequently fast-forwards through lectures instead of watching fully.</p>
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Login Activity (Last 30 Sessions)</CardTitle>
                </CardHeader>
                <CardContent className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sessionChartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="date" tick={{fontSize: 12}} />
                      <YAxis allowDecimals={false} />
                      <RechartsTooltip />
                      <Bar dataKey="active" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="video" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Video Consumption & Skips</CardTitle>
              </CardHeader>
              <CardContent>
                {videoStats.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No video analytics recorded yet.</p>
                ) : (
                  <div className="space-y-4">
                    {videoStats.map((stat, i) => (
                      <div key={i} className="flex flex-col md:flex-row justify-between md:items-center p-4 border rounded-lg bg-slate-50 dark:bg-slate-800/50 gap-4">
                        <div className="flex items-center gap-3">
                          <PlayCircle className="w-8 h-8 text-indigo-500" />
                          <div>
                            <p className="font-bold text-foreground">Video ID: {stat.videoId}</p>
                            <p className="text-sm text-muted-foreground">Course ID: {stat.courseId}</p>
                          </div>
                        </div>
                        <div className="text-left md:text-right flex flex-col md:items-end">
                          <p className="font-bold text-lg">{Math.round((stat.watchDuration || 0) / 60)} mins watched</p>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="text-sm font-medium text-slate-600 bg-slate-200 px-2 py-0.5 rounded">
                              Watched: {Math.round(stat.watchPercentage || 0)}%
                            </span>
                            {stat.skippedDuration > 0 ? (
                              <span className="text-sm text-red-500 font-medium">⚠️ {Math.round(stat.skippedDuration)}s skipped</span>
                            ) : (
                              <span className="text-sm text-green-500 font-medium">✓ No skipping</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timeline" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Live Student Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                  {timeline.map((event, idx) => (
                    <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-200 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                        {event.type === 'LOGIN' ? <Monitor className="w-4 h-4" /> : event.type.includes('VIDEO') ? <PlayCircle className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
                      </div>
                      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded border border-slate-200 shadow-sm bg-white dark:bg-slate-800">
                        <div className="flex items-center justify-between space-x-2 mb-1">
                          <div className="font-bold text-slate-900 dark:text-slate-100">{event.type}</div>
                          <time className="text-xs font-medium text-amber-500">{event.timestamp?.toDate() ? format(event.timestamp.toDate(), 'PP p') : 'Just now'}</time>
                        </div>
                        <div className="text-slate-500 dark:text-slate-400 text-sm">{event.details}</div>
                      </div>
                    </div>
                  ))}
                  {timeline.length === 0 && <p className="text-center text-muted-foreground w-full py-8">No events recorded.</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sessions" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Device & Browser Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                      <tr>
                        <th className="px-6 py-3">Date & Time</th>
                        <th className="px-6 py-3">Duration</th>
                        <th className="px-6 py-3">Device</th>
                        <th className="px-6 py-3">OS</th>
                        <th className="px-6 py-3">Browser</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sessions.map((s, i) => (
                        <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="px-6 py-4 font-medium">{s.startTime?.toDate() ? format(s.startTime.toDate(), 'PP p') : (s.sessionStart?.toDate() ? format(s.sessionStart.toDate(), 'PP p') : 'N/A')}</td>
                          <td className="px-6 py-4">{s.duration ? `${Math.round(s.duration / 60)} mins` : (s.isActive ? 'Active' : 'N/A')}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${s.device === 'Desktop' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                              {s.device || 'Unknown'}
                            </span>
                          </td>
                          <td className="px-6 py-4">{s.os || 'Unknown'}</td>
                          <td className="px-6 py-4">{s.browser || 'Unknown'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {sessions.length === 0 && <p className="text-center text-muted-foreground py-8">No sessions recorded.</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
