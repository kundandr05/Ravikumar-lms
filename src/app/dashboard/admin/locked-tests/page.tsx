'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/firebase';
import { collection, query, where, getDocs, getDoc, updateDoc, doc, deleteDoc, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { TestAttempt } from '@/types';
import { format } from 'date-fns';
import { ShieldAlert, Unlock, CheckCircle, Search } from 'lucide-react';
import { Telemetry } from '@/lib/telemetry';

interface LockedAttempt extends TestAttempt {
  studentName: string;
  studentEmail: string;
  testName: string;
  logs: any[];
}

export default function LockedTestsReviewPage() {
  const { appUser } = useAuth();
  const [lockedAttempts, setLockedAttempts] = useState<LockedAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (appUser?.role === 'admin') {
      fetchLocked();
    }
  }, [appUser]);

  const fetchLocked = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'testAttempts'), where('status', '==', 'LOCKED_FOR_REVIEW'));
      const snap = await getDocs(q);
      
      const attempts: LockedAttempt[] = [];

      for (const d of snap.docs) {
        const attempt = { attemptId: d.id, ...d.data() } as TestAttempt;
        
        // Fetch User Info
        const userDoc = await getDoc(doc(db, 'users', attempt.studentId));
        const userData = userDoc.exists() ? userDoc.data() : { name: 'Unknown', email: 'Unknown' };

        // Fetch Integrity Logs (testViolations)
        const logsQ = query(
          collection(db, 'testViolations'), 
          where('testId', '==', attempt.testId),
          where('studentId', '==', attempt.studentId),
          orderBy('timestamp', 'desc')
        );
        const logsSnap = await getDocs(logsQ);
        const logs = logsSnap.docs.map(l => l.data());

        attempts.push({
          ...attempt,
          studentName: userData.name,
          studentEmail: userData.email,
          testName: (attempt as any).testTitle || 'Unknown Test',
          logs
        });
      }

      setLockedAttempts(attempts);
    } catch (e) {
      console.error("Error fetching locked tests", e);
    } finally {
      setLoading(false);
    }
  };

  const handleAllowReattempt = async (attemptId: string, studentId: string, testId: string) => {
    if (!confirm("Are you sure? This will delete their current locked attempt and allow them to start from scratch.")) return;
    setProcessingId(attemptId);
    try {
      await deleteDoc(doc(db, 'testAttempts', attemptId));
      
      Telemetry.logTimelineEvent({
        studentId,
        type: 'TEST_REOPENED',
        description: `Test Unlocked by Admin for reattempt.`
      });

      setLockedAttempts(prev => prev.filter(a => a.attemptId !== attemptId));
    } catch (e) {
      console.error(e);
      alert("Failed to unlock.");
    } finally {
      setProcessingId(null);
    }
  };

  const handlePermanentlyClose = async (attemptId: string) => {
    if (!confirm("Are you sure? This will accept their current score and mark the test as COMPLETED.")) return;
    setProcessingId(attemptId);
    try {
      await updateDoc(doc(db, 'testAttempts', attemptId), {
        status: 'COMPLETED'
      });
      setLockedAttempts(prev => prev.filter(a => a.attemptId !== attemptId));
    } catch (e) {
      console.error(e);
      alert("Failed to close test.");
    } finally {
      setProcessingId(null);
    }
  };

  if (appUser?.role !== 'admin') return <div className="p-8 text-center text-red-500">Access Denied</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <ShieldAlert className="w-8 h-8 text-red-500" /> Integrity Review System
        </h1>
        <p className="text-muted-foreground mt-2">Review and manage tests locked due to cheating or integrity violations.</p>
      </div>

      {loading ? (
        <div className="p-12 text-center animate-pulse text-muted-foreground">Scanning for locked tests...</div>
      ) : lockedAttempts.length === 0 ? (
        <Card className="border-dashed border-2 bg-muted/50 py-12 text-center">
          <CardContent className="flex flex-col items-center">
            <CheckCircle className="w-16 h-16 text-green-500 mb-4 opacity-50" />
            <h3 className="text-xl font-bold">All Clear</h3>
            <p className="text-muted-foreground">There are no locked tests requiring your review right now.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {lockedAttempts.map(attempt => (
            <Card key={attempt.attemptId} className="border-red-200 shadow-sm overflow-hidden">
              <div className="bg-red-500 text-white px-6 py-2 text-sm font-bold flex justify-between">
                <span>LOCKED FOR REVIEW</span>
                <span>{attempt.submittedAt?.toDate ? format(attempt.submittedAt.toDate(), 'PP p') : 'Unknown Time'}</span>
              </div>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between gap-6">
                  <div className="space-y-4 flex-1">
                    <div>
                      <h3 className="text-xl font-bold">{attempt.testName}</h3>
                      <p className="text-slate-600 font-medium">{attempt.studentName} ({attempt.studentEmail})</p>
                    </div>

                    <div className="bg-slate-50 border p-4 rounded-lg">
                      <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2"><Search className="w-4 h-4"/> Violation History</h4>
                      <ul className="space-y-2 text-sm">
                        {attempt.logs.length > 0 ? attempt.logs.map((log, i) => (
                          <li key={i} className="flex gap-4 text-slate-600 border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                            <span className="font-mono text-red-500 shrink-0">
                              {log.timestamp?.toDate ? format(log.timestamp.toDate(), 'HH:mm:ss') : 'N/A'}
                            </span>
                            <span>{log.violationType || log.reason}</span>
                          </li>
                        )) : (
                          <li className="text-muted-foreground">No detailed logs found. Auto-locked by legacy system.</li>
                        )}
                      </ul>
                    </div>

                    <div className="flex items-center gap-4 text-sm bg-blue-50 p-3 rounded text-blue-800">
                      <strong>Current Score Before Lock:</strong> {attempt.score} / {attempt.totalQuestions}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 shrink-0 md:w-64">
                    <Button 
                      onClick={() => attempt.attemptId && handleAllowReattempt(attempt.attemptId, attempt.studentId, attempt.testId)}
                      disabled={processingId === attempt.attemptId}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      <Unlock className="w-4 h-4 mr-2" /> Allow Reattempt
                    </Button>
                    <p className="text-xs text-slate-500 text-center">Deletes attempt, resets violations</p>
                    
                    <div className="h-px bg-slate-200 my-2"></div>
                    
                    <Button 
                      onClick={() => attempt.attemptId && handlePermanentlyClose(attempt.attemptId)}
                      disabled={processingId === attempt.attemptId}
                      variant="outline"
                      className="w-full border-slate-300"
                    >
                      Permanently Close
                    </Button>
                    <p className="text-xs text-slate-500 text-center">Accept current score ({attempt.score})</p>
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
