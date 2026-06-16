'use client';

import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function MakeMeAdminPage() {
  const { appUser, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleMakeAdmin = async () => {
    if (!user || !appUser) {
      alert("Please log in first!");
      return;
    }
    
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        role: 'admin'
      });
      alert("Success! You are now an Admin. Redirecting to Admin Dashboard...");
      
      // Force reload to update the context state
      window.location.href = '/dashboard/admin';
    } catch (error: any) {
      console.error(error);
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-card p-8 rounded-xl border shadow-sm space-y-6 text-center">
        <h1 className="text-2xl font-bold">Admin Promotion Tool</h1>
        <p className="text-muted-foreground">
          Currently logged in as: <strong className="text-foreground">{user?.email || "Not logged in"}</strong>
          <br/>
          Current Role: <strong className="text-primary">{appUser?.role || "None"}</strong>
        </p>
        
        <Button 
          onClick={handleMakeAdmin} 
          disabled={loading || !user} 
          className="w-full bg-amber-500 hover:bg-amber-600 text-white"
        >
          {loading ? 'Promoting...' : 'Make Me Admin'}
        </Button>
      </div>
    </div>
  );
}
