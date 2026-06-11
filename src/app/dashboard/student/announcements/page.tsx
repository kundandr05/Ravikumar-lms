'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Announcement } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

export default function StudentAnnouncementsPage() {
  const { appUser } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (appUser?.uid) {
      fetchAnnouncements();
    }
  }, [appUser]);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      // 1. Get enrolled courses
      const enrollQuery = query(collection(db, 'enrollments'), where('studentId', '==', appUser!.uid));
      const enrollSnap = await getDocs(enrollQuery);
      const enrolledCourseIds = new Set<string>();
      enrollSnap.forEach(doc => enrolledCourseIds.add(doc.data().courseId));

      // 2. Fetch all announcements (since Firestore 'in' queries are limited to 10 elements, we'll fetch all and filter, or fetch 'all' and individual courses)
      // Since announcements are global, fetching all and filtering is fine for a small LMS.
      const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      
      const data: Announcement[] = [];
      const now = Date.now();

      snap.forEach(d => {
        const ann = { announcementId: d.id, ...d.data() } as Announcement;
        
        // Filter by target audience
        const isTargeted = ann.targetAudience === 'all' || enrolledCourseIds.has(ann.targetAudience);
        
        // Filter by scheduled time (only show if scheduled for past or present)
        const isActive = !ann.scheduledFor || (ann.scheduledFor.toMillis() <= now);

        if (isTargeted && isActive) {
          data.push(ann);
        }
      });
      
      setAnnouncements(data);
    } catch (error) {
      console.error("Error fetching announcements", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Announcements</h1>
        <p className="text-muted-foreground mt-2">Important updates and live class links from your instructor.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Messages</CardTitle>
          <CardDescription>Stay up to date with your courses.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-muted-foreground flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mb-4"></div>
              Loading announcements...
            </div>
          ) : announcements.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed rounded-lg bg-muted/50 text-muted-foreground flex flex-col items-center">
              <svg className="w-12 h-12 text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
              <p className="text-lg font-medium text-foreground">No announcements yet</p>
              <p className="text-sm mt-1">Check back later for updates from your instructor.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {announcements.map((ann) => (
                <div key={ann.announcementId} className="p-5 rounded-xl border border-slate-200 bg-card text-card-foreground hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-xl text-foreground">{ann.title}</h3>
                    <span className="text-xs font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-full whitespace-nowrap">
                      {ann.createdAt?.toDate ? ann.createdAt.toDate().toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                    </span>
                  </div>
                  
                  <div className="text-muted-foreground whitespace-pre-line text-sm leading-relaxed mb-4">
                    {ann.message}
                  </div>

                  {ann.meetingLink && (
                    <div className="pt-3 border-t border-slate-100">
                      <a 
                        href={ann.meetingLink} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 hover:border-amber-300 font-semibold rounded-lg transition-colors shadow-sm group"
                      >
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                        </span>
                        Join Live Class Now
                        <svg className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
