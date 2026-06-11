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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter } from 'next/navigation';

export default function NewQuestionPage({ params }: { params: Promise<{ courseId: string, testId: string }> }) {
  const { courseId, testId } = use(params);
  const { appUser } = useAuth();
  const router = useRouter();
  
  const [text, setText] = useState('');
  const [order, setOrder] = useState<number>(1);
  const [options, setOptions] = useState<string[]>(['', '', '', '']);
  const [correctOptionIndex, setCorrectOptionIndex] = useState<string>('0');
  const [loading, setLoading] = useState(false);

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

    setLoading(true);

    try {
      await addDoc(collection(db, 'questions'), {
        testId,
        text,
        options,
        correctOptionIndex: Number(correctOptionIndex),
        order: Number(order),
        createdAt: serverTimestamp(),
      });
      router.push(`/dashboard/admin/courses/${courseId}/tests/${testId}`);
    } catch (error) {
      console.error("Error creating question", error);
      alert("Failed to create question");
    } finally {
      setLoading(false);
    }
  };

  if (appUser?.role !== 'admin') {
    return <div className="p-8 text-center text-red-500">Access Denied. Admins only.</div>;
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => router.push(`/dashboard/admin/courses/${courseId}/tests/${testId}`)}>Back</Button>
        <h1 className="text-3xl font-bold">Add Question</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Question Details</CardTitle>
          <CardDescription>Enter the question text, provide 4 options, and select the correct answer.</CardDescription>
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
                  placeholder="e.g. What is the capital of France?" 
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
                  <span className="font-medium text-muted-foreground w-6">
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
              <Select value={correctOptionIndex} onValueChange={(val) => setCorrectOptionIndex(val as string)}>
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

            <Button type="submit" className="w-full mt-6" disabled={loading}>
              {loading ? 'Adding...' : 'Add Question'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
