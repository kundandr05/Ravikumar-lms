'use client';

import { useState, use } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useRouter } from 'next/navigation';

export default function NewTestPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = use(params);
  const { appUser } = useAuth();
  const router = useRouter();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await addDoc(collection(db, 'tests'), {
        courseId,
        title,
        description,
        durationMinutes: Number(durationMinutes),
        createdAt: serverTimestamp(),
      });
      router.push(`/dashboard/admin/courses/${courseId}`);
    } catch (error) {
      console.error("Error creating test", error);
      alert("Failed to create test");
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
        <h1 className="text-3xl font-bold">Create New Test</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Test Details</CardTitle>
          <CardDescription>Set up a new Multiple Choice Question test for your students.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Test Title</Label>
              <Input 
                id="title" 
                placeholder="e.g. Midterm Assessment" 
                required 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description & Instructions</Label>
              <Textarea 
                id="description" 
                placeholder="Explain the rules or topics covered in this test..." 
                required 
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Time Limit (Minutes)</Label>
              <Input 
                id="duration" 
                type="number"
                min="1"
                required 
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">The test will automatically submit when the timer expires.</p>
            </div>

            <Button type="submit" className="w-full mt-6" disabled={loading}>
              {loading ? 'Creating Test...' : 'Create Test'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
