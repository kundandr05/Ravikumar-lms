'use client';

import { use, useEffect, useState, useRef } from 'react';
import { db } from '@/lib/firebase/firebase';
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, differenceInDays } from 'date-fns';
import { AlertTriangle, Clock, Activity, Download, Monitor, CheckCircle, BookOpen, PenTool, Target } from 'lucide-react';
// @ts-ignore
import html2pdf from 'html2pdf.js';

interface StudentInfo {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  status?: string;
}

export default function StudentIntelligenceDashboard({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = use(params);
  const [student, setStudent] = useState<StudentInfo | null>(null);
  
  // Phase 7 Analytics
  const [analytics, setAnalytics] = useState<any>({});
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loginHistory, setLoginHistory] = useState<any[]>([]);
  const [enrollmentsCount, setEnrollmentsCount] = useState(0);
  const [missedTestsCount, setMissedTestsCount] = useState(0);
  
  const [loading, setLoading] = useState(true);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchIntelligence() {
      try {
        setLoading(true);

        const userDoc = await getDoc(doc(db, 'users', studentId));
        if (userDoc.exists()) {
          setStudent({ uid: userDoc.id, ...userDoc.data() } as StudentInfo);
        }

        const analyticsDoc = await getDoc(doc(db, 'studentAnalytics', studentId));
        if (analyticsDoc.exists()) {
          setAnalytics(analyticsDoc.data());
        }

        const timelineQ = query(collection(db, 'studentTimeline'), where('studentId', '==', studentId), orderBy('timestamp', 'desc'), limit(50));
        const timelineSnap = await getDocs(timelineQ);
        setTimeline(timelineSnap.docs.map(d => d.data()));

        const loginQ = query(collection(db, 'loginHistory'), where('studentId', '==', studentId), orderBy('loginTime', 'desc'), limit(30));
        const loginSnap = await getDocs(loginQ);
        setLoginHistory(loginSnap.docs.map(d => d.data()));

        const enrollQ = query(collection(db, 'enrollments'), where('studentId', '==', studentId));
        const enrollSnap = await getDocs(enrollQ);
        setEnrollmentsCount(enrollSnap.docs.length);

        const missedQ = query(collection(db, 'missedTests'), where('studentId', '==', studentId));
        const missedSnap = await getDocs(missedQ);
        setMissedTestsCount(missedSnap.docs.length);

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

  // Streak Calculation
  let streak = 0;
  if (loginHistory.length > 0) {
    let lastDate: Date | null = null;
    const today = new Date();
    today.setHours(0,0,0,0);
    
    for (const lData of loginHistory) {
      if (lData.loginTime) {
        const loginDate = lData.loginTime.toDate();
        loginDate.setHours(0,0,0,0);
        if (!lastDate) {
          const diff = differenceInDays(today, loginDate);
          if (diff <= 1) { streak = 1; lastDate = loginDate; } else break;
        } else {
          const diff = differenceInDays(lastDate, loginDate);
          if (diff === 1) { streak++; lastDate = loginDate; } else if (diff > 1) break;
        }
      }
    }
  }

  // Calculate Insights
  const totalLearningMinutes = Math.round((analytics.totalLearningTime || 0) / 60);
  const lessonsCompleted = analytics.totalLessonsCompleted || 0;
  
  // Phase 7: Risk Score Calculation
  let riskLevel = 'LOW';
  let riskReason = 'Active learner with good completion rates.';
  
  const daysSinceLastActivity = analytics.lastActivity ? differenceInDays(new Date(), analytics.lastActivity.toDate()) : 999;

  if (daysSinceLastActivity > 14 || missedTestsCount >= 3 || (enrollmentsCount > 0 && lessonsCompleted === 0)) {
    riskLevel = 'HIGH';
    riskReason = 'Severe inactivity, repeated missed tests, or no lesson completion.';
  } else if (daysSinceLastActivity > 7 || missedTestsCount > 0) {
    riskLevel = 'MEDIUM';
    riskReason = 'Low recent activity or missed task detected.';
  }
  
  const riskColor = riskLevel === 'HIGH' ? 'text-red-600 bg-red-100 border-red-200' : riskLevel === 'MEDIUM' ? 'text-amber-600 bg-amber-100 border-amber-200' : 'text-green-600 bg-green-100 border-green-200';

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground">{student.name}</h1>
          <p className="text-muted-foreground flex items-center gap-2 mt-1">
            {student.email} • {student.phone || 'No phone'}
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${riskColor}`}>{riskLevel} RISK</span>
          </p>
        </div>
        <Button onClick={generatePDF} className="bg-blue-600 hover:bg-blue-700">
          <Download className="w-4 h-4 mr-2" /> Export Parent Report
        </Button>
      </div>

      <div ref={reportRef} className="space-y-6">
        
        {/* Risk Analysis Banner */}
        <div className={`p-4 rounded-xl border-2 flex items-start gap-4 ${riskColor.replace('bg-', 'bg-opacity-50 bg-')}`}>
          {riskLevel === 'HIGH' ? <AlertTriangle className="w-6 h-6 mt-0.5 shrink-0" /> : riskLevel === 'MEDIUM' ? <Clock className="w-6 h-6 mt-0.5 shrink-0" /> : <CheckCircle className="w-6 h-6 mt-0.5 shrink-0" />}
          <div>
            <h3 className="font-bold text-lg">Risk Analysis: {riskLevel}</h3>
            <p className="opacity-90">{riskReason}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* ACTIVITY */}
          <Card>
            <CardHeader className="bg-muted/50 border-b pb-4">
              <CardTitle className="text-lg flex items-center gap-2"><Activity className="w-5 h-5 text-blue-500" /> Activity Metrics</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-muted-foreground">Total Learning Time</span>
                <span className="font-bold">{totalLearningMinutes} mins</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-muted-foreground">Login Frequency</span>
                <span className="font-bold">{analytics.loginFrequency || 0} logins</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-muted-foreground">Current Streak</span>
                <span className="font-bold text-orange-500">{streak} Days</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Last Active</span>
                <span className="font-bold">{analytics.lastActivity?.toDate() ? format(analytics.lastActivity.toDate(), 'PP') : 'Never'}</span>
              </div>
            </CardContent>
          </Card>

          {/* ACADEMICS */}
          <Card>
            <CardHeader className="bg-muted/50 border-b pb-4">
              <CardTitle className="text-lg flex items-center gap-2"><BookOpen className="w-5 h-5 text-indigo-500" /> Academics</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-muted-foreground">Courses Enrolled</span>
                <span className="font-bold">{enrollmentsCount}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-muted-foreground">Lessons Completed</span>
                <span className="font-bold text-green-600">{lessonsCompleted}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-muted-foreground">Tests Taken</span>
                <span className="font-bold">{analytics.totalTestsTaken || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Average Score</span>
                <span className="font-bold">{analytics.averageScore || 0}%</span>
              </div>
            </CardContent>
          </Card>

          {/* ATTENDANCE */}
          <Card>
            <CardHeader className="bg-muted/50 border-b pb-4">
              <CardTitle className="text-lg flex items-center gap-2"><Target className="w-5 h-5 text-red-500" /> Attendance</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-muted-foreground">Missed Tests</span>
                <span className={`font-bold ${missedTestsCount > 0 ? 'text-red-600' : 'text-green-600'}`}>{missedTestsCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Missed Assignments</span>
                <span className="font-bold text-green-600">0</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="timeline" className="w-full pt-4">
          <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
            <TabsTrigger value="timeline" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-6 py-3">Student Timeline</TabsTrigger>
            <TabsTrigger value="sessions" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-6 py-3">Login History</TabsTrigger>
          </TabsList>

          <TabsContent value="timeline" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                  {timeline.map((event, idx) => (
                    <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-100 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                        {event.type === 'LOGIN' ? <Monitor className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
                      </div>
                      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-slate-200 shadow-sm bg-white dark:bg-slate-800">
                        <div className="flex items-center justify-between space-x-2 mb-1">
                          <div className="font-bold text-slate-900 dark:text-slate-100">{event.type}</div>
                          <time className="text-xs font-medium text-amber-500">{event.timestamp?.toDate() ? format(event.timestamp.toDate(), 'PP p') : 'Just now'}</time>
                        </div>
                        <div className="text-slate-500 dark:text-slate-400 text-sm">{event.description || event.details}</div>
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
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                      <tr>
                        <th className="px-6 py-4">Login Time</th>
                        <th className="px-6 py-4">Logout Time</th>
                        <th className="px-6 py-4">Duration</th>
                        <th className="px-6 py-4">Device</th>
                        <th className="px-6 py-4">Browser</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {loginHistory.map((s, i) => (
                        <tr key={i} className="hover:bg-muted/30">
                          <td className="px-6 py-4 font-medium">{s.loginTime?.toDate() ? format(s.loginTime.toDate(), 'PP p') : 'N/A'}</td>
                          <td className="px-6 py-4 text-muted-foreground">{s.logoutTime?.toDate() ? format(s.logoutTime.toDate(), 'PP p') : 'Active Session'}</td>
                          <td className="px-6 py-4">{s.sessionDuration ? `${Math.round(s.sessionDuration / 60)} mins` : (s.logoutTime ? '< 1 min' : 'Ongoing')}</td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-1 rounded text-xs font-bold bg-slate-100 text-slate-700 border">
                              {s.deviceType || s.device || 'Unknown'} • {s.os || 'Unknown'}
                            </span>
                          </td>
                          <td className="px-6 py-4">{s.browser || 'Unknown'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {loginHistory.length === 0 && <p className="text-center text-muted-foreground py-8">No logins recorded.</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
