'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Review {
  id?: string;
  studentId: string;
  studentName: string;
  review: string;
  rating: number;
  createdAt: any;
}

export default function StudentReviewsPage() {
  const { appUser } = useAuth();
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [myReviews, setMyReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyReviews();
  }, [appUser]);

  const fetchMyReviews = async () => {
    if (!appUser?.uid) return;
    setLoading(true);
    try {
      const q = query(collection(db, 'reviews'), where('studentId', '==', appUser.uid));
      const snapshot = await getDocs(q);
      const fetched: Review[] = [];
      snapshot.forEach((doc) => {
        fetched.push({ id: doc.id, ...doc.data() } as Review);
      });
      setMyReviews(fetched);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appUser?.uid || !reviewText.trim()) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'reviews'), {
        studentId: appUser.uid,
        studentName: appUser.name || 'Student',
        review: reviewText.trim(),
        rating,
        createdAt: serverTimestamp()
      });

      setReviewText('');
      setRating(5);
      await fetchMyReviews();
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this review?")) {
      try {
        await deleteDoc(doc(db, 'reviews', id));
        setMyReviews(myReviews.filter(r => r.id !== id));
      } catch (error) {
        console.error("Error deleting review:", error);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Course Reviews & Testimonials</h1>
        <p className="text-slate-500 mt-2">Share your experience to help other students.</p>
      </div>

      <Card className="border-amber-200 shadow-md">
        <CardHeader className="bg-amber-50 border-b border-amber-100 pb-4">
          <CardTitle className="text-amber-900">Write a Review</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="focus:outline-none"
                  >
                    <svg 
                      className={`w-8 h-8 ${rating >= star ? 'text-amber-400' : 'text-slate-200 hover:text-amber-200'} transition-colors`} 
                      fill="currentColor" 
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Your Testimonial</label>
              <textarea 
                required
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="What did you like about the courses? How did they help you?"
                rows={4}
                className="w-full p-3 border rounded-md focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <Button type="submit" disabled={submitting} className="bg-amber-600 hover:bg-amber-700">
              {submitting ? 'Submitting...' : 'Submit Review'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900">My Reviews</h2>
        
        {loading ? (
          <p className="text-slate-500">Loading your reviews...</p>
        ) : myReviews.length === 0 ? (
          <div className="text-center py-12 text-slate-500 border rounded-lg border-dashed bg-white">
            You haven't submitted any reviews yet.
          </div>
        ) : (
          <div className="grid gap-4">
            {myReviews.map(review => (
              <Card key={review.id}>
                <CardHeader className="pb-2 flex flex-row justify-between items-start">
                  <div className="flex items-center text-amber-500 font-bold">
                    {review.rating}/5
                    <svg className="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => review.id && handleDelete(review.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                    Delete
                  </Button>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-700 whitespace-pre-wrap">{review.review}</p>
                  {review.createdAt && (
                     <p className="text-xs text-slate-400 mt-4">
                       Submitted on {review.createdAt.toDate().toLocaleDateString()}
                     </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
