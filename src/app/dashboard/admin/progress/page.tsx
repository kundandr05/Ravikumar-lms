'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface StudentData {
  uid: string;
  name: string;
  email: string;
  enrollments: {
    courseId: string;
    courseName: string;
    progressPercentage: number;
  }[];
  overallProgress: number;
}

export default function AdminProgressPage() {
  const [studentDataList, setStudentDataList] = useState<StudentData[]>([]);
  const [chartData, setChartData] = useState<{name: string, count: number}[]>([]);
  const [inactiveCount, setInactiveCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProgressData() {
      try {
        // 1. Fetch Students
        const usersSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'student')));
        const students = new Map<string, any>();
        usersSnap.forEach(d => {
          students.set(d.id, { uid: d.id, ...d.data(), enrollments: [] });
        });

        // 2. Fetch Courses to get names and lesson counts
        const coursesSnap = await getDocs(collection(db, 'courses'));
        const courses = new Map<string, { title: string, lessonCount: number }>();
        coursesSnap.forEach(d => {
          courses.set(d.id, { title: d.data().title, lessonCount: 0 });
        });

        // 3. Fetch Lessons to count per course
        const lessonsSnap = await getDocs(collection(db, 'lessons'));
        lessonsSnap.forEach(d => {
          const cId = d.data().courseId;
          if (courses.has(cId)) {
            courses.get(cId)!.lessonCount += 1;
          }
        });

        // 4. Fetch Enrollments
        const enrollSnap = await getDocs(collection(db, 'enrollments'));
        const enrollments = new Map<string, any[]>(); // studentId -> list of enrollments
        enrollSnap.forEach(d => {
          const e = d.data();
          if (!enrollments.has(e.studentId)) enrollments.set(e.studentId, []);
          enrollments.get(e.studentId)!.push(e.courseId);
        });

        // 5. Fetch Lesson Progress
        const progSnap = await getDocs(query(collection(db, 'lessonProgress'), where('completed', '==', true)));
        const progressCount = new Map<string, number>(); // "studentId_courseId" -> count
        progSnap.forEach(d => {
          const p = d.data();
          const key = `${p.studentId}_${p.courseId}`;
          progressCount.set(key, (progressCount.get(key) || 0) + 1);
        });

        // Compile Data
        let notStarted = 0;
        let inProgress = 0;
        let completed = 0;
        let inactive = 0;

        const compiledStudents: StudentData[] = [];

        students.forEach((student, studentId) => {
          const studentEnrollments = enrollments.get(studentId) || [];
          const enhancedEnrollments: any[] = [];
          
          let totalCourseProgress = 0;

          studentEnrollments.forEach(courseId => {
            const courseMeta = courses.get(courseId);
            if (!courseMeta) return;

            const completedLessons = progressCount.get(`${studentId}_${courseId}`) || 0;
            const progressPercentage = courseMeta.lessonCount > 0 
              ? Math.round((completedLessons / courseMeta.lessonCount) * 100) 
              : 0;

            enhancedEnrollments.push({
              courseId,
              courseName: courseMeta.title,
              progressPercentage
            });

            totalCourseProgress += progressPercentage;

            // Chart categories
            if (progressPercentage === 0) notStarted += 1;
            else if (progressPercentage === 100) completed += 1;
            else inProgress += 1;
          });

          const overallProgress = enhancedEnrollments.length > 0 
            ? Math.round(totalCourseProgress / enhancedEnrollments.length) 
            : 0;

          if (enhancedEnrollments.length > 0 && overallProgress === 0) {
            inactive += 1;
          }

          compiledStudents.push({
            uid: student.uid,
            name: student.name,
            email: student.email,
            enrollments: enhancedEnrollments,
            overallProgress
          });
        });

        setStudentDataList(compiledStudents);
        setInactiveCount(inactive);
        setChartData([
          { name: 'Not Started (0%)', count: notStarted },
          { name: 'In Progress (1-99%)', count: inProgress },
          { name: 'Completed (100%)', count: completed }
        ]);

      } catch (error) {
        console.error("Error fetching progress analytics", error);
      } finally {
        setLoading(false);
      }
    }

    fetchProgressData();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Compiling progress analytics...</div>;
  }

  const COLORS = ['#ef4444', '#f59e0b', '#10b981'];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Learning Progress</h1>
        <p className="text-slate-500 mt-2">Track student engagement and course completion metrics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="col-span-1 md:col-span-2 shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle>Course Completion Breakdown</CardTitle>
            <CardDescription>Status of all active course enrollments.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={50}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-red-100 bg-red-50">
          <CardContent className="p-6 flex flex-col justify-center h-full">
            <div className="bg-red-500 text-white w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <h3 className="text-4xl font-black text-red-700">{inactiveCount}</h3>
            <p className="font-bold text-red-900 mt-2">Inactive Students</p>
            <p className="text-sm text-red-700/80 mt-1">Enrolled in courses but have not completed any lessons.</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50 border-b">
          <CardTitle>Student Progress Roster</CardTitle>
          <CardDescription>Detailed view of each student's learning progress.</CardDescription>
        </CardHeader>
        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-left text-sm">
            <thead className="bg-white sticky top-0 shadow-sm z-10">
              <tr className="text-slate-500 border-b">
                <th className="p-4 font-medium">Student</th>
                <th className="p-4 font-medium">Enrollments</th>
                <th className="p-4 font-medium min-w-[200px]">Overall Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {studentDataList.map((student) => (
                <tr key={student.uid} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <p className="font-bold text-slate-900">{student.name}</p>
                    <p className="text-xs text-slate-500">{student.email}</p>
                  </td>
                  <td className="p-4">
                    {student.enrollments.length === 0 ? (
                      <span className="text-slate-400 italic">None</span>
                    ) : (
                      <div className="space-y-1">
                        {student.enrollments.map(e => (
                          <div key={e.courseId} className="flex items-center justify-between text-xs bg-slate-100 px-2 py-1 rounded">
                            <span className="truncate max-w-[150px] font-medium text-slate-700" title={e.courseName}>{e.courseName}</span>
                            <span className={e.progressPercentage === 100 ? 'text-emerald-600 font-bold' : 'text-slate-500'}>
                              {e.progressPercentage}%
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${student.overallProgress === 100 ? 'bg-emerald-500' : student.overallProgress > 0 ? 'bg-amber-500' : 'bg-transparent'}`}
                          style={{ width: `${student.overallProgress}%` }}
                        />
                      </div>
                      <span className="font-bold w-10 text-right text-slate-700">{student.overallProgress}%</span>
                    </div>
                  </td>
                </tr>
              ))}
              {studentDataList.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-slate-500">No student data available.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
