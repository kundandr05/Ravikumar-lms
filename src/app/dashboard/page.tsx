'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function DashboardRouter() {
  const { appUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!appUser) {
        router.push('/login');
      } else if (appUser.status === 'pending') {
        router.push('/dashboard/pending');
      } else if (appUser.status === 'rejected') {
        // Handle rejected (maybe redirect to a rejected page or sign out)
        router.push('/login'); 
      } else {
        router.push(`/dashboard/${appUser.role}`);
      }
    }
  }, [appUser, loading, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      Loading your dashboard...
    </div>
  );
}
