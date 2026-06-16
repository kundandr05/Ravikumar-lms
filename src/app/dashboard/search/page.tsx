'use client';

import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Suspense } from 'react';

function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';

  return (
    <div className="max-w-4xl mx-auto space-y-6 pt-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Search Results</h1>
        <p className="text-muted-foreground mt-2">
          Showing results for: <span className="font-semibold text-foreground">"{query}"</span>
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-12 text-center text-muted-foreground">
            <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="text-lg font-medium">Search functionality is being indexed.</p>
            <p className="text-sm mt-2">Full database search across courses, tests, and users will be available shortly!</p>
          </div>
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
