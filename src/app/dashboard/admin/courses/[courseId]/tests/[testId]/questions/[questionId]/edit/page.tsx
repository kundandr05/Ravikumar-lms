'use client';

import { useEffect, useState, use } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter } from 'next/navigation';

export default function EditQuestionPage({ params }: { params: Promise<{ courseId: string, testId: string, questionId: string }> }) {
  const { courseId, testId, questionId } = use(params);
  const { appUser } = useAuth();
  const router = useRouter();
  
  const [text, setText] = useState('');
  const [order, setOrder] = useState<number>(1);
  const [options, setOptions] = useState<string[]>(['', '', '', '']);
  const [correctOptionIndex, setCorrectOptionIndex] = useState<string>('0');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchQuestion() {
      try {
        const qDoc = await getDoc(doc(db, 'questions', questionId));
        if (qDoc.exists()) {
          const data = qDoc.data();
          setText(data.text || '');
          setOrder(data.order || 1);
          setOptions(data.options || ['', '', '', '']);
          setCorrectOptionIndex(String(data.correctOptionIndex ?? 0));
        } else {
          router.push(`/dashboard/admin/courses/${courseId}/tests/${testId}`);
        }
      } catch (error) {
        console.error("Error fetching question", error);
      } finally {
        setLoading(false);
      }
    }
    fetchQuestion();
  }, [questionId, courseId, testId, router]);

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (options.some(opt => opt.trim() === '')) {
      alert("Please fill in all 4 options.");
      return;
    }

    setSaving(true);

    try {
      await updateDoc(doc(db, 'questions', questionId), {
        text,
        options,
        correctOptionIndex: Number(correctOptionIndex),
        order: Number(order),
      });
      router.push(`/dashboard/admin/courses/${courseId}/tests/${testId}`);
    } catch (error) {
      console.error("Error updating question", error);
      alert("Failed to update question");
    } finally {
      setSaving(false);
    }
  };

  if (appUser?.role !== 'admin') {
    return <div className="p-8 text-center text-red-500">Access Denied. Admins only.</div>;
  }

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading question...</div>;
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => router.push(`/dashboard/admin/courses/${courseId}/tests/${testId}`)}>Back</Button>
        <h1 className="text-3xl font-bold">Edit Question</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Question Details</CardTitle>
          <CardDescription>Update the question text, options, and correct answer.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-1 space-y-2">
                <Label htmlFor="order">Question Number</Label>
                <Input 
                  id="order" 
                  type="number"
                  min="1"
                  required 
                  value={order}
                  onChange={(e) => setOrder(Number(e.target.value))}
                />
              </div>
              <div className="col-span-3 space-y-2">
                <Label htmlFor="text">Question Text</Label>
                <Textarea 
                  id="text" 
                  required 
                  rows={3}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <Label>Options</Label>
              {options.map((opt, index) => (
                <div key={index} className="flex items-center gap-4">
                  <span className="font-medium text-slate-500 w-6">
                    {String.fromCharCode(65 + index)}.
                  </span>
                  <Input 
                    placeholder={`Option ${index + 1}`}
                    required 
                    value={opt}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                  />
                </div>
              ))}
            </div>

            <div className="space-y-2 pt-4 border-t">
              <Label>Correct Answer</Label>
              <Select value={correctOptionIndex} onValueChange={setCorrectOptionIndex}>
                <SelectTrigger>
                  <SelectValue placeholder="Select the correct option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Option A</SelectItem>
                  <SelectItem value="1">Option B</SelectItem>
                  <SelectItem value="2">Option C</SelectItem>
                  <SelectItem value="3">Option D</SelectItem>
                </SelectContent>
              </Select>
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
