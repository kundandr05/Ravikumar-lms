'use client';

import { use, useEffect, useState } from 'react';
import { db } from '@/lib/firebase/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { format } from 'date-fns';

interface StudentInfo {
  uid: string;
  name: string;
  email: string;
  phone?: string;
}

export default function ReportCardPage({ params }: { params: Promise<{ studentId: string }> }) {
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

        // Fetch completed tests
        const testQ = query(collection(db, 'testAttempts'), where('studentId', '==', studentId), where('status', '==', 'COMPLETED'));
        const testSnap = await getDocs(testQ);
        
        const attempts = testSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
        
        // Sort newest first
        attempts.sort((a, b) => {
          const dateA = a.submittedAt?.toMillis ? a.submittedAt.toMillis() : 0;
          const dateB = b.submittedAt?.toMillis ? b.submittedAt.toMillis() : 0;
          return dateB - dateA;
        });
        
        setTestAttempts(attempts);

        // Auto print after a small delay to ensure rendering is complete
        setTimeout(() => {
          window.print();
        }, 1000);

      } catch (e) {
        console.error("Failed to load student data:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [studentId]);

  if (loading) return <div className="p-8 text-center animate-pulse">Generating Marks Card...</div>;
  if (!student) return <div className="p-8 text-center text-red-500">Student not found</div>;

  // Calculate totals
  let grandTotalObtained = 0;
  let grandTotalMax = 0;
  testAttempts.forEach(t => {
    grandTotalObtained += (t.score || 0);
    grandTotalMax += (t.totalScore || 0);
  });
  const overallPercentage = grandTotalMax > 0 ? Math.round((grandTotalObtained / grandTotalMax) * 100) : 0;

  let grade = 'F';
  if (overallPercentage >= 90) grade = 'A+';
  else if (overallPercentage >= 80) grade = 'A';
  else if (overallPercentage >= 70) grade = 'B+';
  else if (overallPercentage >= 60) grade = 'B';
  else if (overallPercentage >= 50) grade = 'C';
  else if (overallPercentage >= 40) grade = 'D';

  return (
    <div className="min-h-screen bg-white text-black p-8 font-serif" style={{ WebkitPrintColorAdjust: 'exact', colorAdjust: 'exact' }}>
      
      {/* Hide this print button when actually printing */}
      <div className="print:hidden mb-8 text-center">
        <button 
          onClick={() => window.print()} 
          className="bg-blue-600 text-white px-6 py-2 rounded-full font-sans font-bold shadow hover:bg-blue-700"
        >
          Print Marks Card
        </button>
      </div>

      <div className="max-w-4xl mx-auto border-4 border-double border-slate-800 p-8">
        
        {/* HEADER */}
        <div className="text-center border-b-2 border-slate-800 pb-6 mb-6">
          <h1 className="text-4xl font-black uppercase tracking-widest text-slate-900">Ravi Classes</h1>
          <p className="text-sm font-semibold tracking-widest text-slate-600 mt-2">CLASS 10 COACHING INSTITUTE</p>
          <h2 className="text-2xl font-bold mt-4 underline decoration-2 underline-offset-4">STUDENT PERFORMANCE REPORT</h2>
        </div>

        {/* STUDENT DETAILS */}
        <div className="grid grid-cols-2 gap-4 mb-8 text-lg">
          <div>
            <span className="font-bold w-32 inline-block">Student Name:</span> 
            <span className="uppercase font-semibold border-b border-slate-400 pb-1">{student.name}</span>
          </div>
          <div>
            <span className="font-bold w-32 inline-block">Academic Year:</span> 
            <span className="border-b border-slate-400 pb-1">2026-2027</span>
          </div>
          <div>
            <span className="font-bold w-32 inline-block">Contact:</span> 
            <span className="border-b border-slate-400 pb-1">{student.phone || student.email}</span>
          </div>
          <div>
            <span className="font-bold w-32 inline-block">Report Date:</span> 
            <span className="border-b border-slate-400 pb-1">{format(new Date(), 'dd MMM yyyy')}</span>
          </div>
        </div>

        {/* MARKS TABLE */}
        <div className="mb-8">
          <table className="w-full border-collapse border border-slate-800">
            <thead>
              <tr className="bg-slate-100 text-slate-900">
                <th className="border border-slate-800 p-3 text-left">Sl. No.</th>
                <th className="border border-slate-800 p-3 text-left">Subject / Test Title</th>
                <th className="border border-slate-800 p-3 text-center">Date</th>
                <th className="border border-slate-800 p-3 text-center">Max Marks</th>
                <th className="border border-slate-800 p-3 text-center">Marks Obtained</th>
                <th className="border border-slate-800 p-3 text-center">%</th>
              </tr>
            </thead>
            <tbody>
              {testAttempts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="border border-slate-800 p-8 text-center italic text-slate-500">
                    No completed tests found for this student.
                  </td>
                </tr>
              ) : (
                testAttempts.map((test, index) => {
                  const perc = test.totalScore > 0 ? Math.round((test.score / test.totalScore) * 100) : 0;
                  return (
                    <tr key={index}>
                      <td className="border border-slate-800 p-3 text-center">{index + 1}</td>
                      <td className="border border-slate-800 p-3 font-semibold">{test.testTitle || 'Untitled Test'}</td>
                      <td className="border border-slate-800 p-3 text-center">{test.submittedAt ? format(test.submittedAt.toDate(), 'dd/MM/yyyy') : '-'}</td>
                      <td className="border border-slate-800 p-3 text-center">{test.totalScore}</td>
                      <td className="border border-slate-800 p-3 text-center font-bold">{test.score}</td>
                      <td className="border border-slate-800 p-3 text-center">{perc}%</td>
                    </tr>
                  )
                })
              )}
            </tbody>
            {testAttempts.length > 0 && (
              <tfoot>
                <tr className="bg-slate-100 font-bold">
                  <td colSpan={3} className="border border-slate-800 p-3 text-right">GRAND TOTAL</td>
                  <td className="border border-slate-800 p-3 text-center">{grandTotalMax}</td>
                  <td className="border border-slate-800 p-3 text-center">{grandTotalObtained}</td>
                  <td className="border border-slate-800 p-3 text-center">{overallPercentage}%</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* OVERALL PERFORMANCE */}
        {testAttempts.length > 0 && (
          <div className="flex justify-between items-center border border-slate-800 p-6 bg-slate-50 mb-12">
            <div>
              <p className="text-xl font-bold">Overall Percentage: <span className="text-2xl ml-2">{overallPercentage}%</span></p>
            </div>
            <div>
              <p className="text-xl font-bold">Grade: <span className="text-3xl ml-2 text-slate-900 border-2 border-slate-900 rounded-full w-12 h-12 inline-flex items-center justify-center">{grade}</span></p>
            </div>
          </div>
        )}

        {/* SIGNATURES */}
        <div className="flex justify-between mt-24 px-8 text-center font-bold">
          <div>
            <div className="w-48 border-b-2 border-slate-800 mb-2"></div>
            <p>Class Teacher Signature</p>
          </div>
          <div>
            <div className="w-48 border-b-2 border-slate-800 mb-2"></div>
            <p>Parent/Guardian Signature</p>
          </div>
          <div>
            <div className="w-48 border-b-2 border-slate-800 mb-2"></div>
            <p>Director Signature</p>
          </div>
        </div>

      </div>

      <style jsx global>{`
        @media print {
          body {
            background-color: white !important;
          }
          @page {
            margin: 10mm;
            size: A4;
          }
        }
      `}</style>
    </div>
  );
}
