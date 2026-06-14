'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

interface TestAttempt {
  id: string;
  testId: string;
  studentId: string;
  testTitle?: string;
  score: number;
  totalScore: number;
  mcqScore?: number;
  descriptiveScore?: number;
  status: string;
  teacherRemarks?: string;
  evaluatedAt?: any;
  submittedAt: any;
}

export default function StudentResultsPage() {
  const { appUser } = useAuth();
  const [attempts, setAttempts] = useState<TestAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchResults() {
      if (!appUser?.uid) return;

      try {
        const q = query(
          collection(db, 'testAttempts'), 
          where('studentId', '==', appUser.uid)
        );
        const snapshot = await getDocs(q);
        const attemptsData: TestAttempt[] = [];
        snapshot.forEach((doc) => {
          attemptsData.push({ id: doc.id, ...doc.data() } as TestAttempt);
        });

        // Client side sort by newest first
        attemptsData.sort((a, b) => {
          const dateA = a.submittedAt?.toMillis ? a.submittedAt.toMillis() : 0;
          const dateB = b.submittedAt?.toMillis ? b.submittedAt.toMillis() : 0;
          return dateB - dateA;
        });

        setAttempts(attemptsData);
      } catch (error) {
        console.error("Error fetching test results:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchResults();
  }, [appUser]);

  const getScoreColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600 bg-green-100';
    if (percentage >= 75) return 'text-primary bg-amber-100';
    if (percentage >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  // Prepare chart data (chronological order)
  const chartData = [...attempts].reverse()
    .filter(a => a.status === 'COMPLETED' && a.totalScore > 0)
    .map((attempt, index) => ({
      name: attempt.testTitle || `Test ${index + 1}`,
      score: Math.round((attempt.score / attempt.totalScore) * 100)
    }));

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <div>
        <h1 className="text-3xl font-bold text-foreground">My Results</h1>
        <p className="text-muted-foreground mt-2">Track your board exam performance and progress.</p>
      </div>

      {chartData.length > 0 && (
        <Card className="shadow-sm border-slate-800">
          <CardHeader>
            <CardTitle>Performance History</CardTitle>
            <CardDescription>Your overall percentage over time.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 12 }} 
                    dy={10} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 12 }} 
                    domain={[0, 100]}
                  />
                  <Tooltip 
                    cursor={{ stroke: '#475569', strokeWidth: 1, strokeDasharray: '3 3' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #1e293b', backgroundColor: '#0f172a' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    name="Percentage"
                    stroke="#8b5cf6" 
                    strokeWidth={3}
                    dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: '#6d28d9' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Detailed Test History</h2>
        {loading ? (
          <p className="text-muted-foreground text-center py-8 animate-pulse">Loading your results...</p>
        ) : attempts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground border border-slate-800 rounded-lg border-dashed">
            You haven't taken any tests yet.
          </div>
        ) : (
          <div className="grid gap-6">
            {attempts.map((attempt) => {
              const perc = attempt.totalScore > 0 ? Math.round((attempt.score / attempt.totalScore) * 100) : 0;
              const isPending = attempt.status === 'PENDING_EVALUATION';

              return (
                <Card key={attempt.id} className="border-slate-800 bg-card hover:border-slate-700 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <h3 className="font-bold text-xl">{attempt.testTitle || 'Untitled Test'}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Submitted: {attempt.submittedAt?.toDate ? format(attempt.submittedAt.toDate(), 'PPP p') : 'Unknown'}
                        </p>
                      </div>
                      <div className="text-right">
                        {isPending ? (
                          <span className="bg-amber-500/20 text-amber-500 font-bold px-3 py-1 rounded-full text-xs">Awaiting Evaluation</span>
                        ) : (
                          <div className="flex flex-col items-end">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-black ${getScoreColor(perc)}`}>
                              {perc}%
                            </span>
                            <span className="text-2xl font-black mt-2">
                              {attempt.score} <span className="text-sm text-muted-foreground font-medium">/ {attempt.totalScore}</span>
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {!isPending && (
                      <div className="mt-6 pt-6 border-t border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <p className="text-xs text-muted-foreground uppercase font-bold">Score Breakdown</p>
                          <div className="mt-2 space-y-1 text-sm font-medium">
                            <div className="flex justify-between">
                              <span>MCQs:</span>
                              <span>{attempt.mcqScore || 0}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Descriptive:</span>
                              <span>{attempt.descriptiveScore || 0}</span>
                            </div>
                          </div>
                        </div>
                        <div className="md:col-span-2 bg-muted/20 p-4 rounded border border-slate-800">
                          <p className="text-xs text-muted-foreground uppercase font-bold mb-2">Teacher Remarks</p>
                          <p className="text-sm italic">
                            {attempt.teacherRemarks ? `"${attempt.teacherRemarks}"` : "No remarks provided."}
                          </p>
                          {attempt.evaluatedAt && (
                            <p className="text-xs text-slate-500 mt-3 text-right">
                              Evaluated on {format(attempt.evaluatedAt.toDate(), 'PP')}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
