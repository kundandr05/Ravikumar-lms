'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Student {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  createdAt?: any;
}

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStudents() {
      try {
        const q = query(collection(db, 'users'), where('role', '==', 'student'));
        const snapshot = await getDocs(q);
        const studentsData: Student[] = [];
        snapshot.forEach((doc) => {
          studentsData.push({ ...doc.data() } as Student);
        });
        
        // Sort by newest first client-side to avoid needing a composite index immediately
        studentsData.sort((a, b) => {
          const dateA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
          const dateB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
          return dateB - dateA;
        });
        
        setStudents(studentsData);
      } catch (error) {
        console.error("Error fetching students:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchStudents();
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Student Directory</h1>
        <p className="text-slate-500 mt-2">Manage all registered students on the platform.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Students ({students.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-slate-500 text-center py-8">Loading students...</p>
          ) : students.length === 0 ? (
            <div className="text-center py-12 text-slate-500 border rounded-lg border-dashed">
              No students found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b text-sm text-slate-500">
                    <th className="pb-3 font-medium">Name</th>
                    <th className="pb-3 font-medium">Email</th>
                    <th className="pb-3 font-medium">Phone</th>
                    <th className="pb-3 font-medium">Joined On</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((student) => (
                    <tr key={student.uid} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 font-medium text-slate-900">{student.name}</td>
                      <td className="py-4 text-slate-600">{student.email}</td>
                      <td className="py-4 text-slate-600">{student.phone || 'N/A'}</td>
                      <td className="py-4 text-slate-500 text-sm">
                        {student.createdAt?.toDate ? student.createdAt.toDate().toLocaleDateString() : 'Unknown'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
