'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function ParentDashboard() {
  const { appUser, logout } = useAuth();

  if (appUser?.role !== 'parent') {
    return <div className="p-8 text-center text-red-500">Access Denied</div>;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Parent Dashboard</h1>
        <Button onClick={logout} variant="outline">Log Out</Button>
      </div>
      
      <p>Welcome, {appUser.name}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Linked Students</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600">Track your child's progress here.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
