'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase/firebase';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function AdminSettingsPage() {
  const { appUser } = useAuth();
  const [supportEmail, setSupportEmail] = useState(appUser?.email || 'kundandr05@gmail.com');
  const [platformName, setPlatformName] = useState('RaviClasses LMS');
  const [saved, setSaved] = useState(false);
  const [wiping, setWiping] = useState(false);
  const [wipeStatus, setWipeStatus] = useState<string>('');

  const handleFactoryReset = async (type: 'student_activity' | 'students' | 'everything') => {
    let msg = "";
    if (type === 'student_activity') msg = "delete all enrollments, test attempts, and feedback? Your courses and student accounts will remain.";
    if (type === 'students') msg = "delete all Student accounts? Admins will remain.";
    if (type === 'everything') msg = "delete EVERYTHING including courses, lessons, tests, students, and enrollments? The website will be 100% blank.";
    
    if (!confirm(`Are you sure you want to ${msg}\n\nTHIS ACTION IS IRREVERSIBLE!`)) return;
    
    setWiping(true);
    setWipeStatus('Preparing to wipe...');
    try {
      const deleteCollection = async (colName: string) => {
        setWipeStatus(`Deleting ${colName}...`);
        const snap = await getDocs(collection(db, colName));
        const promises = snap.docs.map(d => deleteDoc(doc(db, colName, d.id)));
        await Promise.all(promises);
      };

      if (type === 'student_activity' || type === 'everything') {
        await deleteCollection('testAttempts');
        await deleteCollection('enrollments');
        await deleteCollection('feedback');
      }

      if (type === 'students' || type === 'everything') {
        setWipeStatus(`Deleting student accounts...`);
        // Cannot easily query/delete auth users from client, but we can delete their Firestore records.
        const snap = await getDocs(collection(db, 'users'));
        const promises = snap.docs
          .filter(d => d.data().role !== 'admin')
          .map(d => deleteDoc(doc(db, 'users', d.id)));
        await Promise.all(promises);
      }

      if (type === 'everything') {
        await deleteCollection('courses');
        await deleteCollection('lessons');
        await deleteCollection('tests');
        await deleteCollection('questions');
        await deleteCollection('announcements');
      }

      setWipeStatus('');
      alert(`Success! The requested data has been completely wiped from the database.`);
    } catch (error) {
      console.error("Error wiping data:", error);
      alert("Failed to wipe some data. Please check the console.");
      setWipeStatus('');
    } finally {
      setWiping(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate saving to a global settings document
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Platform Settings</h1>
        <p className="text-slate-500 mt-1">Configure global settings for your Learning Management System.</p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
            <CardDescription>Update the basic information of your platform.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-6">
              <div className="space-y-2 max-w-md">
                <Label htmlFor="platformName">Platform Name</Label>
                <Input 
                  id="platformName" 
                  value={platformName}
                  onChange={(e) => setPlatformName(e.target.value)}
                />
              </div>

              <div className="space-y-2 max-w-md">
                <Label htmlFor="supportEmail">Support Email Address</Label>
                <Input 
                  id="supportEmail" 
                  type="email"
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                />
                <p className="text-xs text-slate-500">This is where student support messages from the Student Portal will be sent.</p>
              </div>

              <Button type="submit" className="min-w-[120px]">
                {saved ? 'Saved!' : 'Save Changes'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Admin Account Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-lg border">
                <Label className="text-xs text-slate-500 uppercase tracking-wider">Admin Name</Label>
                <div className="font-medium text-slate-900 text-lg">{appUser?.name}</div>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg border">
                <Label className="text-xs text-slate-500 uppercase tracking-wider">Admin Email</Label>
                <div className="font-medium text-slate-900 text-lg">{appUser?.email}</div>
              </div>
            </div>
            <p className="text-sm text-slate-500 mt-4">
              To change your primary login email or password, please use the Firebase Authentication console.
            </p>
          </CardContent>
        </Card>

        <Card className="border-red-200 shadow-sm">
          <CardHeader className="bg-red-50 rounded-t-lg">
            <CardTitle className="text-red-700">Pre-Launch Actions (Danger Zone)</CardTitle>
            <CardDescription className="text-red-600/80">
              Use these tools to clean up the database before handing the website over to real students.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            
            {wipeStatus && (
              <div className="bg-amber-50 text-amber-800 p-3 rounded-md font-medium animate-pulse border border-amber-200">
                {wipeStatus}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border border-red-100 rounded-lg">
              <div>
                <h4 className="font-bold text-slate-900">1. Clear Student Activity</h4>
                <p className="text-sm text-slate-500 max-w-xl mt-1">
                  Deletes all <b>Enrollments</b>, <b>Test Attempts</b>, and <b>Feedback</b>. Students will still exist, and Courses will remain untouched. Use this to reset progress back to 0.
                </p>
              </div>
              <Button variant="outline" className="border-red-200 text-red-700 hover:bg-red-50" onClick={() => handleFactoryReset('student_activity')} disabled={wiping} className="shrink-0">
                Wipe Activity
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border border-red-100 rounded-lg">
              <div>
                <h4 className="font-bold text-slate-900">2. Delete All Student Accounts</h4>
                <p className="text-sm text-slate-500 max-w-xl mt-1">
                  Deletes all Student users from the database. Admin accounts will remain intact.
                </p>
              </div>
              <Button variant="outline" className="border-red-200 text-red-700 hover:bg-red-50" onClick={() => handleFactoryReset('students')} disabled={wiping} className="shrink-0">
                Wipe Students
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border border-red-500 bg-red-50 rounded-lg">
              <div>
                <h4 className="font-bold text-red-900">3. FULL FACTORY RESET (Delete Everything)</h4>
                <p className="text-sm text-red-700 max-w-xl mt-1">
                  Deletes <b>EVERYTHING</b>: Courses, Lessons, Tests, Announcements, Students, Enrollments, and Progress. The website will be a completely blank slate.
                </p>
              </div>
              <Button variant="destructive" onClick={() => handleFactoryReset('everything')} disabled={wiping} className="shrink-0 bg-red-600 hover:bg-red-700">
                Wipe EVERYTHING
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
