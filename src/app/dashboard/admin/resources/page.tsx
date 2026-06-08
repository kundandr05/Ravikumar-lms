'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase/firebase';
import { collection, query, orderBy, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { StudyResource } from '@/types';
import Link from 'next/link';
import { Input } from '@/components/ui/input';

export default function AdminResourcesPage() {
  const [resources, setResources] = useState<StudyResource[]>([]);
  const [filteredResources, setFilteredResources] = useState<StudyResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchResources();
  }, []);

  useEffect(() => {
    if (!searchQuery) {
      setFilteredResources(resources);
    } else {
      const lowerQ = searchQuery.toLowerCase();
      setFilteredResources(
        resources.filter(r => 
          r.title.toLowerCase().includes(lowerQ) || 
          r.category.toLowerCase().includes(lowerQ) ||
          r.subject.toLowerCase().includes(lowerQ)
        )
      );
    }
  }, [searchQuery, resources]);

  const fetchResources = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'resources'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const data: StudyResource[] = [];
      snap.forEach(d => {
        data.push({ resourceId: d.id, ...d.data() } as StudyResource);
      });
      setResources(data);
      setFilteredResources(data);
    } catch (error) {
      console.error("Error fetching resources", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this resource? Students will lose access.")) return;
    try {
      await deleteDoc(doc(db, 'resources', id));
      setResources(prev => prev.filter(r => r.resourceId !== id));
    } catch (error) {
      console.error("Error deleting resource", error);
      alert("Failed to delete.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Study Materials</h1>
          <p className="text-slate-500 mt-2">Manage PDFs, worksheets, and question banks.</p>
        </div>
        <Link href="/dashboard/admin/resources/new" className={buttonVariants()}>
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Upload Resource
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <CardTitle>Resource Library</CardTitle>
              <CardDescription>All uploaded study materials.</CardDescription>
            </div>
            <div className="w-full md:w-72">
              <Input 
                placeholder="Search by title, subject, or category..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-slate-500">Loading resources...</div>
          ) : filteredResources.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg bg-slate-50 text-slate-500">
              No study materials found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="p-4 font-medium">Title & Description</th>
                    <th className="p-4 font-medium">Category</th>
                    <th className="p-4 font-medium">Subject</th>
                    <th className="p-4 font-medium">Link</th>
                    <th className="p-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredResources.map((res) => (
                    <tr key={res.resourceId} className="hover:bg-slate-50">
                      <td className="p-4">
                        <p className="font-bold text-slate-900">{res.title}</p>
                        <p className="text-xs text-slate-500 line-clamp-1 max-w-xs">{res.description}</p>
                      </td>
                      <td className="p-4">
                        <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs font-medium">
                          {res.category}
                        </span>
                      </td>
                      <td className="p-4 font-medium text-slate-700">{res.subject}</td>
                      <td className="p-4">
                        <a href={res.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                          View File
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                        </a>
                      </td>
                      <td className="p-4 text-right">
                        <Button 
                          variant="ghost" 
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 px-3" 
                          onClick={() => res.resourceId && handleDelete(res.resourceId)}
                        >
                          Delete
                        </Button>
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
