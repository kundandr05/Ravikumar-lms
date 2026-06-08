'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase/firebase';
import { collection, query, orderBy, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Announcement } from '@/types';
import Link from 'next/link';

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const data: Announcement[] = [];
      snap.forEach(d => {
        data.push({ announcementId: d.id, ...d.data() } as Announcement);
      });
      setAnnouncements(data);
    } catch (error) {
      console.error("Error fetching announcements", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this announcement? Notifications already sent to students will NOT be recalled.")) return;
    try {
      await deleteDoc(doc(db, 'announcements', id));
      setAnnouncements(prev => prev.filter(a => a.announcementId !== id));
    } catch (error) {
      console.error("Error deleting announcement", error);
      alert("Failed to delete.");
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Announcements</h1>
          <p className="text-slate-500 mt-2">Broadcast messages to students across the platform.</p>
        </div>
        <Link href="/dashboard/admin/announcements/new" className={buttonVariants()}>
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          New Announcement
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Announcements</CardTitle>
          <CardDescription>History of all announcements sent.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-slate-500">Loading...</div>
          ) : announcements.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg bg-slate-50 text-slate-500">
              No announcements found. Create your first one to notify students!
            </div>
          ) : (
            <div className="space-y-4">
              {announcements.map((ann) => (
                <div key={ann.announcementId} className="p-4 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors bg-white">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h3 className="font-bold text-lg text-slate-900">{ann.title}</h3>
                      <p className="text-sm text-slate-500 mt-1 line-clamp-2">{ann.message}</p>
                      <div className="flex gap-4 mt-3 text-xs font-medium">
                        <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded">
                          Target: {ann.targetAudience === 'all' ? 'All Students' : `Course: ${ann.targetAudience}`}
                        </span>
                        <span className="text-slate-400 flex items-center">
                          <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          {ann.createdAt?.toDate ? ann.createdAt.toDate().toLocaleString() : 'Unknown Date'}
                        </span>
                        {ann.scheduledFor && (
                          <span className="text-amber-600 bg-amber-50 px-2 py-1 rounded flex items-center">
                            Scheduled: {ann.scheduledFor?.toDate ? ann.scheduledFor.toDate().toLocaleString() : ''}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50 shrink-0" onClick={() => ann.announcementId && handleDelete(ann.announcementId)}>
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
