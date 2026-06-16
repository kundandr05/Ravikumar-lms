'use client';

import { useEffect, useState, use } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase/firebase';
import { doc, getDoc, collection, query, where, getDocs, orderBy, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Course, Lesson } from '@/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import YouTube, { YouTubeProps, YouTubePlayer } from 'react-youtube';
import { useRef } from 'react';
import { Telemetry } from '@/lib/telemetry';

export default function StudentLessonPlayerPage({ params }: { params: Promise<{ courseId: string, lessonId: string }> }) {
  const { courseId, lessonId } = use(params);
  const { appUser } = useAuth();
  const router = useRouter();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [allLessons, setAllLessons] = useState<Lesson[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [marking, setMarking] = useState(false);
  const [learningSessionId, setLearningSessionId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLessonData() {
      if (!appUser?.uid) return;

      try {
        const enrollQuery = query(collection(db, 'enrollments'), where('studentId', '==', appUser.uid), where('courseId', '==', courseId));
        const enrollSnap = await getDocs(enrollQuery);
        if (enrollSnap.empty) {
          setIsEnrolled(false);
          setLoading(false);
          return;
        }
        setIsEnrolled(true);

        const courseDoc = await getDoc(doc(db, 'courses', courseId));
        if (courseDoc.exists()) setCourse({ courseId: courseDoc.id, ...courseDoc.data() } as Course);

        const lessonDoc = await getDoc(doc(db, 'lessons', lessonId));
        if (lessonDoc.exists()) {
          const lData = { lessonId: lessonDoc.id, ...lessonDoc.data() } as Lesson;
          setLesson(lData);
        }

        const lessonsQuery = query(collection(db, 'lessons'), where('courseId', '==', courseId), orderBy('order', 'asc'));
        const lessonsSnap = await getDocs(lessonsQuery);
        const fetchedLessons: Lesson[] = [];
        lessonsSnap.forEach(d => fetchedLessons.push({ lessonId: d.id, ...d.data() } as Lesson));
        setAllLessons(fetchedLessons);

        const progressQuery = query(
          collection(db, 'lessonProgress'), 
          where('studentId', '==', appUser.uid), 
          where('courseId', '==', courseId),
          where('lessonId', '==', lessonId)
        );
        const progressSnap = await getDocs(progressQuery);
        if (!progressSnap.empty && progressSnap.docs[0].data().completed) {
          setIsCompleted(true);
        }

      } catch (error) {
        console.error("Error fetching lesson:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchLessonData();
  }, [courseId, lessonId, appUser]);

  const handleMarkComplete = async () => {
    if (!appUser?.uid) return;
    setMarking(true);
    try {
      const docId = `${appUser.uid}_${lessonId}`;
      await setDoc(doc(db, 'lessonProgress', docId), {
        studentId: appUser.uid,
        courseId,
        lessonId,
        completed: true,
        completedAt: serverTimestamp()
      });
      setIsCompleted(true);
    } catch (error) {
      console.error("Error marking complete:", error);
      alert("Failed to mark as complete");
    } finally {
      setMarking(false);
    }
  };

  const videoId = lesson?.videoUrl ? (() => {
    let id = '';
    const url = lesson.videoUrl;
    if (url.includes('youtu.be/')) id = url.split('youtu.be/')[1].split('?')[0];
    else if (url.includes('youtube.com/watch')) id = new URLSearchParams(url.split('?')[1]).get('v') || '';
    else if (url.includes('youtube.com/embed/')) id = url.split('youtube.com/embed/')[1].split('?')[0];
    return id;
  })() : '';

  const onPlayerStateChange: YouTubeProps['onStateChange'] = (event) => {
    if (event.data === YouTube.PlayerState.ENDED) {
      if (!isCompleted) handleMarkComplete();
    }
  };


  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading video lesson...</div>;
  if (!isEnrolled) return <div className="p-8 text-center text-red-500">Access Denied. You are not enrolled.</div>;
  if (!lesson) return <div className="p-8 text-center text-red-500">Lesson not found.</div>;

  const currentIndex = allLessons.findIndex(l => l.lessonId === lessonId);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Link href={`/dashboard/student/courses/${courseId}`} className="text-primary hover:text-amber-700 text-sm font-medium flex items-center gap-1 mb-4">
        &larr; Back to Course Overview
      </Link>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 space-y-6">
          <div className="bg-black rounded-xl overflow-hidden aspect-video shadow-lg">
            {videoId ? (
              <YouTube 
                videoId={videoId}
                opts={{ width: '100%', height: '100%', playerVars: { autoplay: 0, modestbranding: 1, rel: 0 } }}
                onStateChange={onPlayerStateChange}
                className="w-full h-full"
                iframeClassName="w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-500">Video format not supported</div>
            )}
          </div>

          <div>
            <h1 className="text-3xl font-bold text-foreground mb-4">{lesson.title}</h1>
            <div className="flex flex-wrap items-center gap-4">
              <Button 
                onClick={handleMarkComplete} 
                disabled={isCompleted || marking}
                variant={isCompleted ? "secondary" : "default"}
                className={isCompleted ? "bg-green-100 text-green-800 hover:bg-green-100 cursor-default" : "bg-amber-500 hover:bg-amber-600"}
              >
                {isCompleted ? (
                  <><svg className="w-5 h-5 mr-2 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Completed</>
                ) : marking ? 'Marking...' : 'Mark as Complete'}
              </Button>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-80 shrink-0 space-y-6">
          <Card className="border-border sticky top-24">
            <CardHeader className="bg-muted/50 border-b pb-4">
              <CardTitle className="text-lg">Course Curriculum</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[60vh] overflow-y-auto">
                {allLessons.map((l, idx) => (
                  <Link 
                    key={l.lessonId} 
                    href={`/dashboard/student/courses/${courseId}/lessons/${l.lessonId}`}
                    className={`flex items-center p-4 border-b border-border last:border-0 hover:bg-muted transition-colors ${l.lessonId === lessonId ? 'bg-amber-500/10 border-l-4 border-l-amber-500 text-foreground' : 'border-l-4 border-l-transparent text-muted-foreground'}`}
                  >
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${l.lessonId === lessonId ? 'text-amber-600 dark:text-amber-500' : 'text-foreground'}`}>
                        {idx + 1}. {l.title}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
