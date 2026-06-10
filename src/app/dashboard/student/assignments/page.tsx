'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import { Assignment, AssignmentSubmission } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function StudentAssignmentsPage() {
  const { appUser } = useAuth();
  const [assignments, setAssignments] = useState<(Assignment & { courseName: string, status?: string, marks?: number })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (appUser?.uid) {
      fetchAssignments();
    }
  }, [appUser]);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      // 1. Get enrolled courses
      const enrollQuery = query(collection(db, 'enrollments'), where('studentId', '==', appUser!.uid));
      const enrollSnap = await getDocs(enrollQuery);
      
      if (enrollSnap.empty) {
        setAssignments([]);
        setLoading(false);
        return;
      }

      const enrolledCourseIds = new Set<string>();
      enrollSnap.forEach(doc => enrolledCourseIds.add(doc.data().courseId));

      // 2. Fetch course names for display
      const coursesSnap = await getDocs(collection(db, 'courses'));
      const courseMap: Record<string, string> = {};
      coursesSnap.forEach(doc => {
        courseMap[doc.id] = doc.data().title;
      });

      // 3. Fetch all assignments
      const assignQuery = query(collection(db, 'assignments'), orderBy('createdAt', 'desc'));
      const assignSnap = await getDocs(assignQuery);
      
      const availableAssignments: (Assignment & { courseName: string, status?: string, marks?: number })[] = [];
      const assignmentIds: string[] = [];
      
      assignSnap.forEach(d => {
        const data = { assignmentId: d.id, ...d.data() } as Assignment;
        if (enrolledCourseIds.has(data.courseId)) {
          availableAssignments.push({
            ...data,
            courseName: courseMap[data.courseId] || 'Unknown Course',
            status: 'pending' // default status
          });
          assignmentIds.push(d.id);
        }
      });

      // 4. Fetch user's submissions to update status
      if (assignmentIds.length > 0) {
        const subsQuery = query(collection(db, 'assignment_submissions'), where('studentId', '==', appUser!.uid));
        const subsSnap = await getDocs(subsQuery);
        
        const subMap: Record<string, AssignmentSubmission> = {};
        subsSnap.forEach(d => {
          const sub = d.data() as AssignmentSubmission;
          subMap[sub.assignmentId] = sub;
        });

        for (let i = 0; i < availableAssignments.length; i++) {
          const aid = availableAssignments[i].assignmentId!;
          if (subMap[aid]) {
            availableAssignments[i].status = subMap[aid].status;
            availableAssignments[i].marks = subMap[aid].marks;
          }
        }
      }
      
      setAssignments(availableAssignments);
    } catch (error) {
      console.error("Error fetching assignments:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Assignments</h1>
        <p className="text-slate-500 mt-2">Submit your homework and view grades.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Course Assignments</CardTitle>
          <CardDescription>All assignments from your enrolled courses.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-slate-500 flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mb-4"></div>
              Loading assignments...
            </div>
          ) : assignments.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed rounded-lg bg-slate-50 text-slate-500 flex flex-col items-center">
              <svg className="w-12 h-12 text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
              <p className="text-lg font-medium text-slate-700">No Assignments Yet</p>
              <p className="text-sm mt-1">There are currently no active assignments in your enrolled courses.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {assignments.map((assignment) => (
                <Card key={assignment.assignmentId} className="flex flex-col hover:shadow-lg transition-shadow border-slate-200">
                  <div className={`h-2 w-full rounded-t-xl ${assignment.status === 'graded' ? 'bg-green-500' : assignment.status === 'submitted' ? 'bg-blue-500' : 'bg-amber-500'}`}></div>
                  <CardContent className="p-6 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{assignment.courseName}</div>
                      {assignment.status === 'graded' ? (
                        <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">Graded</span>
                      ) : assignment.status === 'pending' && assignment.marks === undefined && assignment.status !== 'pending' ? ( // Handle weird states if any
                        <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">Pending</span>
                      ) : (
                        // If it's in the DB as pending but exists in submissions, it means submitted but not graded
                         <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">Submitted</span>
                      )}
                    </div>
                    
                    <h3 className="text-xl font-bold text-slate-900 mb-2">{assignment.title}</h3>
                    <p className="text-sm text-slate-500 line-clamp-3 mb-4 flex-1">{assignment.description}</p>
                    
                    <div className="flex flex-wrap items-center gap-2 mb-6">
                      <span className="flex items-center gap-1.5 text-xs font-medium bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {assignment.dueDate ? new Date(assignment.dueDate.toMillis()).toLocaleDateString() : 'No Due Date'}
                      </span>
                      {assignment.status === 'graded' && (
                        <span className="flex items-center gap-1.5 text-xs font-bold bg-green-50 text-green-700 px-2.5 py-1 rounded-md border border-green-200">
                           Score: {assignment.marks} / {assignment.totalMarks}
                        </span>
                      )}
                    </div>

                    <Link 
                      href={`/dashboard/student/assignments/${assignment.assignmentId}`} 
                      className={buttonVariants({ variant: assignment.status === 'graded' ? "outline" : "default", className: "w-full" })}
                    >
                      {assignment.status === 'graded' ? 'View Feedback' : 'View & Submit'}
                      <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </Link>
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
