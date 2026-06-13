'use client';

import { use, useEffect, useState } from 'react';
import { db } from '@/lib/firebase/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { format } from 'date-fns';
import { Target } from 'lucide-react';

interface StudentInfo {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  status?: string;
}

export default function StudentDetailsPage({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = use(params);
  const [student, setStudent] = useState<StudentInfo | null>(null);
  const [testAttempts, setTestAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        const userDoc = await getDoc(doc(db, 'users', studentId));
        if (userDoc.exists()) {
          setStudent({ uid: userDoc.id, ...userDoc.data() } as StudentInfo);
        }

        // Fetch tests
        const testQ = query(collection(db, 'testAttempts'), where('studentId', '==', studentId));
        const testSnap = await getDocs(testQ);
        setTestAttempts(testSnap.docs.map(d => d.data()));

      } catch (e) {
        console.error("Failed to load student data:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [studentId]);

  if (loading) return <div className="p-8 text-center animate-pulse">Loading Student Profile...</div>;
  if (!student) return <div className="p-8 text-center text-red-500">Student not found</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12 mt-8">
      {/* HEADER */}
      <div className="bg-card border border-slate-800 rounded-xl p-8 shadow-sm">
        <h1 className="text-4xl font-black text-foreground tracking-tight">{student.name}</h1>
        <div className="mt-4 space-y-2 text-muted-foreground text-lg">
          <p><strong>Email:</strong> {student.email}</p>
          <p><strong>Phone:</strong> {student.phone || 'Not provided'}</p>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-2xl font-bold flex items-center gap-2">
          <Target className="w-6 h-6 text-amber-500" />
          Test Scores
        </h3>
        {testAttempts.length === 0 ? (
          <div className="p-8 text-center border border-slate-800 rounded-lg text-muted-foreground bg-card">No tests taken yet.</div>
        ) : (
          <div className="grid gap-4">
            {testAttempts.map((test, i) => {
              const perc = test.totalScore > 0 ? Math.round((test.score / test.totalScore) * 100) : 0;
              return (
                <div key={i} className="flex justify-between items-center p-6 rounded-xl border border-slate-800 bg-card hover:border-slate-700 transition-colors">
                  <div>
                    <h4 className="font-bold text-xl text-foreground">{test.testTitle}</h4>
                    <p className="text-sm text-muted-foreground mt-1">Attempted on {test.submittedAt ? format(test.submittedAt.toDate(), 'PPP p') : 'Unknown Date'}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-2xl">{test.score} / {test.totalScore} <span className="text-muted-foreground font-medium text-lg ml-2">({perc}%)</span></div>
                    <div className={`text-sm font-bold mt-1 ${test.passed ? 'text-green-500' : 'text-red-500'}`}>
                      {test.passed ? 'PASSED' : 'FAILED'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
