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
import { FileText } from 'lucide-react';

export default function AdminTestDetailsPage({ params }: { params: Promise<{ courseId: string, testId: string }> }) {
  const { courseId, testId } = use(params);
  const { appUser } = useAuth();
  const router = useRouter();
  
  const [testData, setTestData] = useState<Test | null>(null);
  const [legacyQuestions, setLegacyQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTestAndQuestions() {
      try {
        const testDoc = await getDoc(doc(db, 'tests', testId));
        if (testDoc.exists()) {
          setTestData({ testId: testDoc.id, ...testDoc.data() } as Test);
        }

        // Fetch legacy questions just in case it's an old test
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
        
        setLegacyQuestions(fetchedQuestions);
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

  const isLegacyTest = legacyQuestions.length > 0 && (!testData.mcqs || testData.mcqs.length === 0);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 pb-20">
      <div className="flex justify-between items-center mb-6">
        <Button variant="outline" onClick={() => router.push(`/dashboard/admin/courses/${courseId}`)}>Back to Course</Button>
        <Button variant="destructive" onClick={handleDeleteTest}>Delete Test</Button>
      </div>

      <Card className="bg-card text-card-foreground border-slate-800">
        <CardContent className="p-8">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold">{testData.title}</h1>
              <p className="text-muted-foreground">{testData.description}</p>
              {testData.instructions && (
                <div className="mt-4 p-4 bg-muted/30 border border-slate-800 rounded">
                  <h3 className="text-sm font-bold text-slate-400 mb-1">Instructions</h3>
                  <p className="text-sm whitespace-pre-wrap">{testData.instructions}</p>
                </div>
              )}
            </div>
            <div className="bg-slate-800 px-4 py-2 rounded-lg text-center shrink-0 ml-4">
              <span className="block text-2xl font-bold text-amber-500">{testData.durationMinutes}</span>
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Minutes</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-end pt-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Test Question Paper</h2>
          <p className="text-muted-foreground">Review the contents of this test.</p>
        </div>
        {!isLegacyTest && (
          <Link href={`/dashboard/admin/courses/${courseId}/tests/${testId}/edit`} className={buttonVariants()}>
            Edit Test Details & Questions
          </Link>
        )}
      </div>

      {isLegacyTest ? (
        <div className="space-y-4">
          <div className="bg-amber-500/10 text-amber-500 p-4 rounded-lg border border-amber-500/20 mb-6">
            This is a legacy test format. It uses the old question system.
          </div>
          {legacyQuestions.map((q) => (
            <Card key={q.questionId} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <div className="bg-muted text-foreground font-bold w-8 h-8 rounded-full flex items-center justify-center shrink-0">
                    {q.order}
                  </div>
                  <div className="w-full">
                    <h4 className="font-medium text-foreground text-lg mb-4">{q.text}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {q.options.map((opt, index) => (
                        <div 
                          key={index} 
                          className={`p-3 rounded border text-sm ${index === q.correctOptionIndex ? 'bg-green-50 border-green-200 font-medium text-green-900' : 'bg-muted/50 border-slate-200 text-foreground'}`}
                        >
                          <span className="mr-2 opacity-50">{String.fromCharCode(65 + index)}.</span>
                          {opt}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-8 font-serif">
          {/* SECTION A: MCQs */}
          {testData.mcqs && testData.mcqs.length > 0 && (
            <Card className="border-slate-800 shadow-none bg-card/50">
              <CardHeader className="border-b border-slate-800 pb-4">
                <CardTitle className="text-xl">PART A: Multiple Choice Questions</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {testData.mcqs.map((q, i) => (
                  <div key={q.questionId || i} className="space-y-3">
                    <p className="font-bold text-lg">{i + 1}. {q.text}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-4">
                      {q.options.map((opt, optIdx) => (
                        <div key={optIdx} className={`p-3 rounded border text-sm ${optIdx === q.correctOptionIndex ? 'bg-green-500/10 border-green-500/30 text-green-400 font-medium' : 'border-slate-800 text-muted-foreground'}`}>
                          <span className="mr-2 opacity-50">{String.fromCharCode(65 + optIdx)}.</span>
                          {opt}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* SECTION B: 1 Mark */}
          {testData.section1Mark && (
            <Card className="border-slate-800 shadow-none bg-card/50">
              <CardHeader className="border-b border-slate-800 pb-4">
                <CardTitle className="text-xl">PART B: 1 Mark Questions</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="whitespace-pre-wrap">{testData.section1Mark}</div>
              </CardContent>
            </Card>
          )}

          {/* SECTION C: 2 Marks */}
          {testData.section2Mark && (
            <Card className="border-slate-800 shadow-none bg-card/50">
              <CardHeader className="border-b border-slate-800 pb-4">
                <CardTitle className="text-xl">PART C: 2 Mark Questions</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="whitespace-pre-wrap">{testData.section2Mark}</div>
              </CardContent>
            </Card>
          )}

          {/* SECTION D: 3 Marks */}
          {testData.section3Mark && (
            <Card className="border-slate-800 shadow-none bg-card/50">
              <CardHeader className="border-b border-slate-800 pb-4">
                <CardTitle className="text-xl">PART D: 3 Mark Questions</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="whitespace-pre-wrap">{testData.section3Mark}</div>
              </CardContent>
            </Card>
          )}

          {/* SECTION E: 5 Marks */}
          {testData.section5Mark && (
            <Card className="border-slate-800 shadow-none bg-card/50">
              <CardHeader className="border-b border-slate-800 pb-4">
                <CardTitle className="text-xl">PART E: 5 Mark Questions</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="whitespace-pre-wrap">{testData.section5Mark}</div>
              </CardContent>
            </Card>
          )}

          {/* SECTION F: 10 Marks */}
          {testData.section10Mark && (
            <Card className="border-slate-800 shadow-none bg-card/50">
              <CardHeader className="border-b border-slate-800 pb-4">
                <CardTitle className="text-xl">PART F: 10 Mark Questions</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="whitespace-pre-wrap">{testData.section10Mark}</div>
              </CardContent>
            </Card>
          )}

          {(!testData.mcqs || testData.mcqs.length === 0) && !testData.section1Mark && !testData.section2Mark && !testData.section3Mark && !testData.section5Mark && !testData.section10Mark && !isLegacyTest && (
            <div className="text-center py-12 border border-slate-800 rounded bg-muted/20 text-muted-foreground">
              This test is completely empty. Click 'Edit Test Details' to add questions.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
