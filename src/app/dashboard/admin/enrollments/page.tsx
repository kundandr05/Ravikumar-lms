'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase/firebase';
import { collection, getDocs, doc, deleteDoc, query, where } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Enrollment, Course } from '@/types';
import Link from 'next/link';

interface ExtendedEnrollment extends Enrollment {
  studentName?: string;
  courseTitle?: string;
  studentEmail?: string;
}

export default function AdminEnrollmentsPage() {
  const [enrollments, setEnrollments] = useState<ExtendedEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCourse, setFilterCourse] = useState('All');

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch enrollments
        const enrollmentsSnap = await getDocs(collection(db, 'enrollments'));
        const enrollmentsData: Enrollment[] = [];
        enrollmentsSnap.forEach(doc => {
          enrollmentsData.push({ enrollmentId: doc.id, ...doc.data() } as Enrollment);
        });

        // Fetch courses for mapping
        const coursesSnap = await getDocs(collection(db, 'courses'));
        const coursesMap: Record<string, string> = {};
        coursesSnap.forEach(doc => {
          coursesMap[doc.id] = doc.data().title;
        });

        // Fetch users for mapping
        const usersSnap = await getDocs(collection(db, 'users'));
        const usersMap: Record<string, {name: string, email: string}> = {};
        usersSnap.forEach(doc => {
          usersMap[doc.id] = { name: doc.data().name, email: doc.data().email };
        });

        // Combine
        const combined = enrollmentsData.map(enroll => ({
          ...enroll,
          studentName: usersMap[enroll.studentId]?.name || 'Unknown Student',
          studentEmail: usersMap[enroll.studentId]?.email || 'N/A',
          courseTitle: coursesMap[enroll.courseId] || 'Unknown Course',
        }));

        setEnrollments(combined);
      } catch (error) {
        console.error("Error fetching enrollments data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const handleDeleteEnrollment = async (enrollmentId: string, studentId: string, courseId: string) => {
    if (!confirm('Are you sure you want to unenroll this student? All their progress and test scores for this course will be permanently deleted.')) return;

    try {
      // 1. Delete Enrollment
      await deleteDoc(doc(db, 'enrollments', enrollmentId));

      // 2. Cascade Delete Test Attempts
      const testAttemptsQuery = query(collection(db, 'testAttempts'), where('studentId', '==', studentId), where('courseId', '==', courseId));
      const testAttemptsSnap = await getDocs(testAttemptsQuery);
      testAttemptsSnap.forEach(async (d) => {
        await deleteDoc(doc(db, 'testAttempts', d.id));
      });

      // 3. Cascade Delete Media Progress
      const mediaProgressQuery = query(collection(db, 'mediaProgress'), where('studentId', '==', studentId), where('courseId', '==', courseId));
      const mediaProgressSnap = await getDocs(mediaProgressQuery);
      mediaProgressSnap.forEach(async (d) => {
        await deleteDoc(doc(db, 'mediaProgress', d.id));
      });

      setEnrollments(prev => prev.filter(e => e.enrollmentId !== enrollmentId));
      alert('Student unenrolled and progress reset to 0.');
    } catch (error) {
      console.error('Error deleting enrollment:', error);
      alert('Failed to delete enrollment.');
    }
  };

  const uniqueCourses = Array.from(new Set(enrollments.map(e => e.courseTitle).filter(Boolean)));
  const displayedEnrollments = filterCourse === 'All' ? enrollments : enrollments.filter(e => e.courseTitle === filterCourse);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Enrollments</h1>
          <p className="text-muted-foreground mt-2">Track which students are enrolled in which courses.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Filter by Course:</span>
          <select 
            value={filterCourse} 
            onChange={(e) => setFilterCourse(e.target.value)}
            className="border rounded px-3 py-1.5 text-sm bg-card text-foreground"
          >
            <option value="All">All Courses</option>
            {uniqueCourses.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Enrollments ({displayedEnrollments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-center py-8">Loading enrollments...</p>
          ) : displayedEnrollments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border rounded-lg border-dashed">
              No enrollments found matching the filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b text-sm text-muted-foreground">
                    <th className="pb-3 font-medium">Student Name</th>
                    <th className="pb-3 font-medium">Email</th>
                    <th className="pb-3 font-medium">Course Title</th>
                    <th className="pb-3 font-medium">Date Enrolled</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayedEnrollments.map((enrollment) => (
                    <tr key={enrollment.enrollmentId} className="hover:bg-muted/50 transition-colors">
                      <td className="py-4 font-medium text-foreground">
                        <Link href={`/dashboard/admin/students/${enrollment.studentId}`} className="hover:text-primary hover:underline transition-colors">
                          {enrollment.studentName}
                        </Link>
                      </td>
                      <td className="py-4 text-muted-foreground">{enrollment.studentEmail}</td>
                      <td className="py-4 text-foreground font-medium">{enrollment.courseTitle}</td>
                      <td className="py-4 text-muted-foreground text-sm">
                        {enrollment.enrolledAt?.toDate ? enrollment.enrolledAt.toDate().toLocaleDateString() : 'Unknown'}
                      </td>
                      <td className="py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 capitalize">
                          {enrollment.status || 'Active'}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteEnrollment(enrollment.enrollmentId!, enrollment.studentId, enrollment.courseId)}>
                          Unenroll
                        </Button>
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
