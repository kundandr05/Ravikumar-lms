'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase/firebase';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AppNotification } from '@/types';

export default function StudentNotificationsPage() {
  const { appUser } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!appUser?.uid) return;

    // Use onSnapshot for real-time updates
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', appUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: AppNotification[] = [];
      snapshot.forEach(d => {
        data.push({ notificationId: d.id, ...d.data() } as AppNotification);
      });
      setNotifications(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching notifications", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [appUser]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: true
      });
    } catch (error) {
      console.error("Error marking as read", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      if (unreadNotifications.length === 0) return;

      const batch = writeBatch(db);
      unreadNotifications.forEach(n => {
        if (n.notificationId) {
          const ref = doc(db, 'notifications', n.notificationId);
          batch.update(ref, { read: true });
        }
      });
      await batch.commit();
    } catch (error) {
      console.error("Error marking all as read", error);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading notifications...</div>;
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Notifications</h1>
          <p className="text-slate-500 mt-2">Stay updated with the latest announcements.</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={handleMarkAllAsRead}>
            Mark all as read
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Notifications</CardTitle>
          <CardDescription>
            You have {unreadCount} unread message{unreadCount !== 1 ? 's' : ''}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg bg-slate-50 text-slate-500">
              <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
              You're all caught up! No notifications yet.
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map(notif => (
                <div 
                  key={notif.notificationId} 
                  className={`p-5 rounded-lg border transition-all ${
                    notif.read 
                      ? 'bg-slate-50 border-slate-200' 
                      : 'bg-white border-amber-200 shadow-sm ring-1 ring-amber-500/20'
                  }`}
                >
                  <div className="flex gap-4">
                    <div className="shrink-0 mt-1">
                      {notif.read ? (
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                          <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h3 className={`font-bold ${notif.read ? 'text-slate-700' : 'text-slate-900'}`}>
                          {notif.title}
                        </h3>
                        <span className="text-xs text-slate-400 whitespace-nowrap ml-4">
                          {notif.createdAt?.toDate ? notif.createdAt.toDate().toLocaleString() : ''}
                        </span>
                      </div>
                      <p className={`mt-2 text-sm leading-relaxed ${notif.read ? 'text-slate-500' : 'text-slate-700'}`}>
                        {notif.message}
                      </p>
                      
                      {!notif.read && (
                        <div className="mt-4">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-amber-700 hover:text-amber-800 hover:bg-amber-50 -ml-3 h-8"
                            onClick={() => notif.notificationId && handleMarkAsRead(notif.notificationId)}
                          >
                            Mark as read
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
