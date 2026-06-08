'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/firebase';
import { collection, addDoc, serverTimestamp, query, getDocs, where, Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter } from 'next/navigation';
import { Course } from '@/types';

export default function NewAnnouncementPage() {
  const router = useRouter();
  
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetAudience, setTargetAudience] = useState<string>('all');
  const [scheduledForStr, setScheduledForStr] = useState('');
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchCourses() {
      try {
        const snap = await getDocs(collection(db, 'courses'));
        const data: Course[] = [];
        snap.forEach(d => {
          data.push({ courseId: d.id, ...d.data() } as Course);
        });
        setCourses(data);
      } catch (error) {
        console.error("Error fetching courses", error);
      }
    }
    fetchCourses();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let scheduledForObj: any = null;
      if (scheduledForStr) {
        scheduledForObj = Timestamp.fromDate(new Date(scheduledForStr));
      }

      // 1. Save Announcement
      const annRef = await addDoc(collection(db, 'announcements'), {
        title,
        message,
        targetAudience,
        scheduledFor: scheduledForObj,
        createdAt: serverTimestamp(),
      });

      // 2. Client-side fan-out generation of notifications
      // Only do immediate notifications if it's not scheduled for the future
      // If it's scheduled for the future, we rely on the student client checking for scheduled announcements that have become active (simplified approach since we lack a real backend cron).
      const isScheduledForFuture = scheduledForObj && scheduledForObj.toMillis() > Date.now();

      if (!isScheduledForFuture) {
        let userIdsToNotify: string[] = [];

        if (targetAudience === 'all') {
          // Fetch all students
          const usersSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'student')));
          usersSnap.forEach(u => userIdsToNotify.push(u.id));
        } else {
          // Fetch students enrolled in the specific course
          const enrollSnap = await getDocs(query(collection(db, 'enrollments'), where('courseId', '==', targetAudience)));
          enrollSnap.forEach(e => userIdsToNotify.push(e.data().studentId));
        }

        // De-duplicate if needed
        userIdsToNotify = Array.from(new Set(userIdsToNotify));

        // Create notification for each user
        // Note: For a massive scale (10,000+ users), this loop would be heavy and should be a Firebase Function.
        const notifPromises = userIdsToNotify.map(uid => 
          addDoc(collection(db, 'notifications'), {
            userId: uid,
            title: `New Announcement: ${title}`,
            message,
            read: false,
            createdAt: serverTimestamp(),
          })
        );
        await Promise.all(notifPromises);
      }

      alert("Announcement created successfully!");
      router.push('/dashboard/admin/announcements');
    } catch (error) {
      console.error("Error creating announcement", error);
      alert("Failed to create announcement.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => router.push('/dashboard/admin/announcements')}>Back</Button>
        <h1 className="text-3xl font-bold">New Announcement</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Announcement Details</CardTitle>
          <CardDescription>Compose your message and select who should receive it.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input 
                id="title" 
                placeholder="e.g. Mid-term Exam Schedule Update" 
                required 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea 
                id="message" 
                placeholder="Write your announcement here..." 
                required 
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Target Audience</Label>
                <Select value={targetAudience} onValueChange={(val) => setTargetAudience(val as string)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select target audience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Students</SelectItem>
                    {courses.map(c => (
                      <SelectItem key={c.courseId} value={c.courseId!}>
                        Course: {c.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="scheduledFor">Schedule For (Optional)</Label>
                <Input 
                  id="scheduledFor" 
                  type="datetime-local" 
                  value={scheduledForStr}
                  onChange={(e) => setScheduledForStr(e.target.value)}
                />
                <p className="text-xs text-slate-500">Leave blank to send immediately.</p>
              </div>
            </div>

            <Button type="submit" className="w-full mt-6" disabled={loading}>
              {loading ? 'Sending...' : 'Post Announcement'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
