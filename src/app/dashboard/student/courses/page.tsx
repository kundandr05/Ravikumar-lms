'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Course } from '@/types';
import Link from 'next/link';

export default function StudentCoursesPage() {
  const { appUser } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEnrolledCourses() {
      if (!appUser?.uid) return;

      try {
        // 1. Get enrollments for student
        const enrollmentsQuery = query(collection(db, 'enrollments'), where('studentId', '==', appUser.uid));
        const enrollmentsSnap = await getDocs(enrollmentsQuery);
        
        if (enrollmentsSnap.empty) {
          setCourses([]);
          setLoading(false);
          return;
        }

        // 2. Extract courseIds
        const courseIds = enrollmentsSnap.docs.map(doc => doc.data().courseId);

        // 3. Fetch each course document
        // Note: Firestore 'in' query supports max 10 values, so we fetch individually or in chunks.
        // For simple LMS, doing individual gets is fine.
        const coursePromises = courseIds.map(id => getDoc(doc(db, 'courses', id)));
        const courseDocs = await Promise.all(coursePromises);
        
        const fetchedCourses: Course[] = [];
        courseDocs.forEach(d => {
          if (d.exists()) {
            fetchedCourses.push({ courseId: d.id, ...d.data() } as Course);
          }
        });

        setCourses(fetchedCourses);
      } catch (error) {
        console.error("Error fetching student courses:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchEnrolledCourses();
  }, [appUser]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">My Courses</h1>
        <p className="text-slate-500 mt-2">Access your enrolled courses and continue learning.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2].map(i => (
            <Card key={i} className="animate-pulse">
              <div className="h-40 bg-slate-200"></div>
              <CardContent className="p-6 space-y-4">
                <div className="h-6 bg-slate-200 rounded w-2/3"></div>
                <div className="h-4 bg-slate-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : courses.length === 0 ? (
        <Card className="border-dashed border-2 bg-slate-50 text-center py-16">
          <CardContent className="space-y-4">
            <svg className="w-16 h-16 text-slate-300 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            <h3 className="text-xl font-bold text-slate-700">No Courses Yet</h3>
            <p className="text-slate-500">You haven't enrolled in any courses.</p>
            <Link href="/courses" className={buttonVariants({ variant: "outline", className: "mt-4" })}>
              Explore Available Courses
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Card key={course.courseId} className="overflow-hidden flex flex-col hover:shadow-lg transition-shadow border-0 shadow">
              <div className="w-full h-48 bg-amber-100 relative">
                {course.thumbnail ? (
                  <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-amber-500">
                    <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </div>
                )}
              </div>
              <CardContent className="p-6 flex flex-col flex-1">
                <h3 className="text-xl font-bold text-slate-900 mb-2">{course.title}</h3>
                <p className="text-sm text-slate-600 line-clamp-2 mb-6 flex-1">{course.description}</p>
                <Link 
                  href={`/dashboard/student/courses/${course.courseId}`} 
                  className={buttonVariants({ className: "w-full bg-slate-900 hover:bg-slate-800" })}
                >
                  Start Learning
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
