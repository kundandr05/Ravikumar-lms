'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface TestAttempt {
  id: string;
  testId: string;
  studentId: string;
  testTitle?: string; // Assume we store this denormalized, or fetch it
  score: number;
  totalScore: number;
  scorePercentage: number;
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
    if (percentage >= 75) return 'text-amber-600 bg-amber-100';
    if (percentage >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  // Prepare chart data (chronological order)
  const chartData = [...attempts].reverse().map((attempt, index) => ({
    name: attempt.testTitle || `Test ${index + 1}`,
    score: Math.round(attempt.scorePercentage)
  }));

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">My Results</h1>
        <p className="text-slate-500 mt-2">Track your test performance and progress.</p>
      </div>

      {attempts.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Performance History</CardTitle>
            <CardDescription>Your test scores over time.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12 }} 
                    dy={10} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12 }} 
                    domain={[0, 100]}
                  />
                  <Tooltip 
                    cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '3 3' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    name="Score (%)"
                    stroke="#f59e0b" 
                    strokeWidth={3}
                    dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: '#b45309' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Test History</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-slate-500 text-center py-8">Loading your results...</p>
          ) : attempts.length === 0 ? (
            <div className="text-center py-12 text-slate-500 border rounded-lg border-dashed">
              <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              You haven't taken any tests yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b text-sm text-slate-500">
                    <th className="pb-3 font-medium">Test Name</th>
                    <th className="pb-3 font-medium">Date Taken</th>
                    <th className="pb-3 font-medium">Score</th>
                    <th className="pb-3 font-medium">Percentage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {attempts.map((attempt) => (
                    <tr key={attempt.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 font-medium text-slate-900">{attempt.testTitle || 'Untitled Test'}</td>
                      <td className="py-4 text-slate-500 text-sm">
                        {attempt.submittedAt?.toDate ? attempt.submittedAt.toDate().toLocaleDateString() : 'Unknown'}
                      </td>
                      <td className="py-4 text-slate-900 font-medium">
                        {attempt.score} / {attempt.totalScore}
                      </td>
                      <td className="py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-bold ${getScoreColor(attempt.scorePercentage)}`}>
                          {Math.round(attempt.scorePercentage)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
