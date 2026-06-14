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
import { PlusCircle, Trash2 } from 'lucide-react';

interface MCQ {
  id: string;
  text: string;
  options: string[];
  correctOptionIndex: number;
}

export default function NewMixedTestPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = use(params);
  const { appUser } = useAuth();
  const router = useRouter();
  
  // Basic Info
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [chapter, setChapter] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [totalMarks, setTotalMarks] = useState<number>(100);
  const [passingMarks, setPassingMarks] = useState<number>(35);
  const [availableFrom, setAvailableFrom] = useState('');
  const [availableUntil, setAvailableUntil] = useState('');
  
  // Sections
  const [mcqs, setMcqs] = useState<MCQ[]>([]);
  const [section1Mark, setSection1Mark] = useState('');
  const [section2Mark, setSection2Mark] = useState('');
  const [section3Mark, setSection3Mark] = useState('');
  const [section5Mark, setSection5Mark] = useState('');
  const [section10Mark, setSection10Mark] = useState('');

  const [loading, setLoading] = useState(false);

  const handleAddMCQ = () => {
    setMcqs([
      ...mcqs, 
      { id: Date.now().toString(), text: '', options: ['', '', '', ''], correctOptionIndex: 0 }
    ]);
  };

  const handleRemoveMCQ = (index: number) => {
    setMcqs(mcqs.filter((_, i) => i !== index));
  };

  const handleMCQChange = (index: number, field: string, value: string | number, optionIndex?: number) => {
    const newMcqs = [...mcqs];
    if (field === 'text') newMcqs[index].text = value as string;
    if (field === 'correctOptionIndex') newMcqs[index].correctOptionIndex = value as number;
    if (field === 'option' && optionIndex !== undefined) {
      newMcqs[index].options[optionIndex] = value as string;
    }
    setMcqs(newMcqs);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await addDoc(collection(db, 'tests'), {
        courseId,
        title,
        subject,
        chapter,
        description,
        instructions,
        durationMinutes: Number(durationMinutes),
        totalMarks: Number(totalMarks),
        passingMarks: Number(passingMarks),
        availableFrom: availableFrom ? new Date(availableFrom) : null,
        availableUntil: availableUntil ? new Date(availableUntil) : null,
        
        // Save the mixed sections directly into the test doc
        mcqs,
        section1Mark,
        section2Mark,
        section3Mark,
        section5Mark,
        section10Mark,
        
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
    <div className="p-6 max-w-5xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => router.push(`/dashboard/admin/courses/${courseId}`)}>Back</Button>
        <h1 className="text-3xl font-bold">Create Board Exam Test</h1>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* BASIC DETAILS */}
        <Card className="border-slate-800">
          <CardHeader>
            <CardTitle>Basic Details</CardTitle>
            <CardDescription>Setup the overarching details of this exam.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Test Title</Label>
                <Input placeholder="e.g. Midterm Examination" required value={title} onChange={e => setTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Subject</Label>
                <Input placeholder="e.g. Science" required value={subject} onChange={e => setSubject(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Chapter (Optional)</Label>
                <Input placeholder="e.g. Chapter 4: Carbon and its compounds" value={chapter} onChange={e => setChapter(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input placeholder="Short description..." value={description} onChange={e => setDescription(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Duration (Minutes)</Label>
                <Input type="number" required value={durationMinutes} onChange={e => setDurationMinutes(Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Total Marks</Label>
                <Input type="number" required value={totalMarks} onChange={e => setTotalMarks(Number(e.target.value))} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>General Instructions</Label>
                <Textarea 
                  placeholder="1. All questions are compulsory. 2. Write neat and clean..." 
                  rows={3} 
                  value={instructions} 
                  onChange={e => setInstructions(e.target.value)} 
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SECTION A: MCQs */}
        <Card className="border-slate-800">
          <CardHeader className="flex flex-row justify-between items-center">
            <div>
              <CardTitle>Part A: Multiple Choice Questions</CardTitle>
              <CardDescription>These will be auto-evaluated by the system.</CardDescription>
            </div>
            <Button type="button" onClick={handleAddMCQ} variant="secondary" className="gap-2">
              <PlusCircle className="w-4 h-4" /> Add MCQ
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {mcqs.length === 0 && <p className="text-muted-foreground text-sm italic">No MCQs added. Click button to add.</p>}
            {mcqs.map((mcq, index) => (
              <div key={mcq.id} className="p-4 border border-slate-700 rounded-lg space-y-4 bg-muted/20 relative">
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  className="absolute top-2 right-2 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                  onClick={() => handleRemoveMCQ(index)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
                
                <div className="space-y-2 pr-10">
                  <Label>Question {index + 1}</Label>
                  <Input 
                    placeholder="Enter question text..." 
                    value={mcq.text} 
                    onChange={e => handleMCQChange(index, 'text', e.target.value)} 
                    required 
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mcq.options.map((opt, oIdx) => (
                    <div key={oIdx} className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Option {String.fromCharCode(65 + oIdx)}</Label>
                      <Input 
                        placeholder={`Option ${String.fromCharCode(65 + oIdx)}`} 
                        value={opt} 
                        onChange={e => handleMCQChange(index, 'option', e.target.value, oIdx)} 
                        required 
                      />
                    </div>
                  ))}
                </div>
                
                <div className="space-y-2">
                  <Label>Correct Option</Label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={mcq.correctOptionIndex}
                    onChange={e => handleMCQChange(index, 'correctOptionIndex', Number(e.target.value))}
                  >
                    <option value={0}>Option A</option>
                    <option value={1}>Option B</option>
                    <option value={2}>Option C</option>
                    <option value={3}>Option D</option>
                  </select>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* SECTION B: 1 Mark */}
        <Card className="border-slate-800">
          <CardHeader>
            <CardTitle>Part B: 1 Mark Questions</CardTitle>
            <CardDescription>Enter all 1 mark questions here (Text or Markdown).</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea 
              className="min-h-[150px] font-mono" 
              placeholder="1. Define Photosynthesis...&#10;2. What is Chlorophyll?..."
              value={section1Mark}
              onChange={e => setSection1Mark(e.target.value)}
            />
          </CardContent>
        </Card>

        {/* SECTION C: 2 Marks */}
        <Card className="border-slate-800">
          <CardHeader>
            <CardTitle>Part C: 2 Mark Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea 
              className="min-h-[150px] font-mono" 
              placeholder="1. Differentiate between..."
              value={section2Mark}
              onChange={e => setSection2Mark(e.target.value)}
            />
          </CardContent>
        </Card>

        {/* SECTION D: 3 Marks */}
        <Card className="border-slate-800">
          <CardHeader>
            <CardTitle>Part D: 3 Mark Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea 
              className="min-h-[150px] font-mono" 
              placeholder="1. Explain the process of..."
              value={section3Mark}
              onChange={e => setSection3Mark(e.target.value)}
            />
          </CardContent>
        </Card>

        {/* SECTION E: 5 Marks */}
        <Card className="border-slate-800">
          <CardHeader>
            <CardTitle>Part E: 5 Mark Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea 
              className="min-h-[150px] font-mono" 
              placeholder="1. Draw a neat labeled diagram of..."
              value={section5Mark}
              onChange={e => setSection5Mark(e.target.value)}
            />
          </CardContent>
        </Card>

        {/* SECTION F: 10 Marks */}
        <Card className="border-slate-800">
          <CardHeader>
            <CardTitle>Part F: 10 Mark Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea 
              className="min-h-[150px] font-mono" 
              placeholder="1. Long essay type question..."
              value={section10Mark}
              onChange={e => setSection10Mark(e.target.value)}
            />
          </CardContent>
        </Card>

        <div className="sticky bottom-4 z-10 bg-background/80 backdrop-blur-md p-4 border border-slate-800 rounded-xl shadow-2xl flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Make sure all details are correct before saving.</span>
          <Button type="submit" size="lg" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
            {loading ? 'Publishing Board Exam...' : 'Publish Exam'}
          </Button>
        </div>

      </form>
    </div>
  );
}
