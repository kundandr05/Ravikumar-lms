'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db, storage } from '@/lib/firebase/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';

export default function EditLessonPage({ params }: { params: { courseId: string, lessonId: string } }) {
  const { appUser } = useAuth();
  const router = useRouter();
  
  const [title, setTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [order, setOrder] = useState<number>(1);
  const [existingPdf, setExistingPdf] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    async function loadLesson() {
      try {
        const lessonDoc = await getDoc(doc(db, 'lessons', params.lessonId));
        if (lessonDoc.exists()) {
          const data = lessonDoc.data();
          setTitle(data.title || '');
          setVideoUrl(data.videoUrl || '');
          setOrder(data.order || 1);
          setExistingPdf(data.notesPdf || '');
        } else {
          router.push(`/dashboard/admin/courses/${params.courseId}`);
        }
      } catch (error) {
        console.error("Error loading lesson:", error);
      } finally {
        setLoading(false);
      }
    }
    loadLesson();
  }, [params.lessonId, params.courseId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      let notesPdfUrl = existingPdf;

      // Handle PDF Upload if a NEW file was selected
      if (pdfFile) {
        const storageRef = ref(storage, `notes/${params.courseId}/${Date.now()}_${pdfFile.name}`);
        const uploadTask = uploadBytesResumable(storageRef, pdfFile);

        await new Promise((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress(progress);
            },
            (error) => {
              console.error("Upload error:", error);
              reject(error);
            },
            async () => {
              notesPdfUrl = await getDownloadURL(uploadTask.snapshot.ref);
              resolve(null);
            }
          );
        });
      }

      await updateDoc(doc(db, 'lessons', params.lessonId), {
        title,
        videoUrl,
        notesPdf: notesPdfUrl,
        order: Number(order),
      });
      
      router.push(`/dashboard/admin/courses/${params.courseId}`);
    } catch (error) {
      console.error("Error updating lesson", error);
      alert("Failed to update lesson.");
    } finally {
      setSaving(false);
      setUploadProgress(0);
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
        <Button variant="outline" onClick={() => router.push(`/dashboard/admin/courses/${params.courseId}`)}>Back</Button>
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
              <Label htmlFor="pdfNotes">Update PDF Notes (Optional)</Label>
              {existingPdf && (
                <div className="mb-2 text-sm text-slate-600">
                  Current PDF exists. Uploading a new file will replace it.
                </div>
              )}
              <Input 
                id="pdfNotes" 
                type="file"
                accept="application/pdf"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setPdfFile(e.target.files[0]);
                  }
                }}
              />
            </div>

            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="w-full bg-slate-200 rounded-full h-2.5 mt-2">
                <div className="bg-amber-600 h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
              </div>
            )}

            <Button type="submit" className="w-full mt-6" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
