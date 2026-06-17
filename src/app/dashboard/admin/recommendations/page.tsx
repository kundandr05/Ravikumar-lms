'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase/firebase';
import { collection, getDocs, addDoc, serverTimestamp, query, orderBy, deleteDoc, doc, where } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { TeacherRecommendation, Course, Lesson, Test, Assignment, AppUser } from '@/types';

export default function RecommendationsManagerPage() {
  const { appUser } = useAuth();
  
  const [recommendations, setRecommendations] = useState<TeacherRecommendation[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<AppUser[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Form State
  const [targetType, setTargetType] = useState<'student' | 'course'>('student');
  const [targetId, setTargetId] = useState('');
  const [itemType, setItemType] = useState<'lesson' | 'test' | 'assignment'>('lesson');
  const [itemId, setItemId] = useState('');
  const [message, setMessage] = useState('');
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        getDocs(collection(db, 'teacherRecommendations')),
        getDocs(collection(db, 'courses')),
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'lessons')),
        getDocs(collection(db, 'tests')),
        getDocs(collection(db, 'assignments')),
      ]);

      if (results[0].status === 'fulfilled') {
        setRecommendations(results[0].value.docs.map(d => ({ id: d.id, ...d.data() } as TeacherRecommendation)));
      } else {
        console.error("Recommendations fetch failed:", results[0].reason);
      }

      if (results[1].status === 'fulfilled') {
        setCourses(results[1].value.docs.map(d => ({ courseId: d.id, ...d.data() } as Course)));
      }
      
      if (results[2].status === 'fulfilled') {
        setStudents(results[2].value.docs.map(d => ({ uid: d.id, ...d.data() } as AppUser)).filter(u => u.role !== 'admin'));
      }

      if (results[3].status === 'fulfilled') {
        setLessons(results[3].value.docs.map(d => ({ lessonId: d.id, ...d.data() } as Lesson)));
      }

      if (results[4].status === 'fulfilled') {
        setTests(results[4].value.docs.map(d => ({ testId: d.id, ...d.data() } as Test)));
      }

      if (results[5].status === 'fulfilled') {
        setAssignments(results[5].value.docs.map(d => ({ assignmentId: d.id, ...d.data() } as Assignment)));
      }

      // If any of the essential ones failed, show a warning, but don't crash everything
      const errors = results.filter(r => r.status === 'rejected').map(r => (r as PromiseRejectedResult).reason.message || 'Permission denied');
      if (errors.length > 0) {
        setFetchError("Some data couldn't be loaded. Please update your Firebase Security Rules. Errors: " + errors[0]);
      }
    } catch (error: any) {
      console.error("Error fetching data:", error);
      setFetchError(error.message || "Failed to fetch data. Check your permissions.");
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetId || !itemId || !message || !appUser?.uid) return;

    setSubmitting(true);
    try {
      const payload: Omit<TeacherRecommendation, 'id'> = {
        targetType,
        targetId,
        itemType,
        itemId,
        message,
        dueDate: dueDate ? new Date(dueDate) : null,
        createdAt: serverTimestamp(),
        createdBy: appUser.uid,
      };

      await addDoc(collection(db, 'teacherRecommendations'), payload);
      
      // Send notification to student(s)
      if (targetType === 'student') {
        await addDoc(collection(db, 'notifications'), {
          userId: targetId,
          title: 'New Teacher Recommendation',
          message: `Your teacher has recommended a ${itemType} for you to complete.`,
          read: false,
          createdAt: serverTimestamp()
        });
      } else if (targetType === 'course') {
        // Find all students in this course
        const enrollSnap = await getDocs(query(collection(db, 'enrollments'), where('courseId', '==', targetId)));
        const studentIds = enrollSnap.docs.map(d => d.data().studentId);
        // Create notifications for all enrolled students
        await Promise.all(studentIds.map(sId => 
          addDoc(collection(db, 'notifications'), {
            userId: sId,
            title: 'New Course Recommendation',
            message: `A new ${itemType} has been recommended for your course.`,
            read: false,
            createdAt: serverTimestamp()
          })
        ));
      }

      alert("Recommendation sent successfully!");
      
      // Reset form
      setTargetId('');
      setItemId('');
      setMessage('');
      setDueDate('');
      
      fetchData(); // Refresh list
    } catch (error) {
      console.error("Error adding recommendation:", error);
      alert("Failed to send recommendation");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this recommendation?")) return;
    try {
      await deleteDoc(doc(db, 'teacherRecommendations', id));
      setRecommendations(recommendations.filter(r => r.id !== id));
    } catch (error) {
      console.error("Error deleting:", error);
    }
  };

  const getTargetName = (type: string, id: string) => {
    if (type === 'student') return students.find(s => s.uid === id)?.name || 'Unknown Student';
    if (type === 'course') return courses.find(c => c.courseId === id)?.title || 'Unknown Course';
    return 'Unknown';
  };

  const getItemName = (type: string, id: string) => {
    if (type === 'lesson') return lessons.find(l => l.lessonId === id)?.title || 'Unknown Lesson';
    if (type === 'test') return tests.find(t => t.testId === id)?.title || 'Unknown Test';
    if (type === 'assignment') return assignments.find(a => a.assignmentId === id)?.title || 'Unknown Assignment';
    return 'Unknown';
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading Recommendation Manager...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Teacher Recommendations</h1>
        <p className="text-muted-foreground mt-2">Guide your students by recommending specific lessons, tests, or assignments.</p>
      </div>

      {fetchError && (
        <div className="p-4 bg-red-100 text-red-700 border border-red-300 rounded-lg">
          <strong>Data Fetch Error:</strong> {fetchError}
        </div>
      )}

      {/* Debug UI block */}
      {!loading && !fetchError && (
         <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
           Debug Data Loaded: {students.length} students, {courses.length} courses, {lessons.length} lessons, {tests.length} tests, {assignments.length} assignments
         </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Create Recommendation</CardTitle>
              <CardDescription>Assign a task to a student or entire class.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Target Type</Label>
                  <Select value={targetType} onValueChange={(val: 'student'|'course') => { setTargetType(val); setTargetId(''); }}>
                    <SelectTrigger><SelectValue placeholder="Select target type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Individual Student</SelectItem>
                      <SelectItem value="course">Entire Course / Batch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{targetType === 'student' ? 'Select Student' : 'Select Course'}</Label>
                  <Select value={targetId} onValueChange={setTargetId}>
                    <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      {targetType === 'student' 
                        ? students.map(s => <SelectItem key={s.uid} value={s.uid!}>{s.name || s.email || 'Unknown User'}</SelectItem>)
                        : courses.map(c => <SelectItem key={c.courseId} value={c.courseId!}>{c.title}</SelectItem>)
                      }
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Item Type</Label>
                  <Select value={itemType} onValueChange={(val: 'lesson'|'test'|'assignment') => { setItemType(val); setItemId(''); }}>
                    <SelectTrigger><SelectValue placeholder="Select item type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lesson">Lesson (Video/PDF)</SelectItem>
                      <SelectItem value="test">Test</SelectItem>
                      <SelectItem value="assignment">Assignment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Select {itemType.charAt(0).toUpperCase() + itemType.slice(1)}</Label>
                  <Select value={itemId} onValueChange={setItemId}>
                    <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      {itemType === 'lesson' ? lessons.map(l => <SelectItem key={l.lessonId} value={l.lessonId!}>{l.title}</SelectItem>) : null}
                      {itemType === 'test' ? tests.map(t => <SelectItem key={t.testId} value={t.testId!}>{t.title}</SelectItem>) : null}
                      {itemType === 'assignment' ? assignments.map(a => <SelectItem key={a.assignmentId} value={a.assignmentId!}>{a.title}</SelectItem>) : null}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Teacher Message / Instructions</Label>
                  <Textarea 
                    required 
                    placeholder="e.g. Please watch this video before tomorrow's live class."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Due Date (Optional)</Label>
                  <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                </div>

                <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-amber-600 dark:hover:bg-amber-700" disabled={submitting}>
                  {submitting ? 'Sending...' : 'Send Recommendation'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Active Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              {recommendations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border border-dashed rounded-md">No active recommendations</div>
              ) : (
                <div className="space-y-4">
                  {recommendations.map(rec => (
                    <div key={rec.id} className="p-4 border rounded-lg bg-card shadow-sm flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${rec.targetType === 'student' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                            To: {getTargetName(rec.targetType, rec.targetId)}
                          </span>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded border text-muted-foreground uppercase">
                            {rec.itemType}
                          </span>
                        </div>
                        <h4 className="font-semibold text-foreground">{getItemName(rec.itemType, rec.itemId)}</h4>
                        <p className="text-sm text-muted-foreground mt-1">"{rec.message}"</p>
                        {rec.dueDate && (
                          <p className="text-xs font-medium text-amber-600 mt-2">
                            Due: {rec.dueDate.toDate ? rec.dueDate.toDate().toLocaleDateString() : new Date(rec.dueDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(rec.id!)}>
                        Revoke
                      </Button>
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
