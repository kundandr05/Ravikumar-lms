'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase/firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Announcement, Course, Lesson, Test, Assignment, TestAttempt, LessonProgress, TeacherRecommendation, StudentBookmark, StudentNote } from '@/types';
import Link from 'next/link';

interface DashboardData {
  enrolledCourses: Course[];
  completedLessons: string[];
  nextLessons: Lesson[];
  recommendations: TeacherRecommendation[];
  upcomingTests: Test[];
  upcomingAssignments: Assignment[];
  testAttempts: TestAttempt[];
  bookmarks: StudentBookmark[];
  notes: StudentNote[];
}

export default function StudentDashboard() {
  const { appUser, user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  // Helper mappings
  const [lessonMap, setLessonMap] = useState<Record<string, Lesson>>({});
  const [testMap, setTestMap] = useState<Record<string, Test>>({});
  const [courseMap, setCourseMap] = useState<Record<string, Course>>({});

  useEffect(() => {
    async function fetchStudentData() {
      if (!appUser?.uid) return;

      try {
        // 1. Fetch Enrollments
        const enrollSnap = await getDocs(query(collection(db, 'enrollments'), where('studentId', '==', appUser.uid)));
        const enrolledCourseIds = enrollSnap.docs.map(d => d.data().courseId);

        if (enrolledCourseIds.length === 0) {
          setData({ enrolledCourses: [], completedLessons: [], nextLessons: [], recommendations: [], upcomingTests: [], upcomingAssignments: [], testAttempts: [], bookmarks: [], notes: [] });
          setLoading(false);
          return;
        }

        // 2. Fetch Courses
        const coursesSnap = await getDocs(collection(db, 'courses'));
        const allCourses: Course[] = [];
        const cMap: Record<string, Course> = {};
        coursesSnap.forEach(d => {
          if (enrolledCourseIds.includes(d.id)) {
            const c = { courseId: d.id, ...d.data() } as Course;
            allCourses.push(c);
            cMap[d.id] = c;
          }
        });
        setCourseMap(cMap);
        const enrolledCourses = allCourses;

        // 3. Fetch Lesson Progress & Test Attempts
        const [progressSnap, attemptsSnap] = await Promise.all([
          getDocs(query(collection(db, 'lessonProgress'), where('studentId', '==', appUser.uid))),
          getDocs(query(collection(db, 'testAttempts'), where('studentId', '==', appUser.uid)))
        ]);
        
        const completedLessons = progressSnap.docs.filter(d => d.data().completed).map(d => d.data().lessonId);
        const testAttempts = attemptsSnap.docs.map(d => ({ attemptId: d.id, ...d.data() } as TestAttempt));

        // 4. Fetch Lessons & Find "Next Lessons"
        const lessonsSnap = await getDocs(collection(db, 'lessons'));
        const allLessons: Lesson[] = [];
        const lMap: Record<string, Lesson> = {};
        lessonsSnap.forEach(d => {
          const data = d.data();
          if (enrolledCourseIds.includes(data.courseId)) {
            const l = { lessonId: d.id, ...data } as Lesson;
            allLessons.push(l);
            lMap[d.id] = l;
          }
        });
        setLessonMap(lMap);

        const nextLessons: Lesson[] = [];
        enrolledCourseIds.forEach(cId => {
          const courseLessons = allLessons.filter(l => l.courseId === cId).sort((a, b) => a.order - b.order);
          const next = courseLessons.find(l => !completedLessons.includes(l.lessonId!));
          if (next) nextLessons.push(next);
          else if (courseLessons.length > 0) nextLessons.push(courseLessons[0]); // fallback to first
        });

        // 5. Fetch Upcoming Tests & Assignments
        const [testsSnap, assignSnap] = await Promise.all([
          getDocs(collection(db, 'tests')),
          getDocs(collection(db, 'assignments'))
        ]);
        
        const upcomingTests: Test[] = [];
        const tMap: Record<string, Test> = {};
        const now = new Date();
        
        testsSnap.forEach(d => {
          const t = { testId: d.id, ...d.data() } as Test;
          tMap[d.id] = t;
          if (enrolledCourseIds.includes(t.courseId)) {
            if (t.availableFrom && t.availableFrom.toDate() > now) upcomingTests.push(t);
            else if (t.availableUntil && t.availableUntil.toDate() > now && !testAttempts.find(a => a.testId === t.testId)) upcomingTests.push(t);
          }
        });
        setTestMap(tMap);

        const upcomingAssignments: Assignment[] = [];
        assignSnap.forEach(d => {
          const a = { assignmentId: d.id, ...d.data() } as Assignment;
          if (enrolledCourseIds.includes(a.courseId) && a.dueDate && a.dueDate.toDate() > now) {
            upcomingAssignments.push(a);
          }
        });

        // 6. Fetch Teacher Recommendations
        const recSnap = await getDocs(collection(db, 'teacherRecommendations'));
        const recommendations: TeacherRecommendation[] = [];
        recSnap.forEach(d => {
          const r = { id: d.id, ...d.data() } as TeacherRecommendation;
          if (r.targetType === 'student' && r.targetId === appUser.uid) recommendations.push(r);
          else if (r.targetType === 'course' && enrolledCourseIds.includes(r.targetId)) recommendations.push(r);
        });

        // 7. Fetch Notes & Bookmarks
        const [notesSnap, bookmarksSnap] = await Promise.all([
          getDocs(query(collection(db, 'studentNotes'), where('studentId', '==', appUser.uid))),
          getDocs(query(collection(db, 'studentBookmarks'), where('studentId', '==', appUser.uid)))
        ]);
        const notes = notesSnap.docs.map(d => ({ id: d.id, ...d.data() } as StudentNote));
        const bookmarks = bookmarksSnap.docs.map(d => ({ id: d.id, ...d.data() } as StudentBookmark));

        // Set Dashboard Data
        setData({
          enrolledCourses,
          completedLessons,
          nextLessons,
          recommendations,
          upcomingTests,
          upcomingAssignments,
          testAttempts,
          bookmarks,
          notes
        });

      } catch (error) {
        console.error("Error fetching student dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchStudentData();
  }, [appUser]);

  if (!appUser) return null;

  // Analytics Math
  const totalEnrolled = data?.enrolledCourses.length || 0;
  const totalTestsTaken = data?.testAttempts.length || 0;
  const avgScore = totalTestsTaken > 0 ? Math.round(data!.testAttempts.reduce((acc, curr) => acc + (curr.scorePercentage || 0), 0) / totalTestsTaken) : 0;

  // Rule-based Auto Suggestions
  const getAutoSuggestions = () => {
    if (!data) return [];
    const suggestions = [];
    
    // Sort attempts by recent
    const sortedAttempts = [...data.testAttempts].sort((a, b) => b.submittedAt?.toMillis() - a.submittedAt?.toMillis());
    const latestAttempt = sortedAttempts.length > 0 ? sortedAttempts[0] : null;

    if (latestAttempt) {
      const score = latestAttempt.scorePercentage || 0;
      const testName = testMap[latestAttempt.testId]?.title || 'Recent Test';
      
      if (score >= 80) {
        suggestions.push({ type: 'auto', title: 'Great Job!', message: `You scored ${score}% on ${testName}. You're ready to tackle the next lesson!` });
      } else if (score >= 50 && score < 80) {
        suggestions.push({ type: 'auto', title: 'Needs Revision', message: `You scored ${score}% on ${testName}. Consider reviewing your notes before moving on.` });
      } else {
        suggestions.push({ type: 'auto', title: 'Rewatch Recommended', message: `You scored ${score}% on ${testName}. We highly recommend rewatching the corresponding lesson and attempting the test again.` });
      }
    }

    return suggestions;
  };

  const autoSuggestions = getAutoSuggestions();

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground">Welcome back, {appUser.name?.split(' ')[0] || 'Student'}!</h1>
        <p className="text-muted-foreground mt-2">Here is your personalized learning path. What will you do next?</p>
      </div>

      {loading || !data ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i}><CardHeader><Skeleton className="h-4 w-1/2" /></CardHeader><CardContent><Skeleton className="h-10 w-1/3" /></CardContent></Card>
          ))}
        </div>
      ) : data.enrolledCourses.length === 0 ? (
        <Card className="text-center py-12 bg-muted/50 border-dashed border-2">
          <CardContent className="space-y-4">
            <h3 className="text-xl font-bold text-foreground">No Courses Yet</h3>
            <p className="text-muted-foreground">Enroll in a course to start your learning journey!</p>
            <Link href="/courses" className={buttonVariants({ variant: "default" })}>Explore Courses</Link>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Top Row: My Progress Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-t-4 border-t-blue-500"><CardContent className="p-4"><p className="text-sm font-medium text-muted-foreground">Enrolled</p><p className="text-2xl font-black">{totalEnrolled}</p></CardContent></Card>
            <Card className="border-t-4 border-t-amber-500"><CardContent className="p-4"><p className="text-sm font-medium text-muted-foreground">Lessons Done</p><p className="text-2xl font-black">{data.completedLessons.length}</p></CardContent></Card>
            <Card className="border-t-4 border-t-emerald-500"><CardContent className="p-4"><p className="text-sm font-medium text-muted-foreground">Tests Taken</p><p className="text-2xl font-black">{totalTestsTaken}</p></CardContent></Card>
            <Card className="border-t-4 border-t-purple-500"><CardContent className="p-4"><p className="text-sm font-medium text-muted-foreground">Average Score</p><p className="text-2xl font-black">{avgScore}%</p></CardContent></Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column (Main Focus) */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* 1. Continue Learning */}
              <Card className="shadow-sm border-0 border-l-4 border-l-amber-500 bg-card">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Continue Learning
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {data.nextLessons.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {data.nextLessons.map(lesson => (
                        <div key={lesson.lessonId} className="p-4 rounded-xl bg-muted/50 border border-border flex flex-col justify-between hover:border-amber-500 transition-colors">
                          <div>
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{courseMap[lesson.courseId]?.title || 'Course'}</span>
                            <h4 className="font-bold text-foreground mt-1 line-clamp-1">{lesson.title}</h4>
                          </div>
                          <Link href={`/dashboard/student/courses/${lesson.courseId}/lessons/${lesson.lessonId}`} className={buttonVariants({ variant: "default", size: "sm", className: "mt-4 bg-amber-500 hover:bg-amber-600 text-white w-full" })}>
                            Play Lesson
                          </Link>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">You have completed all available lessons for your courses!</p>
                  )}
                </CardContent>
              </Card>

              {/* 2. Action Items (Teacher + Auto) */}
              <Card className="shadow-sm border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-xl">Action Items & Recommendations</CardTitle>
                  <CardDescription>What you should focus on next</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {data.recommendations.length === 0 && autoSuggestions.length === 0 ? (
                    <p className="text-muted-foreground italic p-4 bg-muted/30 rounded-md border text-center">No current action items. Keep following your course structure!</p>
                  ) : (
                    <div className="space-y-3">
                      {/* Teacher Recs */}
                      {data.recommendations.map(rec => (
                        <div key={rec.id} className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/10 border-l-4 border-l-blue-500 shadow-sm flex items-start gap-3">
                          <svg className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">TEACHER RECOMMENDATION</span>
                              <span className="text-xs font-semibold text-muted-foreground uppercase">{rec.itemType}</span>
                            </div>
                            <p className="text-foreground font-medium text-sm mt-1">"{rec.message}"</p>
                            {rec.dueDate && <p className="text-xs font-semibold text-red-600 mt-2">Due: {rec.dueDate.toDate ? rec.dueDate.toDate().toLocaleDateString() : 'Soon'}</p>}
                          </div>
                          <Link href={`/dashboard/student/courses`} className={buttonVariants({ variant: "outline", size: "sm", className: "shrink-0" })}>View</Link>
                        </div>
                      ))}

                      {/* Auto Rules */}
                      {autoSuggestions.map((sug, i) => (
                        <div key={i} className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/10 border-l-4 border-l-emerald-500 shadow-sm flex items-start gap-3">
                          <svg className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
                          <div>
                            <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full mb-1 inline-block">SYSTEM SUGGESTION</span>
                            <h4 className="font-bold text-foreground">{sug.title}</h4>
                            <p className="text-muted-foreground text-sm mt-1">{sug.message}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

            </div>

            {/* Right Column (Sidebar Widgets) */}
            <div className="space-y-8">
              
              {/* 3. Upcoming Activities */}
              <Card className="shadow-sm border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-lg">Upcoming Activities</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {data.upcomingTests.length === 0 && data.upcomingAssignments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No upcoming tests or assignments.</p>
                  ) : (
                    <div className="space-y-3">
                      {data.upcomingTests.map(test => (
                        <div key={test.testId} className="p-3 border rounded-lg bg-background flex items-center justify-between">
                          <div>
                            <p className="text-xs font-semibold text-purple-600 uppercase">Test</p>
                            <p className="font-medium text-sm text-foreground line-clamp-1">{test.title}</p>
                          </div>
                          <Link href={`/dashboard/student/tests`} className="text-xs bg-slate-900 text-white px-2 py-1 rounded">Start</Link>
                        </div>
                      ))}
                      {data.upcomingAssignments.map(assign => (
                        <div key={assign.assignmentId} className="p-3 border rounded-lg bg-background flex items-center justify-between">
                          <div>
                            <p className="text-xs font-semibold text-rose-600 uppercase">Assignment</p>
                            <p className="font-medium text-sm text-foreground line-clamp-1">{assign.title}</p>
                            {assign.dueDate && <p className="text-xs text-muted-foreground mt-0.5">Due: {assign.dueDate.toDate().toLocaleDateString()}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 5. Notes & Bookmarks */}
              <Card className="shadow-sm border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-lg">Notes & Bookmarks</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Bookmarked Lessons</h4>
                    {data.bookmarks.length === 0 ? <p className="text-xs text-muted-foreground">No bookmarks yet.</p> : (
                      <ul className="space-y-2">
                        {data.bookmarks.slice(0, 3).map(b => (
                          <li key={b.id} className="text-sm flex items-center gap-2">
                            <svg className="w-4 h-4 text-amber-500 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                            <Link href={`/dashboard/student/courses/${b.courseId}/lessons/${b.lessonId}`} className="text-primary hover:underline line-clamp-1">
                              {lessonMap[b.lessonId]?.title || 'Bookmarked Lesson'}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="pt-2 border-t">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Recent Notes</h4>
                    {data.notes.length === 0 ? <p className="text-xs text-muted-foreground">No notes saved.</p> : (
                      <ul className="space-y-3">
                        {data.notes.slice(0, 3).map(n => (
                          <li key={n.id} className="text-sm p-3 bg-muted/50 rounded-lg border">
                            <p className="text-xs font-semibold text-foreground mb-1 line-clamp-1">{lessonMap[n.lessonId]?.title || 'Lesson'}</p>
                            <p className="text-muted-foreground line-clamp-2 text-xs italic">"{n.text}"</p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </CardContent>
              </Card>

            </div>
          </div>
        </>
      )}
    </div>
  );
}
