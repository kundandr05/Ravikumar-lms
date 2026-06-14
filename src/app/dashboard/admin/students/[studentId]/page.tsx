'use client';

import { use, useEffect, useState } from 'react';
import { db } from '@/lib/firebase/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { format } from 'date-fns';
import { Target, Download, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StudentInfo {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  status?: string;
}

export default function StudentDetailsPage({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = use(params);
  const [student, setStudent] = useState<StudentInfo | null>(null);
  const [testAttempts, setTestAttempts] = useState<any[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
        setTestAttempts(testSnap.docs.map(d => d.data()));

        // Fetch Enrollments and Map to Courses
        const enrollQ = query(collection(db, 'enrollments'), where('studentId', '==', studentId));
        const enrollSnap = await getDocs(enrollQ);
        
        const courseIds = enrollSnap.docs.map(d => d.data().courseId);
        
        if (courseIds.length > 0) {
          const coursesQ = query(collection(db, 'courses'), where('__name__', 'in', courseIds.slice(0, 10)));
          const coursesSnap = await getDocs(coursesQ);
          const courseData = coursesSnap.docs.map(d => ({ id: d.id, title: d.data().title }));
          setEnrolledCourses(courseData);
        } else {
          setEnrolledCourses([]);
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
    <div className="max-w-4xl mx-auto space-y-8 pb-12 mt-8 print:mt-0 print:space-y-4">
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
          Download Report
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 print:block print:space-y-8">
        
        <div className="space-y-4">
          <h3 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-indigo-500" />
            Enrolled Courses
          </h3>
          {enrolledCourses.length === 0 ? (
            <div className="p-8 text-center border border-slate-800 rounded-lg text-muted-foreground bg-card">Not enrolled in any courses.</div>
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

        <div className="space-y-4">
          <h3 className="text-2xl font-bold flex items-center gap-2">
            <Target className="w-6 h-6 text-amber-500" />
            Test Scores
          </h3>
          {testAttempts.length === 0 ? (
            <div className="p-8 text-center border border-slate-800 rounded-lg text-muted-foreground bg-card">No tests taken yet.</div>
          ) : (
            <div className="grid gap-4">
              {testAttempts.map((test, i) => {
                const perc = test.totalScore > 0 ? Math.round((test.score / test.totalScore) * 100) : 0;
                return (
                  <div key={i} className="flex justify-between items-center p-6 rounded-xl border border-slate-800 bg-card hover:border-slate-700 transition-colors">
                    <div>
                      <h4 className="font-bold text-lg text-foreground">{test.testTitle}</h4>
                      <p className="text-xs text-muted-foreground mt-1">Attempted on {test.submittedAt ? format(test.submittedAt.toDate(), 'PPP p') : 'Unknown Date'}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-xl">{test.score} / {test.totalScore} <span className="text-muted-foreground font-medium text-base ml-1">({perc}%)</span></div>
                      <div className={`text-xs font-bold mt-1 ${test.passed ? 'text-green-500' : 'text-red-500'}`}>
                        {test.passed ? 'PASSED' : 'FAILED'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
