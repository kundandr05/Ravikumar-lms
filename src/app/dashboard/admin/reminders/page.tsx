'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Course } from '@/types';

export default function AdminRemindersPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [targetCourse, setTargetCourse] = useState<string>('all');
  const [reminderType, setReminderType] = useState<string>('fee');
  const [message, setMessage] = useState('');
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

  const handleSendReminders = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let usersToRemind: any[] = [];

      if (targetCourse === 'all') {
        const usersSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'student')));
        usersSnap.forEach(u => {
          usersToRemind.push({ id: u.id, email: u.data().email, phone: u.data().phone });
        });
      } else {
        const enrollSnap = await getDocs(query(collection(db, 'enrollments'), where('courseId', '==', targetCourse)));
        const enrolledUserIds: string[] = [];
        enrollSnap.forEach(e => enrolledUserIds.push(e.data().studentId));
        
        const uniqueIds = Array.from(new Set(enrolledUserIds));
        
        for (const uid of uniqueIds) {
          const uSnap = await getDocs(query(collection(db, 'users'), where('__name__', '==', uid)));
          if (!uSnap.empty) {
            const uData = uSnap.docs[0].data();
            usersToRemind.push({ id: uid, email: uData.email, phone: uData.phone });
          }
        }
      }

      if (usersToRemind.length === 0) {
        alert("No students found to send reminders to.");
        setLoading(false);
        return;
      }

      if (sendViaEmail || sendViaWhatsApp) {
        const response = await fetch('/api/notify/reminders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: reminderType,
            message,
            users: usersToRemind,
            sendViaEmail,
            sendViaWhatsApp
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to trigger reminders API');
        }
      }

      alert("Reminders triggered successfully!");
      setMessage('');
    } catch (error) {
      console.error("Error sending reminders:", error);
      alert("Failed to send reminders.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Communication & Reminders</h1>
        <p className="text-slate-500 mt-2">Send automated reminders for fees, tests, and assignments.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Send Reminders</CardTitle>
          <CardDescription>Select the type of reminder and the target audience.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSendReminders} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Reminder Type</Label>
                <Select value={reminderType} onValueChange={(val) => setReminderType(val as string)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fee">Fee Reminder</SelectItem>
                    <SelectItem value="test">Test Reminder</SelectItem>
                    <SelectItem value="assignment">Assignment Reminder</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Target Audience</Label>
                <Select value={targetCourse} onValueChange={(val) => setTargetCourse(val as string)}>
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Custom Message / Details</Label>
              <Textarea 
                id="message" 
                placeholder="Enter additional details for the reminder..." 
                required 
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            <div className="space-y-3 pt-4 border-t">
              <Label>Delivery Channels</Label>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={sendViaEmail} 
                    onChange={(e) => setSendViaEmail(e.target.checked)} 
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span>Email</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={sendViaWhatsApp} 
                    onChange={(e) => setSendViaWhatsApp(e.target.checked)} 
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span>WhatsApp</span>
                </label>
              </div>
            </div>

            <Button type="submit" className="w-full md:w-auto mt-6" disabled={loading}>
              {loading ? 'Processing...' : 'Send Reminders'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
