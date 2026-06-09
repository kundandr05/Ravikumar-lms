'use client';

import { useEffect, useState, useRef, use } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase/firebase';
import { doc, getDoc, collection, query, where, getDocs, setDoc, Timestamp } from 'firebase/firestore';
import { MediaContent, MediaProgress } from '@/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function UniversalLearningPlayer({ params }: { params: Promise<{ courseId: string, mediaId: string }> }) {
  const { courseId, mediaId } = use(params);
  const { appUser } = useAuth();
  const router = useRouter();
  
  const [media, setMedia] = useState<MediaContent | null>(null);
  const [progress, setProgress] = useState<MediaProgress | null>(null);
  const [loading, setLoading] = useState(true);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // Throttle writes to firestore
  const lastWriteTimeRef = useRef<number>(0);

  useEffect(() => {
    async function fetchData() {
      if (!appUser?.uid) return;
      try {
        // Fetch Media
        const mediaDoc = await getDoc(doc(db, 'media', mediaId));
        if (mediaDoc.exists()) {
          setMedia({ id: mediaDoc.id, ...mediaDoc.data() } as MediaContent);
        }

        // Fetch Progress
        const progressQuery = query(
          collection(db, 'mediaProgress'),
          where('studentId', '==', appUser.uid),
          where('mediaId', '==', mediaId)
        );
        const progressSnap = await getDocs(progressQuery);
        if (!progressSnap.empty) {
          setProgress({ id: progressSnap.docs[0].id, ...progressSnap.docs[0].data() } as MediaProgress);
        }
      } catch (error) {
        console.error("Error fetching media:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [mediaId, appUser]);

  const saveProgress = async (percentage: number, isCompleted: boolean = false) => {
    if (!appUser?.uid || !mediaId || !courseId) return;
    
    // Throttle writes to every 5 seconds to save Firestore quota, unless it's completed
    const now = Date.now();
    if (!isCompleted && now - lastWriteTimeRef.current < 5000) return;
    lastWriteTimeRef.current = now;

    const progressRef = progress?.id 
      ? doc(db, 'mediaProgress', progress.id)
      : doc(collection(db, 'mediaProgress'));
      
    const progressData: MediaProgress = {
      studentId: appUser.uid,
      mediaId,
      courseId,
      watchPercentage: percentage,
      lastViewed: Timestamp.now(),
      completed: isCompleted || percentage >= 90
    };

    await setDoc(progressRef, progressData, { merge: true });
    
    if (!progress?.id) {
      setProgress({ id: progressRef.id, ...progressData });
    }
  };

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement | HTMLAudioElement>) => {
    const target = e.target as HTMLVideoElement;
    if (!target.duration) return;
    const percentage = (target.currentTime / target.duration) * 100;
    saveProgress(percentage, percentage >= 90);
  };

  const markCompleted = () => {
    saveProgress(100, true);
    alert('Marked as completed!');
  };

  if (loading) return <div className="flex h-screen items-center justify-center">Loading Media...</div>;
  if (!media) return <div className="p-8 text-center text-red-500">Media not found.</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <Link href={`/dashboard/student/courses/${courseId}`} className="text-amber-600 hover:text-amber-700 text-sm font-medium flex items-center gap-1">
          &larr; Back to Course
        </Link>
        {progress?.completed && (
          <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            Completed
          </span>
        )}
      </div>

      <div className="bg-black rounded-xl overflow-hidden shadow-2xl relative aspect-video flex items-center justify-center">
        {media.type === 'video' && (
          <video 
            ref={videoRef}
            src={media.url} 
            controls 
            className="w-full h-full object-contain"
            onTimeUpdate={handleTimeUpdate}
            controlsList="nodownload"
          />
        )}
        
        {media.type === 'youtube' && (
          <iframe 
            src={media.url} 
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowFullScreen
          />
        )}

        {media.type === 'audio' && (
          <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center p-8 space-y-8">
            <div className="w-32 h-32 bg-slate-800 rounded-full flex items-center justify-center shadow-inner">
              <svg className="w-16 h-16 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
            </div>
            <audio 
              ref={audioRef}
              src={media.url} 
              controls 
              className="w-full max-w-md"
              onTimeUpdate={handleTimeUpdate}
            />
          </div>
        )}

        {media.type === 'image' && (
          <img src={media.url} alt={media.title} className="w-full h-full object-contain bg-slate-900" />
        )}

        {media.type === 'document' && (
          <div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center space-y-4">
             <svg className="w-20 h-20 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
             <p className="text-slate-600 font-medium">Document Viewer</p>
             <a href={media.url} target="_blank" rel="noopener noreferrer" className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors shadow">
               Open {media.fileExtension?.toUpperCase() || 'Document'}
             </a>
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{media.title}</h1>
            <p className="text-amber-600 text-sm font-semibold tracking-wide uppercase mt-1">{media.chapter}</p>
          </div>
          {media.type !== 'video' && media.type !== 'audio' && (
            <Button onClick={markCompleted} variant={progress?.completed ? "outline" : "default"} disabled={progress?.completed}>
              {progress?.completed ? "Completed" : "Mark as Completed"}
            </Button>
          )}
        </div>
        {media.description && <p className="text-slate-600 leading-relaxed">{media.description}</p>}
      </div>
    </div>
  );
}
