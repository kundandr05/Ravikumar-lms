'use client';

import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Suspense, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase/firebase';
import { collection, getDocs, query } from 'firebase/firestore';
import Link from 'next/link';

interface SearchResultItem {
  id: string;
  type: 'course' | 'lesson' | 'test' | 'user';
  title: string;
  subtitle: string;
  href: string;
}

function SearchResults() {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('q') || '';
  const { appUser } = useAuth();
  
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function performSearch() {
      if (!searchQuery.trim() || !appUser) return;
      
      setLoading(true);
      try {
        const q = searchQuery.toLowerCase();
        const isAdmin = appUser.role === 'admin';
        
        const promises = [
          getDocs(collection(db, 'courses')),
          getDocs(collection(db, 'lessons')),
          getDocs(collection(db, 'tests')),
        ];
        
        if (isAdmin) {
          promises.push(getDocs(collection(db, 'users')));
        }
        
        const snaps = await Promise.all(promises);
        const [courseSnap, lessonSnap, testSnap, userSnap] = snaps;
        
        const items: SearchResultItem[] = [];
        
        // Courses
        courseSnap.forEach(d => {
          const data = d.data();
          if (data.title?.toLowerCase().includes(q) || data.description?.toLowerCase().includes(q)) {
            items.push({
              id: d.id,
              type: 'course',
              title: data.title,
              subtitle: 'Course',
              href: isAdmin ? `/dashboard/admin/courses/${d.id}` : `/dashboard/student/courses/${d.id}`
            });
          }
        });

        // Lessons
        lessonSnap.forEach(d => {
          const data = d.data();
          if (data.title?.toLowerCase().includes(q)) {
            items.push({
              id: d.id,
              type: 'lesson',
              title: data.title,
              subtitle: 'Lesson',
              href: isAdmin ? `/dashboard/admin/courses/${data.courseId}` : `/dashboard/student/courses/${data.courseId}/lessons/${d.id}`
            });
          }
        });

        // Tests
        testSnap.forEach(d => {
          const data = d.data();
          if (data.title?.toLowerCase().includes(q) || data.description?.toLowerCase().includes(q)) {
            items.push({
              id: d.id,
              type: 'test',
              title: data.title,
              subtitle: 'Test',
              href: isAdmin ? `/dashboard/admin/courses/${data.courseId}/tests/${d.id}` : `/dashboard/student/tests`
            });
          }
        });

        // Users
        if (userSnap) {
          userSnap.forEach(d => {
            const data = d.data();
            if (data.name?.toLowerCase().includes(q) || data.email?.toLowerCase().includes(q)) {
              items.push({
                id: d.id,
                type: 'user',
                title: data.name || data.email,
                subtitle: `User (${data.role})`,
                href: `/dashboard/admin/students/${d.id}`
              });
            }
          });
        }

        setResults(items);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setLoading(false);
      }
    }

    performSearch();
  }, [searchQuery, appUser]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pt-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Search Results</h1>
        <p className="text-muted-foreground mt-2">
          Showing results for: <span className="font-semibold text-foreground">"{searchQuery}"</span>
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Results</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 text-center text-muted-foreground">Searching...</div>
          ) : results.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p className="text-lg font-medium">No results found.</p>
              <p className="text-sm mt-2">Try adjusting your search terms.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {results.map(item => (
                <Link 
                  key={`${item.type}-${item.id}`} 
                  href={item.href}
                  className="block p-4 border rounded-lg hover:border-amber-500 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-foreground text-lg">{item.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider
                          ${item.type === 'course' ? 'bg-blue-100 text-blue-700' : ''}
                          ${item.type === 'lesson' ? 'bg-amber-100 text-amber-700' : ''}
                          ${item.type === 'test' ? 'bg-purple-100 text-purple-700' : ''}
                          ${item.type === 'user' ? 'bg-emerald-100 text-emerald-700' : ''}
                        `}>
                          {item.subtitle}
                        </span>
                      </p>
                    </div>
                    <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading search...</div>}>
      <SearchResults />
    </Suspense>
  );
}
