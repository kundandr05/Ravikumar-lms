'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { db, storage } from '@/lib/firebase/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';

export default function NewAssignmentPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = use(params);
  const router = useRouter();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDateStr, setDueDateStr] = useState('');
  const [totalMarks, setTotalMarks] = useState('100');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !totalMarks) {
      alert('Please fill out all required fields.');
      return;
    }

    setSubmitting(true);
    try {
      let fileUrl = '';
      
      // Upload attachment if provided
      if (file) {
        const storageRef = ref(storage, `courses/${courseId}/assignments/${Date.now()}_${file.name}`);
        const uploadResult = await uploadBytes(storageRef, file);
        fileUrl = await getDownloadURL(uploadResult.ref);
      }

      // Convert due date string to Date object
      let dueDate = null;
      if (dueDateStr) {
        dueDate = new Date(dueDateStr);
      }

      const assignmentData = {
        courseId,
        title,
        description,
        totalMarks: Number(totalMarks),
        createdAt: serverTimestamp(),
        ...(dueDate && { dueDate }),
        ...(fileUrl && { fileUrl }),
      };

      await addDoc(collection(db, 'assignments'), assignmentData);
      
      alert('Assignment created successfully!');
      router.push(`/dashboard/admin/courses/${courseId}`);
    } catch (error) {
      console.error('Error creating assignment:', error);
      alert('Failed to create assignment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
        <Link href="/dashboard/admin/courses" className="hover:text-amber-600">Courses</Link>
        <span>/</span>
        <Link href={`/dashboard/admin/courses/${courseId}`} className="hover:text-amber-600">Course Details</Link>
        <span>/</span>
        <span className="text-slate-900 font-medium">New Assignment</span>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Create New Assignment</h1>
          <p className="text-slate-500">Add a new homework or assignment task for your students.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Assignment Details</CardTitle>
            <CardDescription>Provide instructions and criteria for this assignment.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Assignment Title <span className="text-red-500">*</span></Label>
              <Input 
                id="title" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="e.g., Chapter 1 Essay, Math Worksheet"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Instructions <span className="text-red-500">*</span></Label>
              <Textarea 
                id="description" 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                placeholder="Describe what the students need to do..."
                rows={6}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="totalMarks">Total Marks <span className="text-red-500">*</span></Label>
                <Input 
                  id="totalMarks" 
                  type="number" 
                  min="1" 
                  value={totalMarks} 
                  onChange={(e) => setTotalMarks(e.target.value)} 
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date (Optional)</Label>
                <Input 
                  id="dueDate" 
                  type="datetime-local" 
                  value={dueDateStr} 
                  onChange={(e) => setDueDateStr(e.target.value)} 
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">Attachment (Optional PDF, Document, or Image)</Label>
              <Input 
                id="file" 
                type="file" 
                onChange={(e) => setFile(e.target.files?.[0] || null)} 
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              />
              <p className="text-xs text-slate-500">Provide a worksheet or reference material if needed.</p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 flex gap-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.push(`/dashboard/admin/courses/${courseId}`)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            className="bg-amber-600 hover:bg-amber-700 text-white"
            disabled={submitting}
          >
            {submitting ? 'Creating...' : 'Create Assignment'}
          </Button>
        </div>
      </form>
    </div>
  );
}
