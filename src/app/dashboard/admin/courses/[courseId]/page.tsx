'use client';

import { useEffect, useState, use } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase/firebase';
import { doc, getDoc, collection, query, where, getDocs, deleteDoc, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Course, Lesson, Test } from '@/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminCourseDetailsPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = use(params);
  const { appUser } = useAuth();
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCourseAndLessons() {
      try {
        // Fetch Course
        const courseDoc = await getDoc(doc(db, 'courses', courseId));
        if (courseDoc.exists()) {
          setCourse({ courseId: courseDoc.id, ...courseDoc.data() } as Course);
        }

        // Fetch Lessons
        const lessonsQuery = query(
          collection(db, 'lessons'), 
          where('courseId', '==', courseId),
          orderBy('order', 'asc')
        );
        const lessonsSnap = await getDocs(lessonsQuery);
        const fetchedLessons: Lesson[] = [];
        lessonsSnap.forEach(d => {
          fetchedLessons.push({ lessonId: d.id, ...d.data() } as Lesson);
        });
        
        setLessons(fetchedLessons);

        // Fetch Tests
        const testsQuery = query(
          collection(db, 'tests'),
          where('courseId', '==', courseId),
          orderBy('createdAt', 'asc')
        );
        const testsSnap = await getDocs(testsQuery);
        const fetchedTests: Test[] = [];
        testsSnap.forEach(d => {
          fetchedTests.push({ testId: d.id, ...d.data() } as Test);
        });
        setTests(fetchedTests);

        // Fetch Assignments
        const assignmentsQuery = query(
          collection(db, 'assignments'),
          where('courseId', '==', courseId),
          orderBy('createdAt', 'desc')
        );
        const assignmentsSnap = await getDocs(assignmentsQuery);
        const fetchedAssignments: any[] = [];
        assignmentsSnap.forEach(d => {
          fetchedAssignments.push({ assignmentId: d.id, ...d.data() });
        });
        setAssignments(fetchedAssignments);

      } catch (error) {
        console.error("Error fetching course data:", error);
      } finally {
        setLoading(false);
      }
    }

    if (courseId) {
      fetchCourseAndLessons();
    }
  }, [courseId]);

  const handleDeleteLesson = async (lessonId: string) => {
    if (confirm("Are you sure you want to delete this lesson?")) {
      try {
        await deleteDoc(doc(db, 'lessons', lessonId));
        setLessons(lessons.filter(l => l.lessonId !== lessonId));
      } catch (error) {
        console.error("Error deleting lesson:", error);
        alert("Failed to delete lesson.");
      }
    }
  };

  if (appUser?.role !== 'admin') {
    return <div className="p-8 text-center text-red-500">Access Denied. Admins only.</div>;
  }

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading course...</div>;
  }

  if (!course) {
    return <div className="p-8 text-center text-red-500">Course not found.</div>;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" onClick={() => router.push('/dashboard/admin/courses')}>Back to Courses</Button>
      </div>

      <Card className="bg-slate-900 text-white border-0">
        <CardContent className="p-8 md:p-10 flex flex-col md:flex-row gap-8 items-center">
          {course.thumbnail && (
            <img src={course.thumbnail} alt={course.title} className="w-full md:w-1/3 rounded-lg object-cover aspect-video shadow-lg" />
          )}
          <div className="flex-1 space-y-4">
            <h1 className="text-3xl font-bold">{course.title}</h1>
            <p className="text-slate-300">{course.description}</p>
            <div className="pt-4 flex flex-wrap gap-3">
              <Link href={`/dashboard/admin/courses/${courseId}/edit`} className={buttonVariants({ variant: "secondary" })}>
                Edit Course Details
              </Link>
              <Link href={`/dashboard/admin/courses/${courseId}/media`} className={buttonVariants({ variant: "default", className: "bg-blue-600 hover:bg-blue-700 text-white" })}>
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                Media Manager
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-end pt-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Curriculum</h2>
          <p className="text-slate-500">Manage the lessons for this course.</p>
        </div>
        <Link href={`/dashboard/admin/courses/${courseId}/lessons/new`} className={buttonVariants()}>
          Add Lesson
        </Link>
      </div>

      {lessons.length === 0 ? (
        <Card className="border-dashed border-2 bg-slate-50 text-center py-12">
          <CardContent className="space-y-4">
            <h3 className="text-xl font-bold text-slate-700">No Lessons Yet</h3>
            <p className="text-slate-500">Add the first video lesson to start building your curriculum.</p>
            <Link href={`/dashboard/admin/courses/${courseId}/lessons/new`} className={buttonVariants({ variant: "outline" })}>
              Add First Lesson
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {lessons.map((lesson) => (
            <Card key={lesson.lessonId} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="bg-amber-100 text-amber-700 font-bold w-10 h-10 rounded-full flex items-center justify-center shrink-0">
                  {lesson.order}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-900 truncate">{lesson.title}</h4>
                  <div className="flex gap-4 text-xs text-slate-500 mt-1">
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                      Video Attached
                    </span>
                    {lesson.notesPdf && (
                      <span className="flex items-center gap-1 text-blue-600">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        PDF Attached
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Link href={`/dashboard/admin/courses/${courseId}/lessons/${lesson.lessonId}/edit`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                    Edit
                  </Link>
                  <Button variant="destructive" size="sm" onClick={() => lesson.lessonId && handleDeleteLesson(lesson.lessonId)}>
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Tests Section */}
      <div className="flex justify-between items-end pt-8 border-t">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Tests & Assessments</h2>
          <p className="text-slate-500">Manage MCQ tests for this course.</p>
        </div>
        <Link href={`/dashboard/admin/courses/${courseId}/tests/new`} className={buttonVariants()}>
          Add Test
        </Link>
      </div>

      {tests.length === 0 ? (
        <Card className="border-dashed border-2 bg-slate-50 text-center py-12">
          <CardContent className="space-y-4">
            <h3 className="text-xl font-bold text-slate-700">No Tests Yet</h3>
            <p className="text-slate-500">Create the first MCQ test for your students.</p>
            <Link href={`/dashboard/admin/courses/${courseId}/tests/new`} className={buttonVariants({ variant: "outline" })}>
              Create First Test
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tests.map((test) => (
            <Card key={test.testId} className="hover:shadow-md transition-shadow flex flex-col">
              <CardContent className="p-6 flex flex-col flex-1">
                <h3 className="text-lg font-bold text-slate-900 mb-2">{test.title}</h3>
                <p className="text-sm text-slate-500 line-clamp-2 flex-1">{test.description}</p>
                <div className="flex items-center gap-4 text-xs text-slate-500 mt-4 font-medium bg-slate-50 p-2 rounded w-max">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {test.durationMinutes} mins
                  </span>
                </div>
                <div className="mt-6">
                  <Link href={`/dashboard/admin/courses/${courseId}/tests/${test.testId}`} className={buttonVariants({ variant: "outline", className: "w-full" })}>
                    Manage Questions
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {/* Assignments Section */}
      <div className="flex justify-between items-end pt-8 border-t">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Assignments</h2>
          <p className="text-slate-500">Manage homework and assignments for this course.</p>
        </div>
        <Link href={`/dashboard/admin/courses/${courseId}/assignments/new`} className={buttonVariants()}>
          Add Assignment
        </Link>
      </div>

      {assignments.length === 0 ? (
        <Card className="border-dashed border-2 bg-slate-50 text-center py-12">
          <CardContent className="space-y-4">
            <h3 className="text-xl font-bold text-slate-700">No Assignments Yet</h3>
            <p className="text-slate-500">Create the first assignment for your students to submit.</p>
            <Link href={`/dashboard/admin/courses/${courseId}/assignments/new`} className={buttonVariants({ variant: "outline" })}>
              Create First Assignment
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assignments.map((assignment) => (
            <Card key={assignment.assignmentId} className="hover:shadow-md transition-shadow flex flex-col">
              <CardContent className="p-6 flex flex-col flex-1">
                <h3 className="text-lg font-bold text-slate-900 mb-2">{assignment.title}</h3>
                <p className="text-sm text-slate-500 line-clamp-2 flex-1">{assignment.description}</p>
                <div className="flex items-center gap-4 text-xs text-slate-500 mt-4 font-medium bg-slate-50 p-2 rounded w-max">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    {assignment.dueDate ? new Date(assignment.dueDate.toMillis()).toLocaleDateString() : 'No Due Date'}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {assignment.totalMarks} Marks
                  </span>
                </div>
                <div className="mt-6">
                  <Link href={`/dashboard/admin/courses/${courseId}/assignments/${assignment.assignmentId}`} className={buttonVariants({ variant: "outline", className: "w-full" })}>
                    View Submissions
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
