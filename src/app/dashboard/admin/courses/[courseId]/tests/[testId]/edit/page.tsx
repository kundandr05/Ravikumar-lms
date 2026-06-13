'use client';

import { useState, useEffect, use } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useRouter } from 'next/navigation';
import { Test } from '@/types';

export default function EditTestPage({ params }: { params: Promise<{ courseId: string, testId: string }> }) {
  const { courseId, testId } = use(params);
  const { appUser } = useAuth();
  const router = useRouter();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [passingMarks, setPassingMarks] = useState<number>(0);
  const [availableFrom, setAvailableFrom] = useState('');
  const [availableUntil, setAvailableUntil] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    async function loadTest() {
      try {
        const testDoc = await getDoc(doc(db, 'tests', testId));
        if (testDoc.exists()) {
          const t = testDoc.data() as Test;
          setTitle(t.title);
          setDescription(t.description);
          setDurationMinutes(t.durationMinutes);
          setPassingMarks(t.passingMarks || 0);
          
          if (t.availableFrom) {
            const date = t.availableFrom.toDate ? t.availableFrom.toDate() : new Date(t.availableFrom);
            setAvailableFrom(date.toISOString().slice(0, 16));
          }
          if (t.availableUntil) {
            const date = t.availableUntil.toDate ? t.availableUntil.toDate() : new Date(t.availableUntil);
            setAvailableUntil(date.toISOString().slice(0, 16));
          }
        }
      } catch (err) {
        console.error("Failed to load test", err);
      } finally {
        setFetching(false);
      }
    }
    loadTest();
  }, [testId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await updateDoc(doc(db, 'tests', testId), {
        title,
        description,
        durationMinutes: Number(durationMinutes),
        passingMarks: Number(passingMarks),
        availableFrom: availableFrom ? new Date(availableFrom) : null,
        availableUntil: availableUntil ? new Date(availableUntil) : null,
        updatedAt: serverTimestamp(),
      });
      router.push(`/dashboard/admin/courses/${courseId}`);
    } catch (error) {
      console.error("Error updating test", error);
      alert("Failed to update test");
    } finally {
      setLoading(false);
    }
  };

  if (appUser?.role !== 'admin') {
    return <div className="p-8 text-center text-red-500">Access Denied. Admins only.</div>;
  }

  if (fetching) return <div className="p-8 text-center animate-pulse">Loading Test Details...</div>;

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => router.push(`/dashboard/admin/courses/${courseId}`)}>Back</Button>
        <h1 className="text-3xl font-bold">Edit Test</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Test Details</CardTitle>
          <CardDescription>Update test availability and settings.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Test Title</Label>
              <Input 
                id="title" 
                required 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description & Instructions</Label>
              <Textarea 
                id="description" 
                required 
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
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
              </div>
              <div className="space-y-2">
                <Label htmlFor="passingMarks">Passing Marks</Label>
                <Input 
                  id="passingMarks" 
                  type="number"
                  min="0"
                  required 
                  value={passingMarks}
                  onChange={(e) => setPassingMarks(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="availableFrom">Available From (Optional)</Label>
                <Input 
                  id="availableFrom" 
                  type="datetime-local"
                  value={availableFrom}
                  onChange={(e) => setAvailableFrom(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="availableUntil">Available Until (Optional)</Label>
                <Input 
                  id="availableUntil" 
                  type="datetime-local"
                  value={availableUntil}
                  onChange={(e) => setAvailableUntil(e.target.value)}
                />
              </div>
            </div>

            <Button type="submit" className="w-full mt-6" disabled={loading}>
              {loading ? 'Updating Test...' : 'Update Test'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
