'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase/firebase';
import { doc, getDoc, collection, query, where, getDocs, updateDoc, deleteDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Assignment, AssignmentSubmission } from '@/types';
import Link from 'next/link';

export default function AdminAssignmentDetailsPage({ params }: { params: Promise<{ courseId: string, assignmentId: string }> }) {
  const { courseId, assignmentId } = use(params);
  const router = useRouter();
  
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  // Grading Modal State
  const [gradingSubmission, setGradingSubmission] = useState<AssignmentSubmission | null>(null);
  const [marks, setMarks] = useState('');
  const [feedback, setFeedback] = useState('');
  const [savingGrade, setSavingGrade] = useState(false);

  useEffect(() => {
    fetchData();
  }, [assignmentId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Assignment
      const docRef = doc(db, 'assignments', assignmentId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setAssignment({ assignmentId: docSnap.id, ...docSnap.data() } as Assignment);
      }

      // Fetch Submissions
      const q = query(collection(db, 'assignment_submissions'), where('assignmentId', '==', assignmentId));
      const snap = await getDocs(q);
      const subs: AssignmentSubmission[] = [];
      snap.forEach(d => {
        subs.push({ submissionId: d.id, ...d.data() } as AssignmentSubmission);
      });
      setSubmissions(subs);
    } catch (error) {
      console.error('Error fetching assignment data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGradeSubmit = async () => {
    if (!gradingSubmission?.submissionId) return;
    
    setSavingGrade(true);
    try {
      const submissionRef = doc(db, 'assignment_submissions', gradingSubmission.submissionId);
      await updateDoc(submissionRef, {
        marks: Number(marks),
        feedback,
        status: 'graded'
      });
      
      setSubmissions(prev => prev.map(s => 
        s.submissionId === gradingSubmission.submissionId 
          ? { ...s, marks: Number(marks), feedback, status: 'graded' } 
          : s
      ));
      
      setGradingSubmission(null);
      setMarks('');
      setFeedback('');
    } catch (error) {
      console.error('Error grading submission:', error);
      alert('Failed to save grade.');
    } finally {
      setSavingGrade(false);
    }
  };

  const handleDeleteAssignment = async () => {
    if (!confirm('Are you sure you want to delete this assignment and all its submissions?')) return;
    
    try {
      await deleteDoc(doc(db, 'assignments', assignmentId));
      // Optionally delete all submissions too, or let a cloud function clean them up.
      for (const sub of submissions) {
        if (sub.submissionId) {
          await deleteDoc(doc(db, 'assignment_submissions', sub.submissionId));
        }
      }
      alert('Assignment deleted.');
      router.push(`/dashboard/admin/courses/${courseId}`);
    } catch (error) {
      console.error('Error deleting assignment:', error);
      alert('Failed to delete assignment.');
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading assignment details...</div>;
  }

  if (!assignment) {
    return <div className="p-8 text-center text-red-500">Assignment not found.</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Grading Modal */}
      {gradingSubmission && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg bg-white shadow-xl">
            <CardHeader>
              <CardTitle>Grade Submission</CardTitle>
              <CardDescription>Student: {gradingSubmission.studentName}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-md space-y-2 border">
                <h4 className="font-semibold text-sm">Student's Work:</h4>
                {gradingSubmission.textSubmission && (
                  <div className="text-sm whitespace-pre-wrap">{gradingSubmission.textSubmission}</div>
                )}
                {gradingSubmission.fileUrl && (
                  <a href={gradingSubmission.fileUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                    View Attached File
                  </a>
                )}
                {!gradingSubmission.textSubmission && !gradingSubmission.fileUrl && (
                  <div className="text-sm text-slate-500 italic">No content submitted.</div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Marks (Out of {assignment.totalMarks})</Label>
                  <Input 
                    type="number" 
                    max={assignment.totalMarks}
                    min={0}
                    value={marks} 
                    onChange={(e) => setMarks(e.target.value)} 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Feedback / Comments</Label>
                <Textarea 
                  rows={4} 
                  value={feedback} 
                  onChange={(e) => setFeedback(e.target.value)} 
                  placeholder="Provide feedback to the student..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setGradingSubmission(null)} disabled={savingGrade}>Cancel</Button>
                <Button className="flex-1 bg-amber-600 hover:bg-amber-700 text-white" onClick={handleGradeSubmit} disabled={savingGrade}>
                  {savingGrade ? 'Saving...' : 'Save Grade'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Link href="/dashboard/admin/courses" className="hover:text-amber-600">Courses</Link>
          <span>/</span>
          <Link href={`/dashboard/admin/courses/${courseId}`} className="hover:text-amber-600">Course Details</Link>
          <span>/</span>
          <span className="text-slate-900 font-medium truncate max-w-[200px]">{assignment.title}</span>
        </div>
        <Button variant="destructive" size="sm" onClick={handleDeleteAssignment}>
          Delete Assignment
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Assignment Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs text-slate-500 uppercase">Title</Label>
                <div className="font-semibold">{assignment.title}</div>
              </div>
              <div>
                <Label className="text-xs text-slate-500 uppercase">Total Marks</Label>
                <div className="font-medium">{assignment.totalMarks}</div>
              </div>
              <div>
                <Label className="text-xs text-slate-500 uppercase">Due Date</Label>
                <div className="font-medium">
                  {assignment.dueDate ? new Date(assignment.dueDate.toMillis()).toLocaleString() : 'No due date'}
                </div>
              </div>
              {assignment.fileUrl && (
                <div>
                  <Label className="text-xs text-slate-500 uppercase">Attachment</Label>
                  <div>
                    <a href={assignment.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm font-medium">
                      Download Reference File
                    </a>
                  </div>
                </div>
              )}
              <div>
                <Label className="text-xs text-slate-500 uppercase">Description</Label>
                <div className="text-sm whitespace-pre-wrap text-slate-700 mt-1">{assignment.description}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Student Submissions</CardTitle>
                <CardDescription>{submissions.length} students have submitted work.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {submissions.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-lg bg-slate-50">
                  <p className="text-slate-500">No submissions received yet.</p>
                </div>
              ) : (
                <div className="divide-y border rounded-lg">
                  {submissions.map((sub) => (
                    <div key={sub.submissionId} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white hover:bg-slate-50 transition-colors">
                      <div>
                        <div className="font-bold text-slate-900">{sub.studentName}</div>
                        <div className="text-xs text-slate-500">
                          Submitted on {sub.submittedAt ? new Date(sub.submittedAt.toMillis()).toLocaleString() : 'Unknown Date'}
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          {sub.status === 'graded' ? (
                            <span className="bg-green-100 text-green-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-green-200">
                              Graded: {sub.marks} / {assignment.totalMarks}
                            </span>
                          ) : (
                            <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-amber-200">
                              Needs Grading
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant={sub.status === 'graded' ? 'outline' : 'default'}
                          onClick={() => {
                            setGradingSubmission(sub);
                            setMarks(sub.marks ? sub.marks.toString() : '');
                            setFeedback(sub.feedback || '');
                          }}
                        >
                          {sub.status === 'graded' ? 'Edit Grade' : 'Grade Submission'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
