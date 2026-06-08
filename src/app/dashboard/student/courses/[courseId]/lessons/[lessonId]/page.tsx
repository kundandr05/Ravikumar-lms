'use client';

import { useEffect, useState, use } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase/firebase';
import { doc, getDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Course, Lesson } from '@/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Helper to extract YouTube Video ID and format embed URL
function getYouTubeEmbedUrl(url: string) {
  let videoId = '';
  try {
    if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1].split('?')[0];
    } else if (url.includes('youtube.com/watch')) {
      const urlParams = new URLSearchParams(url.split('?')[1]);
      videoId = urlParams.get('v') || '';
    } else if (url.includes('youtube.com/embed/')) {
      videoId = url.split('youtube.com/embed/')[1].split('?')[0];
    }
  } catch (e) {
    console.error("Failed to parse YouTube URL", e);
  }
  return videoId ? `https://www.youtube.com/embed/${videoId}` : '';
}

export default function StudentLessonPlayerPage({ params }: { params: Promise<{ courseId: string, lessonId: string }> }) {
  const { courseId, lessonId } = use(params);
  const { appUser } = useAuth();
  const router = useRouter();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [allLessons, setAllLessons] = useState<Lesson[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);

  useEffect(() => {
    async function loadLessonData() {
      if (!appUser?.uid) return;

      try {
        // 1. Verify Enrollment
        const enrollQuery = query(
          collection(db, 'enrollments'), 
          where('studentId', '==', appUser.uid),
          where('courseId', '==', courseId)
        );
        const enrollSnap = await getDocs(enrollQuery);
        if (enrollSnap.empty) {
          setIsEnrolled(false);
          setLoading(false);
          return;
        }
        setIsEnrolled(true);

        // 2. Fetch Course
        const courseDoc = await getDoc(doc(db, 'courses', courseId));
        if (courseDoc.exists()) {
          setCourse({ courseId: courseDoc.id, ...courseDoc.data() } as Course);
        }

        // 3. Fetch current Lesson
        const lessonDoc = await getDoc(doc(db, 'lessons', lessonId));
        if (lessonDoc.exists()) {
          setLesson({ lessonId: lessonDoc.id, ...lessonDoc.data() } as Lesson);
        }

        // 4. Fetch all lessons for navigation (Next/Prev)
        const lessonsQuery = query(
          collection(db, 'lessons'), 
          where('courseId', '==', courseId),
          orderBy('order', 'asc')
        );
        const lessonsSnap = await getDocs(lessonsQuery);
        const fetchedLessons: Lesson[] = [];
        lessonsSnap.forEach(d => {
          fetchedLessons.push({ lessonId: d.id, ...d.data() } as Lesson);
        });
        setAllLessons(fetchedLessons);

      } catch (error) {
        console.error("Error loading lesson player data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadLessonData();
  }, [courseId, lessonId, appUser]);

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading video player...</div>;
  }

  if (!isEnrolled) {
    return (
      <div className="p-8 text-center max-w-lg mx-auto mt-12 space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">Access Denied</h2>
        <p className="text-slate-600">You must be enrolled in this course to watch lessons.</p>
        <Link href="/courses" className={buttonVariants()}>Browse Public Courses</Link>
      </div>
    );
  }

  if (!lesson) {
    return <div className="p-8 text-center text-red-500">Lesson not found.</div>;
  }

  const embedUrl = getYouTubeEmbedUrl(lesson.videoUrl);

  // Find next/prev lessons
  const currentIndex = allLessons.findIndex(l => l.lessonId === lessonId);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Link href={`/dashboard/student/courses/${courseId}`} className="text-amber-600 hover:text-amber-700 text-sm font-medium flex items-center gap-1">
        &larr; Back to {course?.title || 'Course'}
      </Link>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main Player Area */}
        <div className="flex-1 space-y-6">
          <div className="bg-black aspect-video rounded-xl overflow-hidden shadow-lg border border-slate-800">
            {embedUrl ? (
              <iframe
                src={`${embedUrl}?rel=0&modestbranding=1`}
                title={lesson.title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 bg-slate-900">
                <svg className="w-16 h-16 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                <p>Invalid Video URL or Video Unavailable</p>
              </div>
            )}
          </div>

          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              <span className="text-slate-400 mr-2">{lesson.order}.</span>
              {lesson.title}
            </h1>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center pt-6 border-t border-slate-200">
            {prevLesson ? (
              <Link href={`/dashboard/student/courses/${courseId}/lessons/${prevLesson.lessonId}`} className={buttonVariants({ variant: "outline" })}>
                &larr; Previous Lesson
              </Link>
            ) : <div />}

            {nextLesson ? (
              <Link href={`/dashboard/student/courses/${courseId}/lessons/${nextLesson.lessonId}`} className={buttonVariants()}>
                Next Lesson &rarr;
              </Link>
            ) : (
              <Button disabled variant="secondary">End of Course</Button>
            )}
          </div>
        </div>

        {/* Sidebar: Notes and Playlist */}
        <div className="w-full lg:w-80 shrink-0 space-y-6">
          {/* Notes Card */}
          {lesson.notesPdf && (
            <Card className="border-amber-200 bg-amber-50 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-amber-900 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  Class Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-amber-800 mb-4">Download the PDF notes associated with this lesson for offline reading.</p>
                <a 
                  href={lesson.notesPdf} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className={buttonVariants({ className: "w-full bg-amber-600 hover:bg-amber-700" })}
                >
                  Download PDF
                </a>
              </CardContent>
            </Card>
          )}

          {/* Playlist Card */}
          <Card>
            <CardHeader className="pb-3 bg-slate-50 border-b">
              <CardTitle className="text-lg">Course Content</CardTitle>
            </CardHeader>
            <div className="max-h-[400px] overflow-y-auto divide-y divide-slate-100">
              {allLessons.map((l) => {
                const isActive = l.lessonId === lessonId;
                return (
                  <Link 
                    key={l.lessonId}
                    href={`/dashboard/student/courses/${courseId}/lessons/${l.lessonId}`}
                    className={`flex gap-3 p-4 hover:bg-slate-50 transition-colors ${isActive ? 'bg-amber-50 hover:bg-amber-50' : ''}`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isActive ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                      {isActive ? (
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" /></svg>
                      ) : (
                        l.order
                      )}
                    </div>
                    <p className={`text-sm font-medium line-clamp-2 ${isActive ? 'text-amber-900' : 'text-slate-700'}`}>
                      {l.title}
                    </p>
                  </Link>
                )
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
