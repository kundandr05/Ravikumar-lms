'use client';

import { useEffect, useState, useMemo } from 'react';
import { db } from '@/lib/firebase/firebase';
import { collection, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Review } from '@/types';

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, 'reviews'));
      const reviewsData: Review[] = [];
      snapshot.forEach((doc) => {
        reviewsData.push({ id: doc.id, ...doc.data() } as Review);
      });
      // Sort newest first
      reviewsData.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
      });
      setReviews(reviewsData);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this review? This action cannot be undone.")) {
      try {
        await deleteDoc(doc(db, 'reviews', id));
        setReviews(reviews.filter(r => r.id !== id));
      } catch (error) {
        console.error("Error deleting review:", error);
        alert("Failed to delete review");
      }
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: 'approved' | 'rejected' | 'pending') => {
    try {
      await updateDoc(doc(db, 'reviews', id), {
        status: newStatus
      });
      setReviews(reviews.map(r => r.id === id ? { ...r, status: newStatus } : r));
    } catch (error) {
      console.error("Error updating review status:", error);
      alert("Failed to update status");
    }
  };

  const filteredReviews = useMemo(() => {
    return reviews.filter(review => {
      const matchesSearch = (review.studentName || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (review.title || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || review.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [reviews, searchQuery, statusFilter]);

  const kpis = {
    total: reviews.length,
    pending: reviews.filter(r => r.status === 'pending' || !r.status).length, // Handle legacy undefined
    approved: reviews.filter(r => r.status === 'approved').length,
    rejected: reviews.filter(r => r.status === 'rejected').length,
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Reviews Management</h1>
        <p className="text-slate-500 mt-2">Manage student testimonials that appear on the public website.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-sm font-medium text-slate-500 mb-1">Total Reviews</div>
            <div className="text-3xl font-bold text-slate-900">{kpis.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm font-medium text-amber-600 mb-1">Pending Review</div>
            <div className="text-3xl font-bold text-amber-700">{kpis.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm font-medium text-green-600 mb-1">Approved</div>
            <div className="text-3xl font-bold text-green-700">{kpis.approved}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm font-medium text-red-600 mb-1">Rejected</div>
            <div className="text-3xl font-bold text-red-700">{kpis.rejected}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="bg-slate-50 border-b pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <CardTitle className="text-slate-800">All Reviews</CardTitle>
          <div className="flex flex-col sm:flex-row gap-3">
            <input 
              type="text" 
              placeholder="Search by name or title..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm min-w-[250px]"
            />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 border rounded-md text-sm bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading reviews...</div>
          ) : filteredReviews.length === 0 ? (
            <div className="p-8 text-center text-slate-500 border border-dashed m-6 rounded-lg bg-slate-50">
              No reviews found matching your filters.
            </div>
          ) : (
            <div className="divide-y">
              {filteredReviews.map((review) => (
                <div key={review.id} className="p-6 hover:bg-slate-50/50 transition-colors">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                    <div className="space-y-2 max-w-3xl">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-slate-900">{review.studentName || 'Unknown Student'}</span>
                        <span className="text-sm text-slate-500">{review.studentEmail}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          review.status === 'approved' ? 'bg-green-100 text-green-800' :
                          review.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {(review.status || 'pending').toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="flex items-center text-amber-500 font-bold text-sm">
                        {review.rating || 5}/5
                        <svg className="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                      </div>

                      <div className="font-semibold text-lg text-slate-800">{review.title}</div>
                      <p className="text-slate-700 whitespace-pre-wrap">{review.message || (review as any).review}</p>
                      
                      <div className="text-xs text-slate-400">
                        Submitted: {review.createdAt?.toDate ? review.createdAt.toDate().toLocaleString() : 'Unknown Date'}
                      </div>
                    </div>

                    <div className="flex flex-row md:flex-col gap-2 shrink-0">
                      {review.status !== 'approved' && (
                        <Button 
                          size="sm" 
                          onClick={() => review.id && handleUpdateStatus(review.id, 'approved')}
                          className="bg-green-600 hover:bg-green-700 text-white w-full"
                        >
                          Approve
                        </Button>
                      )}
                      {review.status !== 'rejected' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => review.id && handleUpdateStatus(review.id, 'rejected')}
                          className="text-amber-700 hover:bg-amber-50 w-full"
                        >
                          Reject
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => review.id && handleDelete(review.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 w-full"
                      >
                        Delete
                      </Button>
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
