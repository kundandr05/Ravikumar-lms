'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase/firebase';
import { collection, query, where, getDocs, doc, addDoc, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Course } from '@/types';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import confetti from 'canvas-confetti';

interface EnrolledCourse extends Course {
  progressPercentage?: number;
  status?: string;
}

export default function StudentCoursesPage() {
  const { appUser } = useAuth();
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrollingId, setEnrollingId] = useState<string | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    fetchCoursesData();
  }, [appUser]);

  useEffect(() => {
    if (searchParams.get('completedCourseId')) {
      // Trigger confetti
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: Math.random(), y: Math.random() - 0.2 } });
      }, 250);
    }
  }, [searchParams]);

  async function fetchCoursesData() {
    if (!appUser?.uid) return;
    setLoading(true);

    try {
      // 1. Get enrollments for student
      const enrollmentsQuery = query(collection(db, 'enrollments'), where('studentId', '==', appUser.uid));
      const enrollmentsSnap = await getDocs(enrollmentsQuery);
      
      const enrollmentsMap = new Map();
      enrollmentsSnap.docs.forEach(doc => {
        enrollmentsMap.set(doc.data().courseId, doc.data().status);
      });

      // 2. Fetch ALL courses
      const coursesSnap = await getDocs(collection(db, 'courses'));
      const allCourses: Course[] = [];
      coursesSnap.forEach(d => {
        allCourses.push({ courseId: d.id, ...d.data() } as Course);
      });

      // 3. Split into enrolled and available
      const enrolled: EnrolledCourse[] = [];
      const available: Course[] = [];

      allCourses.forEach(course => {
        if (enrollmentsMap.has(course.courseId)) {
          enrolled.push({ ...course, status: enrollmentsMap.get(course.courseId) });
        } else {
          available.push(course);
        }
      });

      // 4. Fetch Progress for enrolled courses
      if (enrolled.length > 0) {
        // Fetch all lessons to get total counts per course
        const allLessonsSnap = await getDocs(collection(db, 'lessons'));
        const lessonCounts: Record<string, number> = {};
        allLessonsSnap.forEach(d => {
          const cId = d.data().courseId;
          lessonCounts[cId] = (lessonCounts[cId] || 0) + 1;
        });

        // Fetch all progress for student
        const progSnap = await getDocs(
          query(collection(db, 'lessonProgress'), where('studentId', '==', appUser.uid), where('completed', '==', true))
        );
        const progCounts: Record<string, number> = {};
        progSnap.forEach(d => {
          const cId = d.data().courseId;
          progCounts[cId] = (progCounts[cId] || 0) + 1;
        });

        // Calculate percentages
        enrolled.forEach(c => {
          const total = lessonCounts[c.courseId!] || 0;
          const completed = progCounts[c.courseId!] || 0;
          c.progressPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;
        });
      }

      setEnrolledCourses(enrolled);
      setAvailableCourses(available);
    } catch (error) {
      console.error("Error fetching courses data:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleEnroll = async (course: Course) => {
    if (!appUser?.uid || !course.courseId) return;
    
    setEnrollingId(course.courseId);
    try {
      await addDoc(collection(db, 'enrollments'), {
        studentId: appUser.uid,
        courseId: course.courseId,
        enrolledAt: serverTimestamp(),
      });

      // Send Welcome Notification
      await fetch('/api/notify/enrollment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: appUser.name || 'Student',
          email: appUser.email,
          phone: (appUser as any).phone || '7019934034',
          courseTitle: course.title,
          sendViaEmail: true,
          sendViaWhatsApp: true
        })
      });

      // Refresh the lists
      await fetchCoursesData();
    } catch (error) {
      console.error("Error enrolling in course:", error);
      alert("Failed to enroll. Please try again.");
    } finally {
      setEnrollingId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      {/* Enrolled Courses Section */}
      <section className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Courses</h1>
          <p className="text-muted-foreground mt-2">Access your enrolled courses and continue learning.</p>
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
        ) : enrolledCourses.length === 0 ? (
          <Card className="border-dashed border-2 bg-muted/50 text-center py-16">
            <CardContent className="space-y-4">
              <svg className="w-16 h-16 text-slate-300 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
              <h3 className="text-xl font-bold text-foreground">No Courses Yet</h3>
              <p className="text-muted-foreground">You haven't enrolled in any courses. Explore available courses below!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrolledCourses.map((course) => (
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
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-foreground">{course.title}</h3>
                    <span className="text-sm font-bold text-emerald-600">{course.progressPercentage}%</span>
                  </div>
                  <div className="w-full bg-muted h-1.5 rounded-full mb-4 overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full rounded-full transition-all duration-1000" 
                      style={{ width: `${course.progressPercentage}%` }} 
                    />
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-6 flex-1">{course.description}</p>
                  
                  {course.status === 'completed' ? (
                    <div className="w-full bg-green-100 text-green-800 font-bold py-2 px-4 rounded-md text-center text-sm border border-green-200 shadow-sm animate-pulse">
                      🎉 Congratulations on the completion of course!
                    </div>
                  ) : (
                    <Link 
                      href={`/dashboard/student/courses/${course.courseId}`} 
                      className={buttonVariants({ className: "w-full bg-slate-900 hover:bg-slate-800" })}
                    >
                      Start Learning
                    </Link>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Available Courses Section */}
      <section className="space-y-6 pt-8 border-t border-slate-200">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Available Courses</h2>
          <p className="text-muted-foreground mt-2">Discover new topics and enroll in courses created by the admin.</p>
        </div>

        {!loading && availableCourses.length === 0 ? (
          <div className="text-muted-foreground italic bg-muted/50 p-6 rounded-lg border">
            No new courses are available for enrollment at the moment.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableCourses.map((course) => (
              <Card key={course.courseId} className="overflow-hidden flex flex-col border border-slate-200">
                <div className="w-full h-40 bg-muted relative">
                  {course.thumbnail ? (
                    <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                      <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                    </div>
                  )}
                </div>
                <CardContent className="p-6 flex flex-col flex-1">
                  <h3 className="text-lg font-bold text-foreground mb-2">{course.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-6 flex-1">{course.description}</p>
                  <Button 
                    variant="outline"
                    className="w-full border-amber-500 text-amber-700 hover:bg-amber-50"
                    onClick={() => course.courseId && handleEnroll(course)}
                    disabled={enrollingId === course.courseId}
                  >
                    {enrollingId === course.courseId ? 'Enrolling...' : 'Enroll Now'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
