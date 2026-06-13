'use client';

import { useEffect, useState, useRef, use } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase/firebase';
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Test, Question } from '@/types';
import { useRouter } from 'next/navigation';

export default function StudentTestAttemptPage({ params }: { params: Promise<{ courseId: string, testId: string }> }) {
  const { courseId, testId } = use(params);
  const { appUser } = useAuth();
  const router = useRouter();
  
  const [testData, setTestData] = useState<Test | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    async function fetchTestAndQuestions() {
      if (!appUser?.uid) return;

      try {
        const testDoc = await getDoc(doc(db, 'tests', testId));
        if (!testDoc.exists()) {
          alert("Test not found");
          return;
        }
        const tData = { testId: testDoc.id, ...testDoc.data() } as Test;
        
        // Time validation
        const now = new Date();
        const from = tData.availableFrom?.toDate ? tData.availableFrom.toDate() : (tData.availableFrom ? new Date(tData.availableFrom) : null);
        const until = tData.availableUntil?.toDate ? tData.availableUntil.toDate() : (tData.availableUntil ? new Date(tData.availableUntil) : null);

        if (from && now < from) {
          alert("Test is not yet available.");
          router.replace('/dashboard/student/tests');
          return;
        }
        if (until && now > until) {
          alert("Test deadline has passed.");
          router.replace('/dashboard/student/tests');
          return;
        }

        // Check if already attempted
        const attemptQ = query(collection(db, 'testAttempts'), where('studentId', '==', appUser.uid), where('testId', '==', testId));
        const attemptSnap = await getDocs(attemptQ);
        if (!attemptSnap.empty) {
          alert("You have already completed this test.");
          router.replace('/dashboard/student/tests');
          return;
        }

        setTestData(tData);

        const questionsQuery = query(
          collection(db, 'questions'), 
          where('testId', '==', testId),
          orderBy('order', 'asc')
        );
        const questionsSnap = await getDocs(questionsQuery);
        const fetchedQuestions: Question[] = [];
        questionsSnap.forEach(d => {
          fetchedQuestions.push({ questionId: d.id, ...d.data() } as Question);
        });
        
        setQuestions(fetchedQuestions);
        setTimeLeft(tData.durationMinutes * 60);

      } catch (error) {
        console.error("Error fetching test data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchTestAndQuestions();
  }, [testId, appUser, router]);

  // Timer logic
  useEffect(() => {
    if (timeLeft !== null && timeLeft > 0 && !submitting) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0 && !submitting) {
      // Auto submit when time runs out
      handleSubmit();
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timeLeft, submitting]);

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  const handleSubmit = async () => {
    if (submitting || !testData || !appUser) return;
    setSubmitting(true);

    if (timerRef.current) clearTimeout(timerRef.current);

    let score = 0;
    questions.forEach(q => {
      if (q.questionId && answers[q.questionId] === q.correctOptionIndex) score += 1;
    });

    const totalScore = questions.length;
    try {
      await addDoc(collection(db, 'testAttempts'), {
        testId,
        testTitle: testData.title,
        studentId: appUser.uid,
        courseId,
        score,
        totalScore,
        passed: score >= (testData.passingMarks || 0),
        status: 'COMPLETED',
        submittedAt: serverTimestamp(),
        answers
      });

      alert(`Test Submitted! You scored ${score}/${totalScore}`);
      router.replace('/dashboard/student/tests');
    } catch (error) {
      console.error("Error submitting test", error);
      alert("Failed to submit test. Please contact support.");
      setSubmitting(false); 
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Preparing secure test environment...</div>;
  }

  if (!testData || questions.length === 0) {
    return <div className="p-8 text-center text-red-500">Invalid test configuration.</div>;
  }

  const formatTime = (seconds: number | null) => {
    if (seconds === null) return "--:--";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isLowTime = timeLeft !== null && timeLeft <= 60; 

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24">
      {/* Sticky Header with Timer */}
      <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur shadow-md rounded-b-xl border-x border-b border-slate-800 text-primary-foreground p-4 flex justify-between items-center px-6">
        <div>
          <h2 className="font-bold text-lg">{testData.title}</h2>
          <p className="text-xs text-muted-foreground">{questions.length} Questions</p>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-xl font-bold ${isLowTime ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-slate-800 text-slate-200'}`}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {formatTime(timeLeft)}
        </div>
      </div>

      <div className="space-y-8 px-2">
        {questions.map((q, index) => (
          <Card key={q.questionId} className="border-slate-200 shadow-sm" id={`q-${q.questionId}`}>
            <CardContent className="p-6 md:p-8">
              <h3 className="text-lg font-medium text-foreground mb-6">
                <span className="text-muted-foreground font-bold mr-3">{index + 1}.</span>
                {q.text}
              </h3>
              
              <div className="space-y-3 pl-7">
                {q.options.map((opt, optIndex) => {
                  const isSelected = q.questionId && answers[q.questionId] === optIndex;
                  return (
                    <button
                      key={optIndex}
                      onClick={() => q.questionId && handleSelectOption(q.questionId, optIndex)}
                      className={`w-full text-left p-4 rounded-lg border transition-all flex items-center gap-4 ${
                        isSelected 
                          ? 'border-amber-500 bg-amber-50 ring-1 ring-amber-500' 
                          : 'border-slate-200 hover:border-slate-300 hover:bg-muted/50'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                        isSelected ? 'border-amber-500' : 'border-slate-300'
                      }`}>
                        {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />}
                      </div>
                      <span className={`text-sm md:text-base ${isSelected ? 'text-amber-900 font-medium' : 'text-foreground'}`}>
                        {opt}
                      </span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-card text-card-foreground border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="text-sm text-muted-foreground font-medium">
            Answered: {Object.keys(answers).length} of {questions.length}
          </div>
          <Button 
            size="lg" 
            onClick={() => {
              if (confirm("Are you sure you want to submit your test? You cannot change your answers after submission.")) {
                handleSubmit();
              }
            }}
            disabled={submitting}
            className="px-8"
          >
            {submitting ? 'Submitting...' : 'Submit Test'}
          </Button>
        </div>
      </div>
    </div>
  );
}
