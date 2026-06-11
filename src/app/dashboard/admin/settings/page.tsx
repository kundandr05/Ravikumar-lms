'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function AdminSettingsPage() {
  const { appUser } = useAuth();
  const [supportEmail, setSupportEmail] = useState(appUser?.email || 'kundandr05@gmail.com');
  const [platformName, setPlatformName] = useState('RaviClasses LMS');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate saving to a global settings document
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Platform Settings</h1>
        <p className="text-muted-foreground mt-1">Configure global settings for your Learning Management System.</p>
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
                <p className="text-xs text-muted-foreground">This is where student support messages from the Student Portal will be sent.</p>
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
              <div className="p-4 bg-muted/50 rounded-lg border">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Admin Name</Label>
                <div className="font-medium text-foreground text-lg">{appUser?.name}</div>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg border">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Admin Email</Label>
                <div className="font-medium text-foreground text-lg">{appUser?.email}</div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              To change your primary login email or password, please use the Firebase Authentication console.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
