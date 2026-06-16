'use client';

import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function MakeMeAdminPage() {
  const { appUser, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('Ravi Sir');

  const handleMakeAdmin = async () => {
    if (!user) {
      alert("Error: You are not logged in! Please log in first.");
      return;
    }
    
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        role: 'admin',
        name: name
      });
      alert("Success! Your name is updated and you are now an Admin! Redirecting...");
      window.location.href = '/dashboard/admin';
    } catch (error: any) {
      console.error(error);
      alert("Firebase Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <div className="max-w-md w-full bg-card p-8 rounded-xl border shadow-sm space-y-6 text-center">
        <h1 className="text-2xl font-bold">Admin Promotion Tool</h1>
        
        {user ? (
          <div className="space-y-4 text-left">
            <p className="text-muted-foreground text-sm text-center">
              Logged in as: <strong className="text-foreground">{user.email}</strong>
            </p>
            
            <div className="space-y-2">
              <Label>Enter your real name to replace "Recovered User"</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <Button 
              onClick={handleMakeAdmin} 
              disabled={loading} 
              className="w-full bg-amber-500 hover:bg-amber-600 text-white"
            >
              {loading ? 'Processing...' : 'Make Me Admin & Update Name'}
            </Button>
          </div>
        ) : (
          <p className="text-red-500 font-bold">You are not logged in. Please go back to the login page and log in first.</p>
        )}
      </div>
    </div>
  );
}
