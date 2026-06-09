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
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'My Learning': true,
    'Assessments': true,
    'Communication': false,
  });

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

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  const navGroups = [
    {
      label: 'Main',
      items: [
        { name: 'Dashboard', href: '/dashboard/student', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
      ]
    },
    {
      label: 'My Learning',
      items: [
        { name: 'My Courses', href: '/dashboard/student/courses', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
        { name: 'Study Materials', href: '/dashboard/student/resources', icon: 'M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z' },
        { name: 'Video Lessons', href: '/dashboard/student/video-lessons', icon: 'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
      ]
    },
    {
      label: 'Assessments',
      items: [
        { name: 'Assignments', href: '/dashboard/student/assignments', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
        { name: 'Tests', href: '/dashboard/student/tests', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
        { name: 'Results', href: '/dashboard/student/results', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
      ]
    },
    {
      label: 'Communication',
      items: [
        { name: 'Announcements', href: '/dashboard/student/announcements', icon: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z' },
        { name: 'Feedback Forum', href: '/dashboard/student/feedback', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
        { name: 'Reviews', href: '/dashboard/student/reviews', icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' },
      ]
    },
    {
      label: 'Profile',
      items: [
        { name: 'Profile', href: '/dashboard/student/profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
      ]
    }
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
      <aside className={`fixed inset-y-0 left-0 bg-slate-900 w-64 text-slate-300 transition-transform z-50 flex flex-col md:translate-x-0 md:static ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex items-center justify-between">
          <Link href="/dashboard/student" className="text-xl font-bold text-white tracking-tight">
            Ravi<span className="text-amber-500">Classes</span>
          </Link>
          <button className="md:hidden text-slate-300 hover:text-white p-1 rounded-md hover:bg-slate-800" onClick={() => setIsMobileOpen(false)}>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 space-y-4 pb-4 mt-2 custom-scrollbar">
          {navGroups.map((group) => {
            const isCollapsible = group.label !== 'Main' && group.label !== 'Profile';
            const isExpanded = isCollapsible ? expandedGroups[group.label] : true;

            return (
              <div key={group.label} className="space-y-1">
                {isCollapsible && (
                  <button
                    onClick={() => toggleGroup(group.label)}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider hover:text-slate-300 transition-colors"
                  >
                    {group.label}
                    <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                )}
                
                {isExpanded && (
                  <nav className="space-y-1">
                    {group.items.map((item) => {
                      const isActive = pathname === item.href;
                      return (
                        <Link 
                          key={item.name}
                          href={item.href}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-sm font-medium ${isActive ? 'bg-amber-600 text-white shadow-sm' : 'hover:bg-slate-800 hover:text-slate-100'}`}
                          onClick={() => setIsMobileOpen(false)}
                        >
                          <svg className={`w-5 h-5 shrink-0 ${isActive ? 'text-amber-100' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                          </svg>
                          {item.name}
                        </Link>
                      )
                    })}
                  </nav>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-auto w-full p-4 border-t border-slate-800 bg-slate-900 shrink-0">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold shrink-0">
              {appUser.name?.charAt(0).toUpperCase() || 'S'}
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
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50">
        {/* Top Header */}
        <header className="bg-white border-b h-16 flex items-center justify-between px-4 md:px-8 shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsMobileOpen(true)} className="md:hidden text-slate-600 focus:outline-none p-2 rounded-md hover:bg-slate-100">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="font-bold text-slate-900 md:hidden">Student Dashboard</div>
            <div className="hidden md:block font-medium text-slate-500">Welcome back, {appUser.name?.split(' ')[0] || 'Student'}</div>
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

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #334155;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #475569;
        }
      `}</style>
    </div>
  );
}
