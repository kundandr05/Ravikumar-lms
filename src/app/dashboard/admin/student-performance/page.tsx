'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';

interface PerformanceRecord {
  uid: string;
  name: string;
  email: string;
  totalTests: number;
  averageScore: number;
  lastTestDate: Date | null;
}

export default function StudentPerformancePage() {
  const [performances, setPerformances] = useState<PerformanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPerformance() {
      try {
        // Fetch all students
        const usersSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'student')));
        const students = new Map();
        usersSnap.forEach(doc => {
          students.set(doc.id, { uid: doc.id, ...doc.data(), totalTests: 0, totalScore: 0, averageScore: 0, lastTestDate: null });
        });

        // Fetch all test attempts
        const attemptsSnap = await getDocs(collection(db, 'testAttempts'));
        
        attemptsSnap.forEach(doc => {
          const data = doc.data();
          const studentId = data.studentId;
          const score = data.score || 0;
          const completedAt = data.completedAt?.toDate();

          if (students.has(studentId)) {
            const student = students.get(studentId);
            student.totalTests += 1;
            student.totalScore += score;
            
            if (!student.lastTestDate || (completedAt && completedAt > student.lastTestDate)) {
              student.lastTestDate = completedAt;
            }
          }
        });

        const performanceData: PerformanceRecord[] = Array.from(students.values()).map(student => ({
          ...student,
          averageScore: student.totalTests > 0 ? Math.round(student.totalScore / student.totalTests) : 0
        }));

        // Sort by average score descending
        performanceData.sort((a, b) => b.averageScore - a.averageScore);

        setPerformances(performanceData);
      } catch (error) {
        console.error("Error fetching performance data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchPerformance();
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Student Performance</h1>
          <p className="text-slate-500 mt-2">Track academic performance and test scores across all students.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Performance Leaderboard</CardTitle>
          <CardDescription>All students ranked by their average test scores.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-slate-500 text-center py-8">Loading performance data...</p>
          ) : performances.length === 0 ? (
            <div className="text-center py-12 text-slate-500 border rounded-lg border-dashed">
              No performance data available yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b text-sm text-slate-500">
                    <th className="pb-3 font-medium">Rank</th>
                    <th className="pb-3 font-medium">Student Name</th>
                    <th className="pb-3 font-medium">Tests Taken</th>
                    <th className="pb-3 font-medium">Average Score</th>
                    <th className="pb-3 font-medium">Last Test Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {performances.map((perf, index) => (
                    <tr key={perf.uid} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 font-medium text-slate-500">#{index + 1}</td>
                      <td className="py-4 font-bold text-slate-900">
                        <Link href={`/dashboard/admin/students/${perf.uid}`} className="hover:text-amber-600 hover:underline transition-colors">
                          {perf.name}
                        </Link>
                        <div className="text-xs text-slate-500 font-normal">{perf.email}</div>
                      </td>
                      <td className="py-4 text-slate-600">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {perf.totalTests} tests
                        </span>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${perf.averageScore >= 80 ? 'text-green-600' : perf.averageScore >= 60 ? 'text-amber-600' : perf.totalTests > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                            {perf.totalTests > 0 ? `${perf.averageScore}%` : 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 text-slate-500 text-sm">
                        {perf.lastTestDate ? perf.lastTestDate.toLocaleDateString() : 'Never'}
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
