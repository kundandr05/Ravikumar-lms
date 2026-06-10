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

  const handleWipeTestData = async () => {
    if (!confirm("Are you sure you want to delete ALL student test attempts? This action is irreversible and should only be done before launching the website to real students.")) return;
    
    setWiping(true);
    try {
      const attemptsSnap = await getDocs(collection(db, 'testAttempts'));
      const deletePromises = attemptsSnap.docs.map(d => deleteDoc(doc(db, 'testAttempts', d.id)));
      await Promise.all(deletePromises);
      alert(`Successfully deleted ${deletePromises.length} dummy test attempts. All test average scores are now reset to 0!`);
    } catch (error) {
      console.error("Error wiping test data:", error);
      alert("Failed to wipe test data.");
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
          <CardContent className="space-y-4 pt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border border-red-100 rounded-lg">
              <div>
                <h4 className="font-bold text-slate-900">Wipe Dummy Test Data</h4>
                <p className="text-sm text-slate-500 max-w-xl mt-1">
                  This will permanently delete all existing student test attempts, resetting the average scores to 0 across all courses. Only do this if you are clearing dummy data.
                </p>
              </div>
              <Button variant="destructive" onClick={handleWipeTestData} disabled={wiping} className="shrink-0">
                {wiping ? 'Wiping...' : 'Clear All Test Attempts'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
