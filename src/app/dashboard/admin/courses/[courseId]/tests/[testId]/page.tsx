'use client';

import { useEffect, useState, use } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase/firebase';
import { doc, getDoc, collection, query, where, getDocs, deleteDoc, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Test, Question } from '@/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminTestDetailsPage({ params }: { params: Promise<{ courseId: string, testId: string }> }) {
  const { courseId, testId } = use(params);
  const { appUser } = useAuth();
  const router = useRouter();
  
  const [testData, setTestData] = useState<Test | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTestAndQuestions() {
      try {
        const testDoc = await getDoc(doc(db, 'tests', testId));
        if (testDoc.exists()) {
          setTestData({ testId: testDoc.id, ...testDoc.data() } as Test);
        }

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
      } catch (error) {
        console.error("Error fetching test data:", error);
      } finally {
        setLoading(false);
      }
    }

    if (testId) {
      fetchTestAndQuestions();
    }
  }, [testId]);

  const handleDeleteQuestion = async (questionId: string) => {
    if (confirm("Are you sure you want to delete this question?")) {
      try {
        await deleteDoc(doc(db, 'questions', questionId));
        setQuestions(questions.filter(q => q.questionId !== questionId));
      } catch (error) {
        console.error("Error deleting question:", error);
        alert("Failed to delete question.");
      }
    }
  };

  const handleDeleteTest = async () => {
    if (confirm("Are you sure you want to delete this ENTIRE test? This action cannot be undone.")) {
      try {
        await deleteDoc(doc(db, 'tests', testId));
        router.push(`/dashboard/admin/courses/${courseId}`);
      } catch (error) {
        console.error("Error deleting test:", error);
        alert("Failed to delete test.");
      }
    }
  };

  if (appUser?.role !== 'admin') {
    return <div className="p-8 text-center text-red-500">Access Denied. Admins only.</div>;
  }

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading test...</div>;
  }

  if (!testData) {
    return <div className="p-8 text-center text-red-500">Test not found.</div>;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-6">
        <Button variant="outline" onClick={() => router.push(`/dashboard/admin/courses/${courseId}`)}>Back to Course</Button>
        <Button variant="destructive" onClick={handleDeleteTest}>Delete Test</Button>
      </div>

      <Card className="bg-card text-card-foreground border">
        <CardContent className="p-8">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold">{testData.title}</h1>
              <p className="text-slate-300">{testData.description}</p>
            </div>
            <div className="bg-slate-800 px-4 py-2 rounded-lg text-center">
              <span className="block text-2xl font-bold text-amber-500">{testData.durationMinutes}</span>
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Minutes</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-end pt-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Questions</h2>
          <p className="text-muted-foreground">Add or manage questions for this test.</p>
        </div>
        <Link href={`/dashboard/admin/courses/${courseId}/tests/${testId}/questions/new`} className={buttonVariants()}>
          Add Question
        </Link>
      </div>

      {questions.length === 0 ? (
        <Card className="border-dashed border-2 bg-muted/50 text-center py-12">
          <CardContent className="space-y-4">
            <h3 className="text-xl font-bold text-foreground">No Questions Yet</h3>
            <p className="text-muted-foreground">Start building your test by adding multiple-choice questions.</p>
            <Link href={`/dashboard/admin/courses/${courseId}/tests/${testId}/questions/new`} className={buttonVariants({ variant: "outline" })}>
              Add First Question
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {questions.map((q) => (
            <Card key={q.questionId} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex gap-4">
                    <div className="bg-muted text-foreground font-bold w-8 h-8 rounded-full flex items-center justify-center shrink-0">
                      {q.order}
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground text-lg mb-4">{q.text}</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {q.options.map((opt, index) => (
                          <div 
                            key={index} 
                            className={`p-3 rounded border text-sm ${index === q.correctOptionIndex ? 'bg-green-50 border-green-200 font-medium text-green-900' : 'bg-muted/50 border-slate-200 text-foreground'}`}
                          >
                            <span className="mr-2 opacity-50">{String.fromCharCode(65 + index)}.</span>
                            {opt}
                            {index === q.correctOptionIndex && (
                              <svg className="w-4 h-4 text-green-600 inline-block ml-2 float-right" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <Link href={`/dashboard/admin/courses/${courseId}/tests/${testId}/questions/${q.questionId}/edit`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                      Edit
                    </Link>
                    <Button variant="destructive" size="sm" onClick={() => q.questionId && handleDeleteQuestion(q.questionId)}>
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
