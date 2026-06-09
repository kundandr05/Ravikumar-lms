'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Review } from '@/types';

export function TestimonialsCarousel() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchApprovedReviews() {
      try {
        const q = query(collection(db, 'reviews'), where('status', '==', 'approved'));
        const snapshot = await getDocs(q);
        const fetched: Review[] = [];
        snapshot.forEach((doc) => {
          fetched.push({ id: doc.id, ...doc.data() } as Review);
        });
        // Sort newest first
        fetched.sort((a, b) => {
          const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
          const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
          return timeB - timeA;
        });
        setReviews(fetched);
      } catch (error) {
        console.error("Error fetching testimonials:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchApprovedReviews();
  }, []);

  if (loading || reviews.length === 0) {
    return null; // Don't show the section if it's loading or empty to prevent layout shift
  }

  return (
    <section className="bg-white py-20 border-t">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Student Success Stories</h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">Hear directly from the students who achieved top ranks under Ravikumar's guidance.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {reviews.slice(0, 6).map((review) => (
            <Card key={review.id} className="hover:shadow-lg transition-shadow border border-slate-100">
              <CardContent className="p-6 flex flex-col h-full">
                <div className="flex gap-1 text-amber-500 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className={`w-5 h-5 ${i < (review.rating || 5) ? 'text-amber-500' : 'text-slate-200'}`} fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <h4 className="font-bold text-lg text-slate-900 mb-2">{review.title}</h4>
                <p className="text-slate-600 mb-6 flex-grow italic">"{review.message || (review as any).review}"</p>
                <div className="flex items-center gap-3 mt-auto">
                  <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center font-bold text-amber-700">
                    {review.studentName?.charAt(0).toUpperCase() || 'S'}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">{review.studentName || 'Student'}</div>
                    <div className="text-xs text-slate-500">Class 10 Batch</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
