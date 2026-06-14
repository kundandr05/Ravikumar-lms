'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function CompleteProfilePage() {
  const { user, appUser, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Protect the route
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    if (phone.length < 10) {
      setError('Please enter a valid phone number.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        phone: phone,
      });

      // Fetch the updated user doc to know where to route them
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const role = userDoc.data().role || 'student';
        // Force hard refresh to update context or just push
        window.location.href = `/dashboard/${role}`;
      } else {
        window.location.href = '/dashboard/student';
      }
    } catch (err: any) {
      console.error(err);
      setError('Failed to update profile. Please try again.');
      setLoading(false);
    }
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-md border-indigo-500/30 bg-indigo-500/5 shadow-2xl">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-3xl font-black">Almost There!</CardTitle>
          <CardDescription className="text-base">
            For security and communication purposes, we require a valid phone number before you can access the platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6 mt-4">
            <div className="space-y-2">
              <Label htmlFor="phone" className="font-bold">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="e.g., +91 9876543210"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="text-lg py-6"
              />
            </div>
            
            {error && <p className="text-sm text-red-500 font-semibold">{error}</p>}
            
            <Button type="submit" className="w-full text-lg py-6 bg-indigo-600 hover:bg-indigo-700" disabled={loading}>
              {loading ? 'Saving...' : 'Complete Registration'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
