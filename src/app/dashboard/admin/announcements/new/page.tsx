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
  const [meetingLink, setMeetingLink] = useState('');
  const [courses, setCourses] = useState<Course[]>([]);
  const [sendViaEmail, setSendViaEmail] = useState(true);
  const [sendViaWhatsApp, setSendViaWhatsApp] = useState(false);
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
      const annData: any = {
        title,
        message,
        targetAudience,
        scheduledFor: scheduledForObj,
        createdAt: serverTimestamp(),
      };
      if (meetingLink.trim()) {
        annData.meetingLink = meetingLink.trim();
      }

      const annRef = await addDoc(collection(db, 'announcements'), annData);

      // 2. Client-side fan-out generation of notifications
      // Only do immediate notifications if it's not scheduled for the future
      // If it's scheduled for the future, we rely on the student client checking for scheduled announcements that have become active (simplified approach since we lack a real backend cron).
      const isScheduledForFuture = scheduledForObj && scheduledForObj.toMillis() > Date.now();
      if (!isScheduledForFuture) {
        let userIdsToNotify: string[] = [];
        let usersToBroadcast: any[] = [];

        if (targetAudience === 'all') {
          // Fetch all students
          const usersSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'student')));
          usersSnap.forEach(u => {
            userIdsToNotify.push(u.id);
            usersToBroadcast.push({ id: u.id, email: u.data().email, phone: u.data().phone });
          });
        } else {
          // Fetch students enrolled in the specific course
          const enrollSnap = await getDocs(query(collection(db, 'enrollments'), where('courseId', '==', targetAudience)));
          enrollSnap.forEach(e => userIdsToNotify.push(e.data().studentId));
          
          // De-duplicate if needed
          userIdsToNotify = Array.from(new Set(userIdsToNotify));
          
          // Fetch user details for broadcast
          for (const uid of userIdsToNotify) {
            const uSnap = await getDocs(query(collection(db, 'users'), where('__name__', '==', uid)));
            if (!uSnap.empty) {
              const uData = uSnap.docs[0].data();
              usersToBroadcast.push({ id: uid, email: uData.email, phone: uData.phone });
            }
          }
        }

        // De-duplicate if needed
        userIdsToNotify = Array.from(new Set(userIdsToNotify));

        // Create notification for each user
        const notifPromises = userIdsToNotify.map(uid => 
          addDoc(collection(db, 'notifications'), {
            userId: uid,
            title: `New Announcement: ${title}`,
            message: meetingLink.trim() ? `${message}\n\nMeeting Link: ${meetingLink.trim()}` : message,
            read: false,
            createdAt: serverTimestamp(),
          })
        );
        await Promise.all(notifPromises);

        // Send Broadcast via Email/WhatsApp
        if (sendViaEmail || sendViaWhatsApp) {
          await fetch('/api/notify/broadcast', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title,
              message,
              users: usersToBroadcast,
              sendViaEmail,
              sendViaWhatsApp
            }),
          });
        }
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

            <div className="space-y-2 border-l-4 border-amber-500 pl-4 py-2 bg-amber-50/50 rounded-r-md">
              <Label htmlFor="meetingLink" className="text-amber-800 font-medium">Live Class Link (Optional)</Label>
              <Input 
                id="meetingLink" 
                placeholder="Paste Google Meet, Zoom, or YouTube Live link here..." 
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                className="bg-card text-card-foreground"
              />
              <p className="text-xs text-amber-700/80">If provided, a shiny "Join Live Class" button will appear for students.</p>
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
                <p className="text-xs text-muted-foreground">Leave blank to send immediately.</p>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t">
              <Label>Delivery Channels</Label>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={sendViaEmail} 
                    onChange={(e) => setSendViaEmail(e.target.checked)} 
                    className="w-4 h-4"
                  />
                  <span>Send via Email</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={sendViaWhatsApp} 
                    onChange={(e) => setSendViaWhatsApp(e.target.checked)} 
                    className="w-4 h-4"
                  />
                  <span>Send via WhatsApp</span>
                </label>
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
