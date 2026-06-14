'use client';

import { use, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase/firebase';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { AlertCircle, FileText, CheckCircle2 } from 'lucide-react';
import { Test } from '@/types';

export default function BoardExamAttemptPage({ params }: { params: Promise<{ courseId: string, testId: string }> }) {
  const { courseId, testId } = use(params);
  const { appUser } = useAuth();
  const router = useRouter();

  const [test, setTest] = useState<Test | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Answers state
  const [mcqAnswers, setMcqAnswers] = useState<Record<string, number>>({});
  const [driveLink, setDriveLink] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchTest() {
      try {
        const testDoc = await getDoc(doc(db, 'tests', testId));
        if (testDoc.exists()) {
          setTest({ testId: testDoc.id, ...testDoc.data() } as Test);
        } else {
          setError('Test not found.');
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load test.');
      } finally {
        setLoading(false);
      }
    }
    fetchTest();
  }, [testId]);

  const handleMcqSelect = (questionId: string, optionIndex: number) => {
    setMcqAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  const validateDriveLink = (url: string) => {
    return url.includes('drive.google.com') && (url.includes('/file/d/') || url.includes('/view') || url.includes('id='));
  };

  const handleSubmit = async () => {
    if (!test || !appUser) return;
    
    // Check if descriptive parts exist
    const hasDescriptive = test.section1Mark || test.section2Mark || test.section3Mark || test.section5Mark || test.section10Mark;
    
    if (hasDescriptive && !validateDriveLink(driveLink)) {
      alert("Please provide a valid Google Drive link containing your answer sheet.");
      return;
    }

    if (!confirm("Are you sure you want to submit your test? This action cannot be undone.")) {
      return;
    }

    setSubmitting(true);

    try {
      // Calculate MCQ Score
      let mcqScore = 0;
      test.mcqs?.forEach(q => {
        if (mcqAnswers[q.questionId] === q.correctOptionIndex) {
          mcqScore += 1;
        }
      });

      const attemptData = {
        testId,
        testTitle: test.title,
        studentId: appUser.uid,
        studentName: appUser.name,
        courseId,
        
        mcqScore,
        descriptiveScore: 0, // Admin will fill this later
        score: mcqScore, // Initial score is just MCQ
        totalScore: test.totalMarks || (test.mcqs?.length || 0),
        
        driveLink: hasDescriptive ? driveLink : null,
        status: hasDescriptive ? 'PENDING_EVALUATION' : 'COMPLETED',
        
        passed: false, // Will be updated by admin or system later
        violationCount: 0,
        submittedAt: serverTimestamp(),
        answers: mcqAnswers,
      };

      await addDoc(collection(db, 'testAttempts'), attemptData);
      
      alert("Test submitted successfully!");
      router.push(`/dashboard/student/courses/${courseId}`);
    } catch (err) {
      console.error(err);
      alert("Failed to submit test. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center animate-pulse">Loading Question Paper...</div>;
  if (error || !test) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 mt-6 select-none">
      {/* HEADER */}
      <div className="bg-card border-b-4 border-slate-800 rounded-t-xl p-8 text-center shadow-sm space-y-4 font-serif">
        <h1 className="text-4xl font-black tracking-tight">{test.title}</h1>
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm font-bold text-muted-foreground uppercase tracking-widest">
          {test.subject && <span>SUBJECT: {test.subject}</span>}
          {test.durationMinutes && <span>TIME: {test.durationMinutes} MINS</span>}
          {test.totalMarks && <span>MAX MARKS: {test.totalMarks}</span>}
        </div>
        {test.instructions && (
          <div className="mt-8 text-left border border-slate-700 p-6 bg-muted/20 rounded">
            <h3 className="font-bold mb-2">General Instructions:</h3>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">{test.instructions}</p>
          </div>
        )}
      </div>

      <div className="space-y-12 px-2 md:px-0 font-serif text-lg">
        
        {/* SECTION A: MCQs */}
        {test.mcqs && test.mcqs.length > 0 && (
          <div className="space-y-6">
            <div className="border-b border-slate-800 pb-2">
              <h2 className="text-2xl font-bold">PART A: Multiple Choice Questions</h2>
              <p className="text-sm text-muted-foreground italic">Answer directly in the application.</p>
            </div>
            
            {test.mcqs.map((q, i) => (
              <Card key={q.questionId} className="border-slate-800 shadow-none">
                <CardContent className="p-6">
                  <p className="font-bold mb-4">{i + 1}. {q.text}</p>
                  <div className="space-y-3 pl-4">
                    {q.options.map((opt, optIdx) => (
                      <label key={optIdx} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-muted/50 rounded transition-colors">
                        <input 
                          type="radio" 
                          name={`mcq-${q.questionId}`}
                          checked={mcqAnswers[q.questionId] === optIdx}
                          onChange={() => handleMcqSelect(q.questionId, optIdx)}
                          className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* SECTION B: 1 Mark */}
        {test.section1Mark && (
          <div className="space-y-4">
            <div className="border-b border-slate-800 pb-2">
              <h2 className="text-2xl font-bold">PART B: 1 Mark Questions</h2>
            </div>
            <div className="whitespace-pre-wrap p-6 border border-slate-800 rounded bg-card/50">
              {test.section1Mark}
            </div>
          </div>
        )}

        {/* SECTION C: 2 Marks */}
        {test.section2Mark && (
          <div className="space-y-4">
            <div className="border-b border-slate-800 pb-2">
              <h2 className="text-2xl font-bold">PART C: 2 Mark Questions</h2>
            </div>
            <div className="whitespace-pre-wrap p-6 border border-slate-800 rounded bg-card/50">
              {test.section2Mark}
            </div>
          </div>
        )}

        {/* SECTION D: 3 Marks */}
        {test.section3Mark && (
          <div className="space-y-4">
            <div className="border-b border-slate-800 pb-2">
              <h2 className="text-2xl font-bold">PART D: 3 Mark Questions</h2>
            </div>
            <div className="whitespace-pre-wrap p-6 border border-slate-800 rounded bg-card/50">
              {test.section3Mark}
            </div>
          </div>
        )}

        {/* SECTION E: 5 Marks */}
        {test.section5Mark && (
          <div className="space-y-4">
            <div className="border-b border-slate-800 pb-2">
              <h2 className="text-2xl font-bold">PART E: 5 Mark Questions</h2>
            </div>
            <div className="whitespace-pre-wrap p-6 border border-slate-800 rounded bg-card/50">
              {test.section5Mark}
            </div>
          </div>
        )}

        {/* SECTION F: 10 Marks */}
        {test.section10Mark && (
          <div className="space-y-4">
            <div className="border-b border-slate-800 pb-2">
              <h2 className="text-2xl font-bold">PART F: 10 Mark Questions</h2>
            </div>
            <div className="whitespace-pre-wrap p-6 border border-slate-800 rounded bg-card/50">
              {test.section10Mark}
            </div>
          </div>
        )}

      </div>

      {/* SUBMISSION AREA */}
      <Card className="border-indigo-500/30 bg-indigo-500/5 mt-12">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-indigo-400">
            <FileText className="w-5 h-5" />
            Submit Your Answer Sheet
          </CardTitle>
          <CardDescription>
            For descriptive sections (Parts B-F), write your answers neatly on a paper, scan them into a PDF, and upload it to your Google Drive. 
            Ensure the link access is set to <strong>"Anyone with the link can view"</strong>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          <div className="space-y-2">
            <Label htmlFor="driveLink" className="text-base font-bold">Google Drive Link</Label>
            <Input 
              id="driveLink"
              placeholder="https://drive.google.com/file/d/1XyZ.../view?usp=sharing" 
              value={driveLink}
              onChange={(e) => setDriveLink(e.target.value)}
              className="font-mono"
            />
            {!validateDriveLink(driveLink) && driveLink.length > 0 && (
              <p className="text-red-500 text-sm flex items-center gap-1 mt-1">
                <AlertCircle className="w-4 h-4" /> Please enter a valid Google Drive URL.
              </p>
            )}
          </div>

          <div className="pt-6 border-t border-slate-800 flex justify-end">
            <Button size="lg" onClick={handleSubmit} disabled={submitting} className="font-bold bg-indigo-600 hover:bg-indigo-700">
              <CheckCircle2 className="w-5 h-5 mr-2" />
              {submitting ? 'Submitting...' : 'Submit Final Answer Sheet'}
            </Button>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
