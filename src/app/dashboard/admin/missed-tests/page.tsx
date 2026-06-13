'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase/firebase';
import { collection, getDocs, query, orderBy, where, doc, getDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { AlertTriangle, Download, Filter, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface MissedTestRecord {
  id: string;
  studentId: string;
  testId: string;
  courseId: string;
  dueDate: any;
  missedStatus: boolean;
  recordedAt: any;
  studentName?: string;
  testName?: string;
}

export default function MissedTestsReport() {
  const [missedRecords, setMissedRecords] = useState<MissedTestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function fetchMissedTests() {
      try {
        setLoading(true);
        const q = query(collection(db, 'missedTests'), orderBy('dueDate', 'desc'));
        const snap = await getDocs(q);

        const records: MissedTestRecord[] = [];
        
        // Fetch references
        const studentCache: Record<string, string> = {};
        const testCache: Record<string, string> = {};

        for (const docSnap of snap.docs) {
          const data = docSnap.data() as MissedTestRecord;
          
          if (!studentCache[data.studentId]) {
            const sDoc = await getDoc(doc(db, 'users', data.studentId));
            if (sDoc.exists()) studentCache[data.studentId] = sDoc.data().name || 'Unknown Student';
          }
          if (!testCache[data.testId]) {
            const tDoc = await getDoc(doc(db, 'tests', data.testId));
            if (tDoc.exists()) testCache[data.testId] = tDoc.data().title || 'Unknown Test';
          }

          records.push({
            ...data,
            id: docSnap.id,
            studentName: studentCache[data.studentId],
            testName: testCache[data.testId]
          });
        }

        setMissedRecords(records);
      } catch (error) {
        console.error("Failed to fetch missed tests", error);
      } finally {
        setLoading(false);
      }
    }
    fetchMissedTests();
  }, []);

  const filtered = missedRecords.filter(r => 
    r.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.testName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Missed Test Report</h1>
          <p className="text-muted-foreground mt-1">Track students who failed to submit scheduled tests by the deadline.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" /> Export CSV
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Missed Submissions ({filtered.length})</CardTitle>
            <div className="relative w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Search student or test..." 
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground bg-muted/50 uppercase border-b">
                <tr>
                  <th className="px-6 py-4 font-medium">Student Name</th>
                  <th className="px-6 py-4 font-medium">Test Name</th>
                  <th className="px-6 py-4 font-medium">Due Date</th>
                  <th className="px-6 py-4 font-medium">Recorded At</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">Loading records...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">No missed tests found.</td></tr>
                ) : filtered.map((record) => (
                  <tr key={record.id} className="hover:bg-muted/30">
                    <td className="px-6 py-4 font-medium">{record.studentName}</td>
                    <td className="px-6 py-4">{record.testName}</td>
                    <td className="px-6 py-4">{record.dueDate?.toDate ? format(record.dueDate.toDate(), 'PP p') : 'Unknown'}</td>
                    <td className="px-6 py-4 text-muted-foreground">{record.recordedAt?.toDate ? format(record.recordedAt.toDate(), 'PP p') : 'Unknown'}</td>
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-1.5 text-red-600 bg-red-50 px-2.5 py-1 rounded-full text-xs font-semibold w-fit">
                        <AlertTriangle className="w-3.5 h-3.5" /> Missed
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
