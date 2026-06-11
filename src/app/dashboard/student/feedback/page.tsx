'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Feedback } from '@/types';

export default function StudentFeedbackPage() {
  const { appUser } = useAuth();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('General Feedback');
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);

  const categories = [
    'General Feedback', 
    'Course Feedback', 
    'Assignment Feedback', 
    'Technical Issue', 
    'Suggestion', 
    'Complaint', 
    'Other'
  ];

  useEffect(() => {
    fetchFeedbacks();
  }, [appUser]);

  async function fetchFeedbacks() {
    if (!appUser?.uid) return;
    setLoading(true);
    try {
      // Note: If orderBy('createdAt', 'desc') causes a missing index error, we'll sort client-side.
      const q = query(collection(db, 'feedback'), where('studentId', '==', appUser.uid));
      const snapshot = await getDocs(q);
      const fetched: Feedback[] = [];
      snapshot.forEach(doc => {
        fetched.push({ id: doc.id, ...doc.data() } as Feedback);
      });

      // Client-side sort by newest first
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appUser?.uid || !subject.trim() || !message.trim()) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'feedback'), {
        studentId: appUser.uid,
        studentName: appUser.name || 'Unknown Student',
        studentEmail: appUser.email || 'N/A',
        subject: subject.trim(),
        category,
        message: message.trim(),
        rating,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Reset form
      setSubject('');
      setCategory('General Feedback');
      setMessage('');
      setRating(0);
      setShowForm(false);
      
      // Refresh list
      await fetchFeedbacks();
    } catch (error) {
      console.error("Error submitting feedback:", error);
      alert("Failed to submit feedback. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'bg-green-100 text-green-800 border-green-200';
      case 'reviewed': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-amber-100 text-amber-800 border-amber-200';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Feedback Forum</h1>
          <p className="text-muted-foreground mt-2">Submit your feedback, suggestions, or report issues directly to the admin.</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="bg-amber-600 hover:bg-amber-700">
          {showForm ? 'Cancel' : 'Submit New Feedback'}
        </Button>
      </div>

      {showForm && (
        <Card className="border-amber-200 shadow-md">
          <CardHeader className="bg-amber-50 border-b border-amber-100 pb-4">
            <CardTitle className="text-amber-900">New Feedback</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Category</label>
                  <select 
                    value={category} 
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2 border rounded-md bg-card text-card-foreground focus:ring-2 focus:ring-amber-500"
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Subject</label>
                  <input 
                    type="text" 
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Brief subject of your feedback"
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Message</label>
                <textarea 
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Please describe your feedback, suggestion, or issue in detail..."
                  rows={5}
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  Rating (Optional)
                  <span className="text-xs text-muted-foreground font-normal">How would you rate your experience?</span>
                </label>
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
                  {rating > 0 && (
                    <button type="button" onClick={() => setRating(0)} className="text-xs text-muted-foreground hover:text-muted-foreground ml-2">Clear</button>
                  )}
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <Button type="submit" disabled={submitting} className="bg-amber-600 hover:bg-amber-700 px-8">
                  {submitting ? 'Submitting...' : 'Submit'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <h2 className="text-xl font-bold text-foreground">Your Past Feedback</h2>
        
        {loading ? (
          <p className="text-muted-foreground text-center py-8">Loading history...</p>
        ) : feedbacks.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-12 text-center text-muted-foreground">
              <svg className="w-12 h-12 mx-auto mb-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <p>You haven't submitted any feedback yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {feedbacks.map(fb => (
              <Card key={fb.id} className="overflow-hidden">
                <CardHeader className="bg-muted/50 border-b pb-4 flex flex-row justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{fb.category}</span>
                      {fb.rating ? (
                        <span className="flex items-center text-amber-500 text-xs">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                          {fb.rating}/5
                        </span>
                      ) : null}
                    </div>
                    <CardTitle className="text-lg text-foreground">{fb.subject}</CardTitle>
                  </div>
                  <span className={`px-2.5 py-1 text-xs font-bold rounded-full border uppercase ${getStatusColor(fb.status)}`}>
                    {fb.status}
                  </span>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <p className="text-foreground whitespace-pre-wrap text-sm">{fb.message}</p>
                  
                  <div className="text-xs text-muted-foreground">
                    Submitted on {fb.createdAt?.toDate ? fb.createdAt.toDate().toLocaleString() : 'Unknown'}
                  </div>

                  {fb.adminReply && (
                    <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-100">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                        <span className="font-bold text-amber-900 text-sm">Admin Reply</span>
                      </div>
                      <p className="text-amber-800 text-sm whitespace-pre-wrap">{fb.adminReply}</p>
                    </div>
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
