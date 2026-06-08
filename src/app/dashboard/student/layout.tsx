'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { NotificationBell } from '@/components/NotificationBell';

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const { appUser, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading && (!appUser || appUser.role !== 'student')) {
      router.push('/login');
    }
  }, [appUser, loading, router]);

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading Student Dashboard...</div>;
  }

  if (!appUser || appUser.role !== 'student') {
    return null; // Will redirect in useEffect
  }

  const navItems = [
    { name: 'Dashboard', href: '/dashboard/student', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { name: 'My Courses', href: '/dashboard/student/courses', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
    { name: 'My Results', href: '/dashboard/student/results', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { name: 'Study Materials', href: '/dashboard/student/resources', icon: 'M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z' },
    { name: 'Profile', href: '/dashboard/student/profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 bg-slate-900 w-64 text-slate-300 transition-transform z-50 md:translate-x-0 md:static ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex items-center justify-between">
          <Link href="/dashboard/student" className="text-xl font-bold text-white tracking-tight">
            Ravi<span className="text-amber-500">Classes</span>
          </Link>
          <button className="md:hidden text-slate-300 hover:text-white" onClick={() => setIsMobileOpen(false)}>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <nav className="mt-6 px-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${isActive ? 'bg-amber-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}
                onClick={() => setIsMobileOpen(false)}
              >
                <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
                {item.name}
              </Link>
            )
          })}
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold">
              {appUser.name?.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-white truncate">{appUser.name}</p>
              <p className="text-xs text-slate-500 truncate">Student</p>
            </div>
          </div>
          <Button variant="outline" className="w-full bg-transparent text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white" onClick={logout}>
            Log Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b h-16 flex items-center justify-between px-4 md:px-8 shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsMobileOpen(true)} className="md:hidden text-slate-600 focus:outline-none">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="font-bold text-slate-900 md:hidden">Student Dashboard</div>
            <div className="hidden md:block font-medium text-slate-500">Welcome back, {appUser.name?.split(' ')[0]}</div>
          </div>
          <div className="flex items-center">
            <NotificationBell />
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
