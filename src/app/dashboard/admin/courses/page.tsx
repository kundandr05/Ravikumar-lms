'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase/firebase';
import { collection, query, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Course } from '@/types';
import Link from 'next/link';

export default function AdminCoursesPage() {
  const { appUser } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'courses'));
      const querySnapshot = await getDocs(q);
      const coursesData: Course[] = [];
      querySnapshot.forEach((doc) => {
        coursesData.push({ courseId: doc.id, ...doc.data() } as Course);
      });
      setCourses(coursesData);
    } catch (error) {
      console.error("Error fetching courses", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (courseId: string) => {
    if (confirm("Are you sure you want to delete this course? All associated lessons will remain orphaned.")) {
      try {
        await deleteDoc(doc(db, 'courses', courseId));
        setCourses(courses.filter(c => c.courseId !== courseId));
      } catch (error) {
        console.error("Error deleting course", error);
        alert("Failed to delete course");
      }
    }
  };

  if (appUser?.role !== 'admin') {
    return <div className="p-8 text-center text-red-500">Access Denied. Admins only.</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Course Management</h1>
          <p className="text-slate-600">Create and manage your educational courses.</p>
        </div>
        <Link href="/dashboard/admin/courses/new" className={buttonVariants()}>Create New Course</Link>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>All Courses</CardTitle>
          <CardDescription>Manage syllabus and lessons for each course.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading courses...</p>
          ) : courses.length === 0 ? (
            <div className="text-center p-8 border border-dashed rounded-lg">
              <p className="text-slate-500 mb-4">You haven't created any courses yet.</p>
              <Link href="/dashboard/admin/courses/new" className={buttonVariants({ variant: "outline" })}>Create your first course</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <Card key={course.courseId} className="overflow-hidden flex flex-col">
                  {course.thumbnail && (
                    <div className="w-full h-40 bg-slate-200 overflow-hidden">
                      <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="text-xl">{course.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <p className="text-sm text-slate-600 line-clamp-3 mb-4">{course.description}</p>
                    <div className="flex flex-wrap gap-2 mt-auto">
                      <Link href={`/dashboard/admin/courses/${course.courseId}`} className={buttonVariants({ variant: "default", size: "sm", className: "flex-1" })}>
                        Manage Lessons
                      </Link>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => course.courseId && handleDelete(course.courseId)}
                      >
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
