'use client';

import { use, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useRouter } from 'next/navigation';
import { ExternalLink, CheckCircle2 } from 'lucide-react';

export default function GradeEvaluationPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = use(params);
  const { appUser } = useAuth();
  const router = useRouter();

  const [attempt, setAttempt] = useState<any>(null);
  const [test, setTest] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Scoring inputs
  const [marks1Section, setMarks1Section] = useState<number>(0);
  const [marks2Section, setMarks2Section] = useState<number>(0);
  const [marks3Section, setMarks3Section] = useState<number>(0);
  const [marks5Section, setMarks5Section] = useState<number>(0);
  const [marks10Section, setMarks10Section] = useState<number>(0);
  const [teacherRemarks, setTeacherRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetchAttemptAndTest() {
      try {
        const attemptDoc = await getDoc(doc(db, 'testAttempts', attemptId));
        if (!attemptDoc.exists()) return;
        
        const attemptData = attemptDoc.data();
        setAttempt({ id: attemptDoc.id, ...attemptData });
        
        // Initialize state if already graded
        if (attemptData.status === 'COMPLETED') {
          setMarks1Section(attemptData.marks1Section || 0);
          setMarks2Section(attemptData.marks2Section || 0);
          setMarks3Section(attemptData.marks3Section || 0);
          setMarks5Section(attemptData.marks5Section || 0);
          setMarks10Section(attemptData.marks10Section || 0);
          setTeacherRemarks(attemptData.teacherRemarks || '');
        }

        const testDoc = await getDoc(doc(db, 'tests', attemptData.testId));
        if (testDoc.exists()) {
          setTest({ id: testDoc.id, ...testDoc.data() });
        }
      } catch (error) {
        console.error("Error fetching data", error);
      } finally {
        setLoading(false);
      }
    }
    fetchAttemptAndTest();
  }, [attemptId]);

  const handleSaveEvaluation = async () => {
    if (!attempt || !appUser) return;
    setSubmitting(true);

    try {
      const descriptiveScore = Number(marks1Section) + Number(marks2Section) + Number(marks3Section) + Number(marks5Section) + Number(marks10Section);
      const finalScore = (attempt.mcqScore || 0) + descriptiveScore;

      await updateDoc(doc(db, 'testAttempts', attemptId), {
        marks1Section: Number(marks1Section),
        marks2Section: Number(marks2Section),
        marks3Section: Number(marks3Section),
        marks5Section: Number(marks5Section),
        marks10Section: Number(marks10Section),
        descriptiveScore,
        score: finalScore,
        teacherRemarks,
        status: 'COMPLETED',
        evaluatedBy: appUser.uid,
        evaluatedAt: serverTimestamp(),
      });

      alert("Evaluation saved successfully!");
      router.push('/dashboard/admin/evaluations');
    } catch (error) {
      console.error("Failed to save evaluation", error);
      alert("Error saving evaluation");
    } finally {
      setSubmitting(false);
    }
  };

  if (appUser?.role !== 'admin') return <div className="p-8 text-center text-red-500">Access Denied. Admins only.</div>;
  if (loading) return <div className="p-8 text-center animate-pulse">Loading Evaluation...</div>;
  if (!attempt || !test) return <div className="p-8 text-center text-red-500">Data not found.</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.push('/dashboard/admin/evaluations')}>Back</Button>
          <h1 className="text-3xl font-bold">Grade Submission</h1>
        </div>
        {attempt.status === 'COMPLETED' && (
          <span className="bg-green-500/20 text-green-500 font-bold px-4 py-2 rounded-full">Evaluated</span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Student Info & Paper */}
        <div className="md:col-span-1 space-y-6">
          <Card className="border-slate-800">
            <CardHeader>
              <CardTitle>Student</CardTitle>
            </CardHeader>
            <CardContent>
              <h2 className="text-xl font-black">{attempt.studentName}</h2>
              <p className="text-muted-foreground mt-1">{attempt.testTitle}</p>
            </CardContent>
          </Card>

          <Card className="border-indigo-500/30 bg-indigo-500/5">
            <CardHeader>
              <CardTitle>Answer Sheet</CardTitle>
              <CardDescription>Review the handwritten answers.</CardDescription>
            </CardHeader>
            <CardContent>
              <a href={attempt.driveLink} target="_blank" rel="noopener noreferrer">
                <Button className="w-full bg-indigo-600 hover:bg-indigo-700">
                  <ExternalLink className="w-4 h-4 mr-2" /> Open Google Drive
                </Button>
              </a>
            </CardContent>
          </Card>

          <Card className="border-slate-800">
            <CardHeader>
              <CardTitle>Auto-Evaluated MCQs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center p-4 bg-muted/20 rounded border border-slate-700">
                <p className="text-sm text-muted-foreground uppercase font-bold">MCQ Score</p>
                <p className="text-4xl font-black mt-2 text-foreground">{attempt.mcqScore || 0}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: Grading Form */}
        <div className="md:col-span-2">
          <Card className="border-slate-800 h-full">
            <CardHeader>
              <CardTitle>Manual Evaluation</CardTitle>
              <CardDescription>Enter the marks obtained in each descriptive section.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              <div className="grid grid-cols-2 gap-6">
                {test.section1Mark && (
                  <div className="space-y-2">
                    <Label className="font-bold text-amber-500">1 Mark Section Total</Label>
                    <Input type="number" min="0" value={marks1Section} onChange={e => setMarks1Section(Number(e.target.value))} className="text-lg font-mono" />
                  </div>
                )}
                {test.section2Mark && (
                  <div className="space-y-2">
                    <Label className="font-bold text-amber-500">2 Mark Section Total</Label>
                    <Input type="number" min="0" value={marks2Section} onChange={e => setMarks2Section(Number(e.target.value))} className="text-lg font-mono" />
                  </div>
                )}
                {test.section3Mark && (
                  <div className="space-y-2">
                    <Label className="font-bold text-amber-500">3 Mark Section Total</Label>
                    <Input type="number" min="0" value={marks3Section} onChange={e => setMarks3Section(Number(e.target.value))} className="text-lg font-mono" />
                  </div>
                )}
                {test.section5Mark && (
                  <div className="space-y-2">
                    <Label className="font-bold text-amber-500">5 Mark Section Total</Label>
                    <Input type="number" min="0" value={marks5Section} onChange={e => setMarks5Section(Number(e.target.value))} className="text-lg font-mono" />
                  </div>
                )}
                {test.section10Mark && (
                  <div className="space-y-2">
                    <Label className="font-bold text-amber-500">10 Mark Section Total</Label>
                    <Input type="number" min="0" value={marks10Section} onChange={e => setMarks10Section(Number(e.target.value))} className="text-lg font-mono" />
                  </div>
                )}
              </div>

              <div className="space-y-2 pt-6 border-t border-slate-800">
                <Label className="font-bold">Teacher Remarks (Optional)</Label>
                <Textarea 
                  placeholder="Provide feedback on presentation, concepts, etc..." 
                  value={teacherRemarks}
                  onChange={e => setTeacherRemarks(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="pt-6 border-t border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground uppercase font-bold">Calculated Final Score</p>
                  <p className="text-3xl font-black mt-1">
                    {(attempt.mcqScore || 0) + Number(marks1Section) + Number(marks2Section) + Number(marks3Section) + Number(marks5Section) + Number(marks10Section)}
                    <span className="text-lg text-muted-foreground font-medium"> / {attempt.totalScore || test.totalMarks || '-'}</span>
                  </p>
                </div>
                
                <Button size="lg" onClick={handleSaveEvaluation} disabled={submitting} className="bg-blue-600 hover:bg-blue-700">
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  {submitting ? 'Saving...' : 'Save Evaluation'}
                </Button>
              </div>

            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
