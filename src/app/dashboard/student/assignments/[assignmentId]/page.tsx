'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { db, storage } from '@/lib/firebase/firebase';
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Assignment, AssignmentSubmission } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function StudentAssignmentDetailsPage({ params }: { params: Promise<{ assignmentId: string }> }) {
  const { assignmentId } = use(params);
  const router = useRouter();
  const { appUser } = useAuth();
  
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submission, setSubmission] = useState<AssignmentSubmission | null>(null);
  const [loading, setLoading] = useState(true);

  // Submission Form State
  const [textSubmission, setTextSubmission] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (appUser?.uid) {
      fetchData();
    }
  }, [appUser, assignmentId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Assignment
      const docRef = doc(db, 'assignments', assignmentId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setAssignment({ assignmentId: docSnap.id, ...docSnap.data() } as Assignment);
      } else {
        setLoading(false);
        return;
      }

      // Fetch Submission
      const q = query(
        collection(db, 'assignment_submissions'), 
        where('assignmentId', '==', assignmentId),
        where('studentId', '==', appUser!.uid)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        setSubmission({ submissionId: snap.docs[0].id, ...snap.docs[0].data() } as AssignmentSubmission);
      }
    } catch (error) {
      console.error('Error fetching assignment data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textSubmission && !file) {
      alert('Please provide a text response or attach a file.');
      return;
    }

    setSubmitting(true);
    try {
      let fileUrl = '';
      
      if (file) {
        const storageRef = ref(storage, `submissions/${assignmentId}/${appUser!.uid}_${file.name}`);
        const uploadResult = await uploadBytes(storageRef, file);
        fileUrl = await getDownloadURL(uploadResult.ref);
      }

      const submissionData = {
        assignmentId,
        studentId: appUser!.uid,
        courseId: assignment!.courseId,
        studentName: appUser!.name,
        submittedAt: serverTimestamp(),
        status: 'pending',
        ...(textSubmission && { textSubmission }),
        ...(fileUrl && { fileUrl }),
      };

      await addDoc(collection(db, 'assignment_submissions'), submissionData);
      
      alert('Assignment submitted successfully!');
      fetchData(); // Refresh to show submission
    } catch (error) {
      console.error('Error submitting assignment:', error);
      alert('Failed to submit assignment.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading assignment details...</div>;
  }

  if (!assignment) {
    return <div className="p-8 text-center text-red-500">Assignment not found.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/dashboard/student/assignments" className="hover:text-amber-600">Assignments</Link>
        <span>/</span>
        <span className="text-slate-900 font-medium truncate">{assignment.title}</span>
      </div>

      <Card>
        <CardHeader className="bg-slate-50 border-b">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl text-slate-900">{assignment.title}</CardTitle>
              <CardDescription className="mt-1">
                Due: {assignment.dueDate ? new Date(assignment.dueDate.toMillis()).toLocaleString() : 'No Due Date'}
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="font-bold text-slate-900">{assignment.totalMarks} Points</div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="prose max-w-none">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Instructions</h3>
            <p className="text-slate-700 whitespace-pre-wrap">{assignment.description}</p>
          </div>
          
          {assignment.fileUrl && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3 text-blue-800">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                <span className="font-medium">Reference Material</span>
              </div>
              <a href={assignment.fileUrl} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "outline", size: "sm" })}>
                Download
              </a>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submission Section */}
      {submission ? (
        <Card className="border-green-200">
          <CardHeader className="bg-green-50 border-b border-green-200">
            <CardTitle className="text-green-800 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              Assignment Submitted
            </CardTitle>
            <CardDescription className="text-green-700">
              Submitted on {new Date(submission.submittedAt.toMillis()).toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div>
              <h4 className="font-semibold text-slate-900 mb-2">Your Work</h4>
              {submission.textSubmission && (
                <div className="bg-slate-50 p-4 rounded-md border text-sm whitespace-pre-wrap text-slate-700">
                  {submission.textSubmission}
                </div>
              )}
              {submission.fileUrl && (
                <div className="mt-3">
                  <a href={submission.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm font-medium flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                    View Uploaded File
                  </a>
                </div>
              )}
            </div>

            {submission.status === 'graded' && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h4 className="font-bold text-amber-900 mb-2 border-b border-amber-200 pb-2">Instructor Feedback</h4>
                <div className="flex justify-between items-start mb-3">
                  <div className="font-semibold text-amber-800">
                    Grade: <span className="text-2xl ml-2 text-amber-600">{submission.marks}</span> / {assignment.totalMarks}
                  </div>
                </div>
                {submission.feedback ? (
                  <p className="text-amber-900 text-sm whitespace-pre-wrap">{submission.feedback}</p>
                ) : (
                  <p className="text-amber-700 text-sm italic">No written feedback provided.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Submit Your Work</CardTitle>
            <CardDescription>Upload a file or type your answer below.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="textSubmission">Text Answer (Optional)</Label>
                <Textarea 
                  id="textSubmission" 
                  rows={6} 
                  placeholder="Type your answer here..."
                  value={textSubmission}
                  onChange={(e) => setTextSubmission(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="file">File Upload (Optional)</Label>
                <Input 
                  id="file" 
                  type="file" 
                  onChange={(e) => setFile(e.target.files?.[0] || null)} 
                />
                <p className="text-xs text-slate-500">Attach a document, PDF, or image if required.</p>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-slate-900 hover:bg-slate-800 text-white"
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Submit Assignment'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
