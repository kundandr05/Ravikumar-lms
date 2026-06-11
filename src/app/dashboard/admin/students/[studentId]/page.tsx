'use client';

import { useEffect, useState, use } from 'react';
import { db } from '@/lib/firebase/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';

interface StudentInfo {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  createdAt?: any;
}

interface EnrolledCourseInfo {
  enrollmentId: string;
  courseId: string;
  courseTitle: string;
  enrolledAt: any;
  status: string;
  progressPercentage: number;
}

export default function StudentDetailsPage({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = use(params);
  
  const [student, setStudent] = useState<StudentInfo | null>(null);
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourseInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchStudentData() {
      try {
        setLoading(true);

        // 1. Fetch Student User Details
        const userDoc = await getDoc(doc(db, 'users', studentId));
        if (!userDoc.exists()) {
          setError('Student not found');
          setLoading(false);
          return;
        }
        setStudent({ uid: userDoc.id, ...userDoc.data() } as StudentInfo);

        // 2. Fetch Enrollments for this student
        const enrollQuery = query(collection(db, 'enrollments'), where('studentId', '==', studentId));
        const enrollSnap = await getDocs(enrollQuery);
        
        if (enrollSnap.empty) {
          setEnrolledCourses([]);
          setLoading(false);
          return;
        }

        const enrollments = enrollSnap.docs.map(d => ({ enrollmentId: d.id, ...d.data() }));

        // 3. Fetch all courses to get titles
        const coursesSnap = await getDocs(collection(db, 'courses'));
        const coursesMap: Record<string, string> = {};
        coursesSnap.forEach(d => {
          coursesMap[d.id] = d.data().title;
        });

        // 4. Fetch Progress to calculate percentages
        // Get all lessons to count totals per course
        const allLessonsSnap = await getDocs(collection(db, 'lessons'));
        const lessonCounts: Record<string, number> = {};
        allLessonsSnap.forEach(d => {
          const cId = d.data().courseId;
          lessonCounts[cId] = (lessonCounts[cId] || 0) + 1;
        });

        // Get student's completed lessons
        const progSnap = await getDocs(
          query(collection(db, 'lessonProgress'), where('studentId', '==', studentId), where('completed', '==', true))
        );
        const progCounts: Record<string, number> = {};
        progSnap.forEach(d => {
          const cId = d.data().courseId;
          progCounts[cId] = (progCounts[cId] || 0) + 1;
        });

        // 5. Combine data
        const combinedData: EnrolledCourseInfo[] = enrollments.map((en: any) => {
          const total = lessonCounts[en.courseId] || 0;
          const completed = progCounts[en.courseId] || 0;
          const progressPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;

          return {
            enrollmentId: en.enrollmentId,
            courseId: en.courseId,
            courseTitle: coursesMap[en.courseId] || 'Unknown Course',
            enrolledAt: en.enrolledAt,
            status: en.status || 'active',
            progressPercentage
          };
        });

        setEnrolledCourses(combinedData);

      } catch (err) {
        console.error("Error fetching student details:", err);
        setError("Failed to load student details");
      } finally {
        setLoading(false);
      }
    }

    fetchStudentData();
  }, [studentId]);

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading student details...</div>;
  if (error || !student) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/dashboard/admin/enrollments" className="text-primary hover:underline text-sm font-medium mb-2 inline-block">&larr; Back to Enrollments</Link>
          <h1 className="text-3xl font-bold text-foreground">Student Profile</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Personal Details Card */}
        <Card className="md:col-span-1 shadow-sm">
          <CardHeader className="bg-muted/50 border-b">
            <CardTitle className="text-lg">Personal Details</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-4 border-b pb-4">
              <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center text-2xl font-bold uppercase">
                {student.name.substring(0, 2)}
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">{student.name}</h2>
                <span className="inline-block px-2 py-1 bg-muted text-muted-foreground text-xs rounded-full mt-1">Student</span>
              </div>
            </div>
            
            <div className="space-y-3 pt-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email Address</p>
                <p className="text-foreground">{student.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Phone Number</p>
                <p className="text-foreground">{student.phone || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Registered On</p>
                <p className="text-foreground">{student.createdAt?.toDate ? student.createdAt.toDate().toLocaleDateString() : 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enrollments & Progress */}
        <Card className="md:col-span-2 shadow-sm">
          <CardHeader className="bg-muted/50 border-b flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Enrolled Courses & Progress</CardTitle>
            <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
              {enrolledCourses.length} Courses
            </span>
          </CardHeader>
          <CardContent className="p-0">
            {enrolledCourses.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                This student is not enrolled in any courses yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {enrolledCourses.map(course => (
                  <div key={course.courseId} className="p-6 hover:bg-muted/50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-bold text-lg text-foreground">{course.courseTitle}</h3>
                        <p className="text-xs text-muted-foreground">Enrolled: {course.enrolledAt?.toDate ? course.enrolledAt.toDate().toLocaleDateString() : 'N/A'}</p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${course.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                        {course.status}
                      </span>
                    </div>
                    
                    <div className="mt-4">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-foreground">Course Progress</span>
                        <span className="text-sm font-bold text-emerald-600">{course.progressPercentage}%</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-emerald-500 h-full rounded-full transition-all" 
                          style={{ width: `${course.progressPercentage}%` }} 
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
