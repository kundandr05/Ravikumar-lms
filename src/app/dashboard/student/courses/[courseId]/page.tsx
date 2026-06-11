'use client';

import { useEffect, useState, use } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase/firebase';
import { doc, getDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import { Course, Test, MediaContent, MediaProgress, Lesson } from '@/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function StudentCourseViewPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = use(params);
  const { appUser } = useAuth();
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  
  // New Media System
  const [mediaList, setMediaList] = useState<MediaContent[]>([]);
  const [completedMediaIds, setCompletedMediaIds] = useState<Set<string>>(new Set());
  
  // Legacy
  const [legacyLessons, setLegacyLessons] = useState<Lesson[]>([]);
  
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);

  useEffect(() => {
    async function checkEnrollmentAndFetch() {
      if (!appUser?.uid) return;

      try {
        // 1. Check Enrollment
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

        // 3. Fetch Advanced Media
        const mediaQuery = query(
          collection(db, 'media'),
          where('courseId', '==', courseId)
        );
        const mediaSnap = await getDocs(mediaQuery);
        const fetchedMedia: MediaContent[] = [];
        mediaSnap.forEach(d => {
          fetchedMedia.push({ id: d.id, ...d.data() } as MediaContent);
        });
        fetchedMedia.sort((a, b) => a.order - b.order);
        setMediaList(fetchedMedia);

        // 4. Fetch Advanced Media Progress
        const progressQuery = query(
          collection(db, 'mediaProgress'),
          where('studentId', '==', appUser.uid),
          where('courseId', '==', courseId),
          where('completed', '==', true)
        );
        const progressSnap = await getDocs(progressQuery);
        const completedIds = new Set<string>();
        progressSnap.forEach(d => {
          completedIds.add(d.data().mediaId);
        });
        setCompletedMediaIds(completedIds);

        // 5. Fetch Legacy Lessons
        const lessonsQuery = query(collection(db, 'lessons'), where('courseId', '==', courseId), orderBy('order', 'asc'));
        const lessonsSnap = await getDocs(lessonsQuery);
        const fetchedLessons: Lesson[] = [];
        lessonsSnap.forEach(d => fetchedLessons.push({ lessonId: d.id, ...d.data() } as Lesson));
        setLegacyLessons(fetchedLessons);

        // 6. Fetch Tests
        const testsQuery = query(collection(db, 'tests'), where('courseId', '==', courseId), orderBy('createdAt', 'asc'));
        const testsSnap = await getDocs(testsQuery);
        const fetchedTests: Test[] = [];
        testsSnap.forEach(d => fetchedTests.push({ testId: d.id, ...d.data() } as Test));
        setTests(fetchedTests);

      } catch (error) {
        console.error("Error fetching course data:", error);
      } finally {
        setLoading(false);
      }
    }

    checkEnrollmentAndFetch();
  }, [courseId, appUser]);

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading course curriculum...</div>;

  if (!isEnrolled) {
    return (
      <div className="p-8 text-center max-w-lg mx-auto mt-12 space-y-4">
        <h2 className="text-2xl font-bold text-foreground">Access Denied</h2>
        <p className="text-muted-foreground">You must be enrolled in this course to view its content.</p>
        <Link href="/courses" className={buttonVariants()}>Browse Public Courses</Link>
      </div>
    );
  }

  if (!course) return <div className="p-8 text-center text-red-500">Course not found.</div>;

  // Calculate total progress
  const totalItems = mediaList.length + legacyLessons.length;
  // For simplicity, progress bar uses media progress if media exists, else legacy
  const progressPercentage = mediaList.length > 0 
    ? Math.round((completedMediaIds.size / mediaList.length) * 100)
    : 0;

  const chapters = Array.from(new Set(mediaList.map(m => m.chapter)));

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <Link href="/dashboard/student/courses" className="text-amber-600 hover:text-amber-700 text-sm font-medium flex items-center gap-1">
        &larr; Back to My Courses
      </Link>

      <Card className="bg-slate-900 text-white border-0 overflow-hidden relative shadow-lg">
        {course.thumbnail && (
          <div className="absolute inset-0 opacity-20 bg-cover bg-center" style={{ backgroundImage: `url(${course.thumbnail})` }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/90 to-transparent" />
        
        <CardContent className="p-8 md:p-12 relative z-10">
          <div className="max-w-2xl space-y-4">
            <h1 className="text-3xl md:text-4xl font-bold">{course.title}</h1>
            <p className="text-slate-300 text-lg leading-relaxed">{course.description}</p>
            <div className="pt-4 flex items-center gap-4 text-sm font-medium text-amber-500">
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                {totalItems} Modules
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress Bar Header */}
      {mediaList.length > 0 && (
        <Card className="shadow-sm border-emerald-100 bg-emerald-50/50">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-3">
              <div>
                <h3 className="font-bold text-foreground">Your Progress</h3>
                <p className="text-sm text-muted-foreground">{completedMediaIds.size} of {mediaList.length} modules completed</p>
              </div>
              <div className="text-2xl font-black text-emerald-600">{progressPercentage}%</div>
            </div>
            <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out" 
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Advanced Media Curriculum */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Curriculum</h2>
          <p className="text-muted-foreground">Select a module to start learning.</p>
        </div>

        {chapters.length === 0 && legacyLessons.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg bg-muted/50 text-muted-foreground">
            Content is being prepared for this course. Check back soon!
          </div>
        ) : (
          <div className="space-y-8">
            {chapters.map((chapter) => {
              const chapterMedia = mediaList.filter(m => m.chapter === chapter);
              return (
                <div key={chapter} className="space-y-3">
                  <h3 className="font-semibold text-lg text-foreground border-b pb-2 flex items-center gap-2">
                    <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                    {chapter}
                  </h3>
                  <div className="grid gap-3">
                    {chapterMedia.map((media) => {
                      const isCompleted = completedMediaIds.has(media.id!);
                      return (
                        <Link 
                          key={media.id} 
                          href={`/dashboard/student/courses/${courseId}/media/${media.id}`}
                          className="group"
                        >
                          <Card className={`hover:border-amber-500 transition-colors cursor-pointer group-hover:shadow-md ${isCompleted ? 'bg-emerald-50/30' : ''}`}>
                            <CardContent className="p-4 flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                                isCompleted ? 'bg-emerald-100 text-emerald-700' : 
                                media.type === 'video' ? 'bg-blue-100 text-blue-600' :
                                media.type === 'document' ? 'bg-red-100 text-red-600' :
                                media.type === 'audio' ? 'bg-purple-100 text-purple-600' :
                                'bg-muted text-muted-foreground'
                              }`}>
                                {isCompleted ? (
                                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                ) : media.type === 'video' ? (
                                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /></svg>
                                ) : media.type === 'document' ? (
                                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                ) : media.type === 'audio' ? (
                                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
                                ) : (
                                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-lg font-bold text-foreground truncate group-hover:text-amber-700 transition-colors">{media.title}</h4>
                                <div className="flex gap-4 text-xs text-muted-foreground mt-1 uppercase tracking-wide">
                                  {media.fileExtension || media.type}
                                </div>
                              </div>
                              <div className="shrink-0 text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Legacy Lessons display if they exist */}
            {legacyLessons.length > 0 && (
              <div className="space-y-3 mt-8">
                 <h3 className="font-semibold text-lg text-foreground border-b pb-2 flex items-center gap-2">
                    <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    Legacy Lessons
                 </h3>
                 <div className="grid gap-3">
                    {legacyLessons.map(lesson => (
                      <Link key={lesson.lessonId} href={`/dashboard/student/courses/${courseId}/lessons/${lesson.lessonId}`} className="group">
                        <Card className="hover:border-amber-500 transition-colors cursor-pointer group-hover:shadow-md">
                          <CardContent className="p-4 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 bg-muted group-hover:bg-amber-100 group-hover:text-amber-700 text-muted-foreground font-bold">
                              {lesson.order}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-lg font-bold text-foreground truncate group-hover:text-amber-700 transition-colors">{lesson.title}</h4>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                 </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tests Section */}
      <div className="space-y-6 pt-6 border-t">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Assessments</h2>
          <p className="text-muted-foreground">Test your knowledge with these MCQ tests.</p>
        </div>

        {tests.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground italic">
            No tests available for this course yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tests.map((test) => (
              <Card key={test.testId} className="hover:border-amber-500 transition-colors">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-foreground">{test.title}</h3>
                    <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-1 rounded">
                      {test.durationMinutes} min
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{test.description}</p>
                  <Link 
                    href={`/dashboard/student/courses/${courseId}/tests/${test.testId}`} 
                    className={buttonVariants({ variant: "outline", className: "w-full border-amber-200 text-amber-700 hover:bg-amber-50" })}
                  >
                    View Details
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
