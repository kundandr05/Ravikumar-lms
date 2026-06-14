'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase/firebase';
import { collection, query, orderBy, getDocs, where } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { format } from 'date-fns';

export default function EvaluationsListPage() {
  const { appUser } = useAuth();
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEvaluations() {
      try {
        // Fetch all test attempts that have descriptive submissions
        const q = query(
          collection(db, 'testAttempts'),
          where('status', 'in', ['PENDING_EVALUATION', 'COMPLETED']),
          orderBy('submittedAt', 'desc')
        );
        const snap = await getDocs(q);
        
        // Filter out purely MCQ tests that don't need manual evaluation 
        // (those without a driveLink, assuming purely MCQ tests immediately mark COMPLETED and have no driveLink)
        const allAttempts = snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
        const descriptiveAttempts = allAttempts.filter(a => a.driveLink);
        
        setAttempts(descriptiveAttempts);
      } catch (error) {
        console.error("Error fetching evaluations", error);
      } finally {
        setLoading(false);
      }
    }
    fetchEvaluations();
  }, []);

  if (appUser?.role !== 'admin') {
    return <div className="p-8 text-center text-red-500">Access Denied. Admins only.</div>;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 pb-20">
      <div>
        <h1 className="text-3xl font-bold">Test Evaluations</h1>
        <p className="text-muted-foreground mt-2">Manually grade descriptive answer sheets submitted by students.</p>
      </div>
      
      {loading ? (
        <div className="p-8 text-center animate-pulse">Loading Submissions...</div>
      ) : attempts.length === 0 ? (
        <Card className="border-slate-800 bg-card">
          <CardContent className="p-12 text-center text-muted-foreground">
            No descriptive submissions found.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {attempts.map(attempt => (
            <Card key={attempt.id} className="border-slate-800 hover:border-slate-600 transition-colors">
              <CardContent className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h3 className="font-bold text-xl">{attempt.studentName}</h3>
                  <p className="text-muted-foreground font-medium">{attempt.testTitle}</p>
                  <p className="text-xs text-slate-500 mt-2">
                    Submitted on: {attempt.submittedAt ? format(attempt.submittedAt.toDate(), 'PPP p') : 'Unknown Date'}
                  </p>
                </div>
                
                <div className="flex items-center gap-4 text-right">
                  <div className="flex flex-col items-end mr-4">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${attempt.status === 'PENDING_EVALUATION' ? 'bg-amber-500/20 text-amber-500' : 'bg-green-500/20 text-green-500'}`}>
                      {attempt.status === 'PENDING_EVALUATION' ? 'Needs Grading' : 'Evaluated'}
                    </span>
                    {attempt.status === 'COMPLETED' && (
                      <span className="text-sm font-bold mt-2">Score: {attempt.score}/{attempt.totalScore}</span>
                    )}
                  </div>
                  
                  <Link href={`/dashboard/admin/evaluations/${attempt.id}`}>
                    <Button variant={attempt.status === 'PENDING_EVALUATION' ? 'default' : 'outline'} className={attempt.status === 'PENDING_EVALUATION' ? 'bg-indigo-600 hover:bg-indigo-700' : ''}>
                      {attempt.status === 'PENDING_EVALUATION' ? 'Evaluate Now' : 'Review Score'}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
