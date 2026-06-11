'use client';

import { useState, use } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';

export default function NewLessonPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = use(params);
  const { appUser } = useAuth();
  const router = useRouter();
  
  const [title, setTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [order, setOrder] = useState<number>(1);
  const [notesPdfUrl, setNotesPdfUrl] = useState('');
  
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Add lesson to Firestore
      await addDoc(collection(db, 'lessons'), {
        courseId: courseId,
        title,
        videoUrl, // Storing the raw URL, we will parse it in the player
        notesPdf: notesPdfUrl,
        order: Number(order),
        createdAt: serverTimestamp(),
      });
      
      router.push(`/dashboard/admin/courses/${courseId}`);
    } catch (error) {
      console.error("Error creating lesson", error);
      alert("Failed to create lesson. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (appUser?.role !== 'admin') {
    return <div className="p-8 text-center text-red-500">Access Denied. Admins only.</div>;
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => router.push(`/dashboard/admin/courses/${courseId}`)}>Back</Button>
        <h1 className="text-3xl font-bold">Add New Lesson</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Lesson Details</CardTitle>
          <CardDescription>Add a video lesson and attach PDF notes.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Lesson Title</Label>
              <Input 
                id="title" 
                placeholder="e.g. Chapter 1: Introduction" 
                required 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="order">Lesson Order (Number)</Label>
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
                placeholder="https://www.youtube.com/watch?v=..." 
                required
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
              />
            </div>

            <div className="space-y-2 pt-4 border-t">
              <Label htmlFor="pdfNotes">Attach PDF Notes (Google Drive Link)</Label>
              <Input 
                id="pdfNotes" 
                type="url"
                placeholder="https://drive.google.com/..."
                value={notesPdfUrl}
                onChange={(e) => setNotesPdfUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Paste a link to a Google Drive PDF (make sure access is set to "Anyone with the link"). Optional.</p>
            </div>

            <Button type="submit" className="w-full mt-6" disabled={loading}>
              {loading ? 'Saving...' : 'Create Lesson'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
