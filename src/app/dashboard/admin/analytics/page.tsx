'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase/firebase';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface TestAttempt {
  id: string;
  testId: string;
  testTitle?: string;
  studentId: string;
  score: number;
  totalScore: number;
  scorePercentage: number;
  submittedAt: any;
}

export default function AdminAnalyticsPage() {
  const [attempts, setAttempts] = useState<TestAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  // Analytics State
  const [avgScore, setAvgScore] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [participationData, setParticipationData] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const q = query(collection(db, 'testAttempts'), orderBy('submittedAt', 'desc'));
        const snap = await getDocs(q);
        const fetchedAttempts: TestAttempt[] = [];
        
        snap.forEach(doc => {
          fetchedAttempts.push({ id: doc.id, ...doc.data() } as TestAttempt);
        });

        setAttempts(fetchedAttempts);
        calculateAnalytics(fetchedAttempts);
      } catch (error) {
        console.error("Error fetching analytics data", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const calculateAnalytics = (data: TestAttempt[]) => {
    if (data.length === 0) return;

    setTotalAttempts(data.length);

    // 1. Average Score
    const totalPercentage = data.reduce((sum, item) => sum + item.scorePercentage, 0);
    setAvgScore(Math.round(totalPercentage / data.length));

    // 2. Participation per Test
    const testCounts: Record<string, { name: string, attempts: number }> = {};
    data.forEach(item => {
      const title = item.testTitle || 'Unknown Test';
      if (!testCounts[item.testId]) {
        testCounts[item.testId] = { name: title, attempts: 0 };
      }
      testCounts[item.testId].attempts += 1;
    });
    setParticipationData(Object.values(testCounts));

    // 3. Leaderboard (Highest scores)
    // We'll group by studentId across all tests, or just show top individual attempts.
    // Let's show top 10 individual attempts for simplicity.
    const sortedByScore = [...data].sort((a, b) => b.scorePercentage - a.scorePercentage);
    setLeaderboard(sortedByScore.slice(0, 10));
  };

  const handleExportCSV = () => {
    if (attempts.length === 0) {
      alert("No data to export");
      return;
    }

    const headers = ['Attempt ID', 'Test Name', 'Student ID', 'Score', 'Total Score', 'Percentage', 'Date'];
    const rows = attempts.map(a => [
      a.id,
      `"${a.testTitle || 'Unknown'}"`,
      a.studentId,
      a.score,
      a.totalScore,
      `${Math.round(a.scorePercentage)}%`,
      a.submittedAt?.toDate ? `"${a.submittedAt.toDate().toLocaleString()}"` : 'Unknown'
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'student_results.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading Analytics...</div>;
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Analytics & Results</h1>
          <p className="text-slate-500 mt-2">Overview of student performance and test participation.</p>
        </div>
        <Button onClick={handleExportCSV} className="bg-emerald-600 hover:bg-emerald-700">
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          Export CSV
        </Button>
      </div>

      {attempts.length === 0 ? (
        <Card className="text-center py-16 border-dashed border-2 bg-slate-50">
          <CardContent>
            <h3 className="text-xl font-bold text-slate-700">No Data Available</h3>
            <p className="text-slate-500">Analytics will appear here once students start taking tests.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Top Level Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-amber-50 border-amber-100 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="bg-amber-500 text-white p-4 rounded-xl">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-amber-900/60 uppercase tracking-wider">System Average</p>
                    <h3 className="text-4xl font-black text-amber-700">{avgScore}%</h3>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-blue-50 border-blue-100 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-500 text-white p-4 rounded-xl">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-900/60 uppercase tracking-wider">Total Attempts</p>
                    <h3 className="text-4xl font-black text-blue-700">{totalAttempts}</h3>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Chart */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Test Participation</CardTitle>
                <CardDescription>Number of student attempts per test.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80 w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={participationData} margin={{ top: 5, right: 30, left: 0, bottom: 25 }}>
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
                      />
                      <Tooltip 
                        cursor={{ fill: '#f1f5f9' }}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Bar dataKey="attempts" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Leaderboard */}
            <Card className="shadow-sm overflow-hidden flex flex-col">
              <CardHeader className="bg-slate-50 border-b">
                <CardTitle>Top Performances</CardTitle>
                <CardDescription>Highest scoring test attempts.</CardDescription>
              </CardHeader>
              <div className="flex-1 overflow-auto max-h-80">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white sticky top-0 shadow-sm">
                    <tr className="text-slate-500">
                      <th className="p-4 font-medium">Test</th>
                      <th className="p-4 font-medium text-right">Score</th>
                      <th className="p-4 font-medium text-right">Percentage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {leaderboard.map((item, index) => (
                      <tr key={index} className="hover:bg-slate-50">
                        <td className="p-4 font-medium text-slate-900">{item.testTitle || 'Unknown'}</td>
                        <td className="p-4 text-right text-slate-600">{item.score}/{item.totalScore}</td>
                        <td className="p-4 text-right">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            item.scorePercentage >= 90 ? 'bg-green-100 text-green-700' :
                            item.scorePercentage >= 75 ? 'bg-amber-100 text-amber-700' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {Math.round(item.scorePercentage)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
