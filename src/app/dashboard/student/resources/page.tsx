'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase/firebase';
import { collection, query, orderBy, getDocs, where, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StudyResource, Bookmark } from '@/types';

export default function StudentResourcesPage() {
  const { appUser } = useAuth();
  
  const [resources, setResources] = useState<StudyResource[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [activeTab, setActiveTab] = useState<'all' | 'bookmarks'>('all');

  useEffect(() => {
    if (appUser?.uid) {
      fetchData();
    }
  }, [appUser]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Resources
      const resQ = query(collection(db, 'resources'), orderBy('createdAt', 'desc'));
      const resSnap = await getDocs(resQ);
      const fetchedResources: StudyResource[] = [];
      resSnap.forEach(d => {
        fetchedResources.push({ resourceId: d.id, ...d.data() } as StudyResource);
      });
      setResources(fetchedResources);

      // 2. Fetch User Bookmarks
      const bmQ = query(collection(db, 'bookmarks'), where('studentId', '==', appUser?.uid));
      const bmSnap = await getDocs(bmQ);
      const fetchedBookmarks: Bookmark[] = [];
      bmSnap.forEach(d => {
        fetchedBookmarks.push({ bookmarkId: d.id, ...d.data() } as Bookmark);
      });
      setBookmarks(fetchedBookmarks);
    } catch (error) {
      console.error("Error fetching study materials", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleBookmark = async (resourceId: string) => {
    if (!appUser?.uid) return;

    const existingBookmark = bookmarks.find(b => b.resourceId === resourceId);

    if (existingBookmark) {
      // Remove bookmark
      try {
        await deleteDoc(doc(db, 'bookmarks', existingBookmark.bookmarkId!));
        setBookmarks(prev => prev.filter(b => b.bookmarkId !== existingBookmark.bookmarkId));
      } catch (error) {
        console.error("Error removing bookmark", error);
      }
    } else {
      // Add bookmark
      try {
        const docRef = await addDoc(collection(db, 'bookmarks'), {
          studentId: appUser.uid,
          resourceId,
          createdAt: serverTimestamp()
        });
        setBookmarks(prev => [...prev, { bookmarkId: docRef.id, studentId: appUser.uid, resourceId, createdAt: new Date() }]);
      } catch (error) {
        console.error("Error adding bookmark", error);
      }
    }
  };

  const getFilteredResources = () => {
    let filtered = resources;

    // Apply Tab Filter
    if (activeTab === 'bookmarks') {
      const bookmarkedIds = new Set(bookmarks.map(b => b.resourceId));
      filtered = filtered.filter(r => bookmarkedIds.has(r.resourceId!));
    }

    // Apply Category Filter
    if (categoryFilter !== 'All') {
      filtered = filtered.filter(r => r.category === categoryFilter);
    }

    // Apply Search Filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(r => 
        r.title.toLowerCase().includes(q) || 
        r.subject.toLowerCase().includes(q)
      );
    }

    return filtered;
  };

  const filteredResources = getFilteredResources();
  const bookmarkedIds = new Set(bookmarks.map(b => b.resourceId));

  const categories = ['All', ...Array.from(new Set(resources.map(r => r.category)))];

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading Study Materials...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Study Materials Hub</h1>
        <p className="text-slate-500 mt-2">Find and download PDFs, worksheets, and question banks.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          className={`pb-4 px-6 font-medium text-sm transition-colors relative ${activeTab === 'all' ? 'text-amber-600' : 'text-slate-500 hover:text-slate-700'}`}
          onClick={() => setActiveTab('all')}
        >
          All Resources
          {activeTab === 'all' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-amber-600" />}
        </button>
        <button
          className={`pb-4 px-6 font-medium text-sm transition-colors relative flex items-center gap-2 ${activeTab === 'bookmarks' ? 'text-amber-600' : 'text-slate-500 hover:text-slate-700'}`}
          onClick={() => setActiveTab('bookmarks')}
        >
          My Bookmarks
          <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs">{bookmarks.length}</span>
          {activeTab === 'bookmarks' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-amber-600" />}
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <Input 
            className="pl-10" 
            placeholder="Search by title or subject..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="w-full md:w-64">
          <Select value={categoryFilter} onValueChange={(val) => setCategoryFilter(val as string)}>
            <SelectTrigger>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Resource Grid */}
      {filteredResources.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-lg bg-slate-50">
          <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          <h3 className="text-lg font-bold text-slate-700">No resources found</h3>
          <p className="text-slate-500">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources.map((res) => {
            const isBookmarked = bookmarkedIds.has(res.resourceId!);
            
            return (
              <Card key={res.resourceId} className="flex flex-col group hover:shadow-md transition-shadow hover:border-amber-200">
                <CardContent className="p-6 flex flex-col flex-1 relative">
                  {/* Bookmark Button */}
                  <button 
                    onClick={() => res.resourceId && toggleBookmark(res.resourceId)}
                    className="absolute top-4 right-4 text-slate-300 hover:text-amber-500 transition-colors focus:outline-none z-10"
                    title={isBookmarked ? "Remove Bookmark" : "Bookmark"}
                  >
                    <svg className={`w-6 h-6 ${isBookmarked ? 'text-amber-500 fill-current' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  </button>

                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-amber-100 group-hover:text-amber-600 transition-colors">
                      {res.category === 'PDF Notes' ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                      ) : res.category === 'Worksheet' ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">{res.category}</p>
                      <p className="text-sm font-medium text-slate-500">{res.subject}</p>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-1 pr-6">{res.title}</h3>
                  <p className="text-sm text-slate-600 line-clamp-3 mb-6 flex-1">{res.description}</p>
                  
                  <Button 
                    className="w-full bg-slate-900 hover:bg-slate-800 gap-2"
                    onClick={() => window.open(res.fileUrl, '_blank', 'noopener,noreferrer')}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    Download / View
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
