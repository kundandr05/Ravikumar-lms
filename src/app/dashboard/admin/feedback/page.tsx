'use client';

import { useEffect, useState, useMemo } from 'react';
import { db } from '@/lib/firebase/firebase';
import { collection, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Feedback } from '@/types';

export default function AdminFeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Modal State
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [replyText, setReplyText] = useState('');
  const [newStatus, setNewStatus] = useState<'pending' | 'reviewed' | 'resolved'>('pending');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  async function fetchFeedbacks() {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, 'feedback'));
      const fetched: Feedback[] = [];
      snapshot.forEach(doc => {
        fetched.push({ id: doc.id, ...doc.data() } as Feedback);
      });
      
      // Sort by newest first
      fetched.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
      });

      setFeedbacks(fetched);
    } catch (error) {
      console.error("Error fetching feedback:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFeedback?.id) return;
    setUpdating(true);
    try {
      await updateDoc(doc(db, 'feedback', selectedFeedback.id), {
        adminReply: replyText.trim(),
        status: newStatus,
        updatedAt: serverTimestamp()
      });

      // Update local state
      setFeedbacks(feedbacks.map(fb => 
        fb.id === selectedFeedback.id 
          ? { ...fb, adminReply: replyText.trim(), status: newStatus } 
          : fb
      ));
      
      setSelectedFeedback(null);
    } catch (error) {
      console.error("Error updating feedback:", error);
      alert("Failed to update feedback.");
    } finally {
      setUpdating(false);
    }
  };

  const openModal = (fb: Feedback) => {
    setSelectedFeedback(fb);
    setReplyText(fb.adminReply || '');
    setNewStatus(fb.status);
  };

  // Derived state for statistics & filtering
  const stats = useMemo(() => {
    const total = feedbacks.length;
    const pending = feedbacks.filter(f => f.status === 'pending').length;
    const resolved = feedbacks.filter(f => f.status === 'resolved').length;
    const rated = feedbacks.filter(f => f.rating && f.rating > 0);
    const avgRating = rated.length > 0 
      ? (rated.reduce((acc, curr) => acc + (curr.rating || 0), 0) / rated.length).toFixed(1) 
      : 'N/A';
    
    return { total, pending, resolved, avgRating };
  }, [feedbacks]);

  const filteredFeedbacks = useMemo(() => {
    return feedbacks.filter(fb => {
      const matchesSearch = fb.studentName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            fb.subject.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || fb.status === statusFilter;
      const matchesCategory = categoryFilter === 'all' || fb.category === categoryFilter;
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [feedbacks, searchQuery, statusFilter, categoryFilter]);

  const categories = Array.from(new Set(feedbacks.map(f => f.category)));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'reviewed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-amber-100 text-amber-800';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Feedback Management</h1>
        <p className="text-slate-500 mt-2">Review, reply, and manage feedback from students.</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-slate-500">Total Feedback</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-slate-500">Pending</p>
            <p className="text-3xl font-bold text-amber-600 mt-2">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-slate-500">Resolved</p>
            <p className="text-3xl font-bold text-green-600 mt-2">{stats.resolved}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-slate-500">Average Rating</p>
            <p className="text-3xl font-bold text-slate-900 mt-2 flex items-center gap-1">
              {stats.avgRating}
              {stats.avgRating !== 'N/A' && <svg className="w-6 h-6 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between border-b bg-slate-50">
          <CardTitle>All Feedback</CardTitle>
          <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
            <input 
              type="text" 
              placeholder="Search by student or subject..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="p-2 text-sm border rounded-md focus:ring-2 focus:ring-amber-500"
            />
            <select 
              value={categoryFilter} 
              onChange={e => setCategoryFilter(e.target.value)}
              className="p-2 text-sm border rounded-md focus:ring-2 focus:ring-amber-500 bg-white"
            >
              <option value="all">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select 
              value={statusFilter} 
              onChange={e => setStatusFilter(e.target.value)}
              className="p-2 text-sm border rounded-md focus:ring-2 focus:ring-amber-500 bg-white"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="reviewed">Reviewed</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
             <p className="text-slate-500 text-center py-12">Loading feedback...</p>
          ) : filteredFeedbacks.length === 0 ? (
            <p className="text-slate-500 text-center py-12">No feedback found matching the criteria.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b text-sm text-slate-500 bg-white">
                    <th className="p-4 font-medium">Student</th>
                    <th className="p-4 font-medium">Subject & Category</th>
                    <th className="p-4 font-medium">Rating</th>
                    <th className="p-4 font-medium">Date</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredFeedbacks.map((fb) => (
                    <tr key={fb.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4">
                        <p className="font-bold text-slate-900 text-sm">{fb.studentName}</p>
                        <p className="text-xs text-slate-500">{fb.studentEmail}</p>
                      </td>
                      <td className="p-4">
                        <p className="font-medium text-slate-900 text-sm">{fb.subject}</p>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{fb.category}</span>
                      </td>
                      <td className="p-4">
                        {fb.rating ? (
                          <div className="flex items-center text-amber-500 text-sm font-bold">
                            {fb.rating}/5 <svg className="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                          </div>
                        ) : <span className="text-slate-400 text-xs">None</span>}
                      </td>
                      <td className="p-4 text-slate-500 text-sm">
                        {fb.createdAt?.toDate ? fb.createdAt.toDate().toLocaleDateString() : 'Unknown'}
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${getStatusColor(fb.status)}`}>
                          {fb.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <Button variant="outline" size="sm" onClick={() => openModal(fb)}>
                          Review & Reply
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reply Modal */}
      {selectedFeedback && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full flex flex-col max-h-[90vh]">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50 rounded-t-xl">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Review Feedback</h3>
                <p className="text-sm text-slate-500">From {selectedFeedback.studentName}</p>
              </div>
              <button onClick={() => setSelectedFeedback(null)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="space-y-2">
                <div className="flex gap-2 mb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{selectedFeedback.category}</span>
                </div>
                <h4 className="font-bold text-lg text-slate-900">{selectedFeedback.subject}</h4>
                <div className="p-4 bg-slate-50 rounded-lg text-slate-700 text-sm whitespace-pre-wrap border">
                  {selectedFeedback.message}
                </div>
              </div>

              <form onSubmit={handleUpdate} className="space-y-4 pt-4 border-t border-slate-100">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-900">Admin Reply</label>
                  <textarea 
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder="Write a reply to the student..."
                    rows={4}
                    className="w-full p-3 border rounded-md focus:ring-2 focus:ring-amber-500 text-sm"
                  />
                  <p className="text-xs text-slate-500">This reply will be visible to the student in their dashboard.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-900">Status</label>
                  <select 
                    value={newStatus}
                    onChange={e => setNewStatus(e.target.value as any)}
                    className="w-full p-3 border rounded-md focus:ring-2 focus:ring-amber-500 bg-white text-sm"
                  >
                    <option value="pending">Pending</option>
                    <option value="reviewed">Reviewed (In Progress)</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setSelectedFeedback(null)}>Cancel</Button>
                  <Button type="submit" disabled={updating} className="bg-amber-600 hover:bg-amber-700">
                    {updating ? 'Saving...' : 'Save & Update Status'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
