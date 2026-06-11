'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Enrollments</h1>
        <p className="text-muted-foreground mt-2">Track which students are enrolled in which courses.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Enrollments ({enrollments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-center py-8">Loading enrollments...</p>
          ) : enrollments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border rounded-lg border-dashed">
              No enrollments found.
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {enrollments.map((enrollment) => (
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
