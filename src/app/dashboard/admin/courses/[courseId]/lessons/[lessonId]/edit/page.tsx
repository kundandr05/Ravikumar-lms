'use client';

import { useState, useEffect, use } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';

export default function EditLessonPage({ params }: { params: Promise<{ courseId: string, lessonId: string }> }) {
  const { courseId, lessonId } = use(params);
  const { appUser } = useAuth();
  const router = useRouter();
  
  const [title, setTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [order, setOrder] = useState<number>(1);
  const [existingPdf, setExistingPdf] = useState('');
  const [notesPdfUrl, setNotesPdfUrl] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadLesson() {
      try {
        const lessonDoc = await getDoc(doc(db, 'lessons', lessonId));
        if (lessonDoc.exists()) {
          const data = lessonDoc.data();
          setTitle(data.title || '');
          setVideoUrl(data.videoUrl || '');
          setOrder(data.order || 1);
          setExistingPdf(data.notesPdf || '');
          setNotesPdfUrl(data.notesPdf || '');
        } else {
          router.push(`/dashboard/admin/courses/${courseId}`);
        }
      } catch (error) {
        console.error("Error loading lesson:", error);
      } finally {
        setLoading(false);
      }
    }
    loadLesson();
  }, [lessonId, courseId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await updateDoc(doc(db, 'lessons', lessonId), {
        title,
        videoUrl,
        notesPdf: notesPdfUrl,
        order: Number(order),
      });
      
      router.push(`/dashboard/admin/courses/${courseId}`);
    } catch (error) {
      console.error("Error updating lesson", error);
      alert("Failed to update lesson. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (appUser?.role !== 'admin') {
    return <div className="p-8 text-center text-red-500">Access Denied. Admins only.</div>;
  }

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading lesson...</div>;
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => router.push(`/dashboard/admin/courses/${courseId}`)}>Back</Button>
        <h1 className="text-3xl font-bold">Edit Lesson</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Lesson Details</CardTitle>
          <CardDescription>Update the lesson details and materials.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Lesson Title</Label>
              <Input 
                id="title" 
                required 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="order">Lesson Order</Label>
                <Input 
                  id="order" 
                  type="number"
                  required 
                  min="1"
                  value={order}
                  onChange={(e) => setOrder(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="videoUrl">YouTube Video URL</Label>
              <Input 
                id="videoUrl" 
                required
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
              />
            </div>

            <div className="space-y-2 pt-4 border-t">
              <Label htmlFor="pdfNotes">Update PDF Notes (Google Drive Link)</Label>
              {existingPdf && existingPdf !== notesPdfUrl && (
                <div className="mb-2 text-sm text-amber-600">
                  Current link will be replaced with the new one.
                </div>
              )}
              <Input 
                id="pdfNotes" 
                type="url"
                placeholder="https://drive.google.com/..."
                value={notesPdfUrl}
                onChange={(e) => setNotesPdfUrl(e.target.value)}
              />
              <p className="text-xs text-slate-500">Paste a link to a Google Drive PDF (make sure access is set to "Anyone with the link"). Optional.</p>
            </div>

            <Button type="submit" className="w-full mt-6" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
