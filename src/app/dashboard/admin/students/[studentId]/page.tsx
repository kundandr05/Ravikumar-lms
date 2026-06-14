'use client';

import { use, useEffect, useState } from 'react';
import { db } from '@/lib/firebase/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { format } from 'date-fns';
import { Target, Download, BookOpen, Activity, Award, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StudentInfo {
  uid: string;
  name: string;
  email: string;
  phone?: string;
}

export default function StudentDetailsPage({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = use(params);
  const [student, setStudent] = useState<StudentInfo | null>(null);
  const [testAttempts, setTestAttempts] = useState<any[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Performance Metrics
  const [metrics, setMetrics] = useState({
    testsAttempted: 0,
    mcqAverage: 0,
    descriptiveAverage: 0,
    overallAverage: 0,
    highestScore: 0,
    lowestScore: 0,
    latestScore: 0,
  });

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        const userDoc = await getDoc(doc(db, 'users', studentId));
        if (userDoc.exists()) {
          setStudent({ uid: userDoc.id, ...userDoc.data() } as StudentInfo);
        }

        // Fetch tests
        const testQ = query(collection(db, 'testAttempts'), where('studentId', '==', studentId));
        const testSnap = await getDocs(testQ);
        
        const attempts = testSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
        
        // Sort newest first
        attempts.sort((a, b) => {
          const dateA = a.submittedAt?.toMillis ? a.submittedAt.toMillis() : 0;
          const dateB = b.submittedAt?.toMillis ? b.submittedAt.toMillis() : 0;
          return dateB - dateA;
        });
        
        setTestAttempts(attempts);

        // Calculate Metrics for Completed Tests
        const completedTests = attempts.filter(a => a.status === 'COMPLETED' && a.totalScore > 0);
        if (completedTests.length > 0) {
          let totalMcqPercentage = 0;
          let totalDescPercentage = 0;
          let totalOverallPercentage = 0;
          let highest = -1;
          let lowest = 101;
          
          let testsWithMcqs = 0;
          let testsWithDesc = 0;

          completedTests.forEach(t => {
            const perc = (t.score / t.totalScore) * 100;
            totalOverallPercentage += perc;
            if (perc > highest) highest = perc;
            if (perc < lowest) lowest = perc;

            // MCQ Average calculation (assuming mcqScore exists)
            if (t.mcqScore !== undefined) {
               // To get MCQ %, we need max MCQ. For simplicity, just store raw avg or estimate it. 
               // Assuming the totalScore usually reflects the sum. If we don't know the exact MCQ max, 
               // we just average their absolute mcq score? No, the prompt says "MCQ Average".
               totalMcqPercentage += t.mcqScore;
               testsWithMcqs++;
            }
            if (t.descriptiveScore !== undefined) {
               totalDescPercentage += t.descriptiveScore;
               testsWithDesc++;
            }
          });

          setMetrics({
            testsAttempted: attempts.length,
            mcqAverage: testsWithMcqs > 0 ? Math.round(totalMcqPercentage / testsWithMcqs) : 0,
            descriptiveAverage: testsWithDesc > 0 ? Math.round(totalDescPercentage / testsWithDesc) : 0,
            overallAverage: Math.round(totalOverallPercentage / completedTests.length),
            highestScore: Math.round(highest),
            lowestScore: Math.round(lowest),
            latestScore: Math.round((completedTests[0].score / completedTests[0].totalScore) * 100),
          });
        } else {
          setMetrics(prev => ({ ...prev, testsAttempted: attempts.length }));
        }

        // Fetch Enrollments and Map to Courses
        const enrollQ = query(collection(db, 'enrollments'), where('studentId', '==', studentId));
        const enrollSnap = await getDocs(enrollQ);
        
        const courseIds = enrollSnap.docs.map(d => d.data().courseId);
        if (courseIds.length > 0) {
          const coursesQ = query(collection(db, 'courses'), where('__name__', 'in', courseIds.slice(0, 10)));
          const coursesSnap = await getDocs(coursesQ);
          const courseData = coursesSnap.docs.map(d => ({ id: d.id, title: d.data().title }));
          setEnrolledCourses(courseData);
        }

      } catch (e) {
        console.error("Failed to load student data:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [studentId]);

  if (loading) return <div className="p-8 text-center animate-pulse">Loading Student Profile...</div>;
  if (!student) return <div className="p-8 text-center text-red-500">Student not found</div>;

  const handleDownloadReport = () => {
    window.print();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12 mt-8 print:mt-0 print:space-y-4">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-card border border-slate-800 rounded-xl p-8 shadow-sm print:border-none print:shadow-none print:p-0">
        <div>
          <h1 className="text-4xl font-black text-foreground tracking-tight">{student.name}</h1>
          <div className="mt-4 space-y-2 text-muted-foreground text-lg">
            <p><strong>Email:</strong> {student.email}</p>
            <p><strong>Phone:</strong> {student.phone || 'Not provided'}</p>
          </div>
        </div>
        <Button onClick={handleDownloadReport} className="print:hidden flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
          <Download className="w-4 h-4" />
          View Report Card
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 print:block print:space-y-8">
        
        {/* LEFT COL: Enrolled Courses & Quick Stats */}
        <div className="space-y-8">
          <div className="space-y-4">
            <h3 className="text-2xl font-bold flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-indigo-500" />
              Enrolled Courses
            </h3>
            {enrolledCourses.length === 0 ? (
              <div className="p-6 text-center border border-slate-800 rounded-lg text-muted-foreground bg-card">Not enrolled in any courses.</div>
            ) : (
              <div className="grid gap-3">
                {enrolledCourses.map((course, i) => (
                  <div key={i} className="p-4 rounded-xl border border-slate-800 bg-card">
                    <h4 className="font-bold text-lg text-foreground">{course.title}</h4>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COL: Test Performance */}
        <div className="md:col-span-2 space-y-8">
          
          <div className="space-y-4">
            <h3 className="text-2xl font-bold flex items-center gap-2">
              <Activity className="w-6 h-6 text-blue-500" />
              Test Performance
            </h3>
            
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="border-slate-800 bg-card">
                <CardContent className="p-6 text-center">
                  <p className="text-sm font-bold text-muted-foreground uppercase mb-1">Tests Attempted</p>
                  <p className="text-3xl font-black text-foreground">{metrics.testsAttempted}</p>
                </CardContent>
              </Card>
              <Card className="border-slate-800 bg-card">
                <CardContent className="p-6 text-center">
                  <p className="text-sm font-bold text-muted-foreground uppercase mb-1">Overall Average</p>
                  <p className="text-3xl font-black text-blue-500">{metrics.overallAverage}%</p>
                </CardContent>
              </Card>
              <Card className="border-slate-800 bg-card">
                <CardContent className="p-6 text-center">
                  <p className="text-sm font-bold text-muted-foreground uppercase mb-1">Latest Score</p>
                  <p className="text-3xl font-black text-foreground">{metrics.latestScore}%</p>
                </CardContent>
              </Card>
              <Card className="border-slate-800 bg-card">
                <CardContent className="p-6 text-center">
                  <p className="text-sm font-bold text-muted-foreground uppercase mb-1">Highest Score</p>
                  <p className="text-3xl font-black text-green-500">{metrics.highestScore}%</p>
                </CardContent>
              </Card>
              <Card className="border-slate-800 bg-card">
                <CardContent className="p-6 text-center">
                  <p className="text-sm font-bold text-muted-foreground uppercase mb-1">Lowest Score</p>
                  <p className="text-3xl font-black text-red-500">{metrics.lowestScore}%</p>
                </CardContent>
              </Card>
              <Card className="border-slate-800 bg-card">
                <CardContent className="p-6 text-center">
                  <p className="text-sm font-bold text-muted-foreground uppercase mb-1">Avg Breakdowns</p>
                  <p className="text-sm font-bold text-foreground mt-2">MCQ: {metrics.mcqAverage} marks</p>
                  <p className="text-sm font-bold text-foreground">Desc: {metrics.descriptiveAverage} marks</p>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-2xl font-bold flex items-center gap-2">
              <Target className="w-6 h-6 text-amber-500" />
              Detailed Test History
            </h3>
            {testAttempts.length === 0 ? (
              <div className="p-8 text-center border border-slate-800 rounded-lg text-muted-foreground bg-card">No tests taken yet.</div>
            ) : (
              <div className="grid gap-4">
                {testAttempts.map((test, i) => {
                  const perc = test.totalScore > 0 ? Math.round((test.score / test.totalScore) * 100) : 0;
                  const isPending = test.status === 'PENDING_EVALUATION';

                  return (
                    <div key={i} className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 rounded-xl border border-slate-800 bg-card hover:border-slate-700 transition-colors gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h4 className="font-bold text-xl text-foreground">{test.testTitle || 'Untitled Test'}</h4>
                          {isPending && <span className="bg-amber-500/20 text-amber-500 text-xs font-bold px-2 py-1 rounded">Pending</span>}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">Date: {test.submittedAt ? format(test.submittedAt.toDate(), 'PPP p') : 'Unknown Date'}</p>
                        
                        {!isPending && (
                          <div className="flex gap-4 mt-3 text-sm font-medium">
                            <span className="bg-slate-800 px-2 py-1 rounded">MCQ: {test.mcqScore || 0}</span>
                            <span className="bg-slate-800 px-2 py-1 rounded">Descriptive: {test.descriptiveScore || 0}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="text-right shrink-0">
                        {isPending ? (
                          <span className="text-muted-foreground italic text-sm">Awaiting Evaluation</span>
                        ) : (
                          <>
                            <div className="font-black text-2xl">{test.score} / {test.totalScore} <span className="text-muted-foreground font-medium text-lg ml-2">({perc}%)</span></div>
                            <div className="text-xs font-bold text-muted-foreground mt-1">Status: COMPLETED</div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
