'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

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

  const downloadCSV = () => {
    if (students.length === 0) return;

    // Define CSV headers
    const headers = ['Name', 'Email', 'Phone', 'Joined On'];
    
    // Convert student data to CSV rows
    const csvRows = students.map(student => {
      const name = `"${student.name.replace(/"/g, '""')}"`;
      const email = `"${student.email}"`;
      const phone = `"${student.phone || 'N/A'}"`;
      const joinedOn = `"${student.createdAt?.toDate ? student.createdAt.toDate().toLocaleDateString() : 'Unknown'}"`;
      return [name, email, phone, joinedOn].join(',');
    });
    
    // Combine headers and rows
    const csvContent = [headers.join(','), ...csvRows].join('\n');
    
    // Create blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `students_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Student Directory</h1>
          <p className="text-slate-500 mt-2">Manage all registered students on the platform.</p>
        </div>
        <Button onClick={downloadCSV} disabled={students.length === 0 || loading} className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export CSV
        </Button>
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
                      <td className="py-4 font-medium text-slate-900">
                        <Link href={`/dashboard/admin/students/${student.uid}`} className="hover:text-amber-600 hover:underline transition-colors">
                          {student.name}
                        </Link>
                      </td>
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
