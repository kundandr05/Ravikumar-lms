'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MediaContent, Course } from '@/types';
import Link from 'next/link';

export default function VideoLibraryPage() {
  const [videos, setVideos] = useState<MediaContent[]>([]);
  const [courses, setCourses] = useState<{ [key: string]: string }>({}); // map courseId to title
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [courseFilter, setCourseFilter] = useState('');

  const [previewVideo, setPreviewVideo] = useState<MediaContent | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Courses to map IDs to Titles
      const coursesSnap = await getDocs(collection(db, 'courses'));
      const courseMap: { [key: string]: string } = {};
      coursesSnap.forEach(doc => {
        const data = doc.data() as Course;
        courseMap[doc.id] = data.title;
      });
      setCourses(courseMap);

      // 2. Fetch all Videos
      const q = query(collection(db, 'media'), where('type', '==', 'video'));
      const mediaSnap = await getDocs(q);
      const videoData: MediaContent[] = [];
      mediaSnap.forEach(doc => {
        videoData.push({ id: doc.id, ...doc.data() } as MediaContent);
      });
      
      // Sort by newest
      videoData.sort((a, b) => {
        const aTime = a.createdAt?.toMillis() || 0;
        const bTime = b.createdAt?.toMillis() || 0;
        return bTime - aTime;
      });
      
      setVideos(videoData);
    } catch (error) {
      console.error("Error fetching video library data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredVideos = videos.filter(v => {
    const matchesSearch = v.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCourse = courseFilter ? v.courseId === courseFilter : true;
    return matchesSearch && matchesCourse;
  });

  // Unique list of course IDs that actually have videos
  const availableCourseIds = Array.from(new Set(videos.map(v => v.courseId)));

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Video Preview Modal */}
      {previewVideo && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 md:p-12">
          <div className="w-full max-w-5xl bg-slate-900 rounded-xl overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
              <div>
                <h3 className="text-white font-bold text-lg">{previewVideo.title}</h3>
                <p className="text-slate-400 text-sm">
                  {courses[previewVideo.courseId] || 'Unknown Course'} &bull; {previewVideo.chapter}
                </p>
              </div>
              <Button variant="ghost" className="text-slate-400 hover:text-white" onClick={() => setPreviewVideo(null)}>
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </Button>
            </div>
            <div className="aspect-video bg-black flex items-center justify-center">
              <video 
                src={previewVideo.url} 
                controls 
                autoPlay
                className="w-full h-full object-contain"
                controlsList="nodownload"
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Global Video Library</h1>
          <p className="text-slate-500 mt-1">Manage and preview all video content across your entire platform.</p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-6">
          <div>
            <CardTitle>All Videos ({videos.length})</CardTitle>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <Input 
              placeholder="Search video titles..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 bg-slate-50"
            />
            <select 
              className="border rounded-md px-3 py-2 text-sm bg-slate-50 w-full sm:w-auto"
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
            >
              <option value="">All Courses</option>
              {availableCourseIds.map(id => (
                <option key={id} value={id}>{courses[id] || `Course ${id}`}</option>
              ))}
            </select>
          </div>
        </CardHeader>
        
        <CardContent className="pt-6">
          {loading ? (
            <div className="py-12 text-center text-slate-500">Loading global video library...</div>
          ) : filteredVideos.length === 0 ? (
            <div className="py-16 text-center border-2 border-dashed rounded-lg bg-slate-50 text-slate-500">
              <svg className="w-12 h-12 mx-auto text-slate-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
              <h3 className="text-lg font-medium text-slate-900">No videos found</h3>
              <p>Try adjusting your search or filter criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredVideos.map(video => (
                <div key={video.id} className="group border rounded-xl overflow-hidden bg-white hover:shadow-lg transition-all duration-300">
                  {/* Thumbnail / Video Placeholder */}
                  <div 
                    className="aspect-video bg-slate-900 relative cursor-pointer flex items-center justify-center overflow-hidden"
                    onClick={() => setPreviewVideo(video)}
                  >
                    {/* A generic video icon placeholder */}
                    <div className="absolute inset-0 bg-blue-600/10 group-hover:bg-blue-600/20 transition-colors z-10 flex items-center justify-center">
                       <div className="w-12 h-12 rounded-full bg-white/90 shadow-lg flex items-center justify-center text-blue-600 transform group-hover:scale-110 transition-transform">
                          <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                       </div>
                    </div>
                  </div>
                  
                  {/* Details */}
                  <div className="p-4 space-y-3">
                    <div>
                      <h4 className="font-bold text-slate-900 line-clamp-1" title={video.title}>{video.title}</h4>
                      <p className="text-xs text-amber-600 font-semibold mt-1 truncate">{courses[video.courseId] || 'Unknown Course'}</p>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t">
                      <span className="flex items-center gap-1 truncate max-w-[60%]">
                        <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                        <span className="truncate">{video.chapter}</span>
                      </span>
                      <Link 
                        href={`/dashboard/admin/courses/${video.courseId}/media`}
                        className="text-blue-600 hover:text-blue-800 hover:underline shrink-0"
                      >
                        Manage
                      </Link>
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
