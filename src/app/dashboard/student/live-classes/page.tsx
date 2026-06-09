'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/firebase';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Course } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

interface LiveClassSession {
  id: string; // courseId
  courseId: string;
  courseTitle: string;
  roomName: string;
  startedAt: number;
  status: 'live';
}

export default function StudentLiveClassesPage() {
  const { appUser } = useAuth();
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const [activeSessions, setActiveSessions] = useState<LiveClassSession[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State for the currently joined Jitsi room
  const [joinedRoom, setJoinedRoom] = useState<LiveClassSession | null>(null);

  useEffect(() => {
    if (appUser?.uid) {
      fetchEnrolledCourses();
      
      // Listen for active live sessions across the platform
      const unsubscribe = onSnapshot(collection(db, 'live_classes'), (snapshot) => {
        const sessions: LiveClassSession[] = [];
        snapshot.forEach(doc => {
          sessions.push({ id: doc.id, ...doc.data() } as LiveClassSession);
        });
        setActiveSessions(sessions);
      });

      return () => unsubscribe();
    }
  }, [appUser]);

  const fetchEnrolledCourses = async () => {
    try {
      const enrollQuery = query(collection(db, 'enrollments'), where('studentId', '==', appUser!.uid));
      const enrollSnap = await getDocs(enrollQuery);
      const enrolledCourseIds = new Set<string>();
      enrollSnap.forEach(doc => enrolledCourseIds.add(doc.data().courseId));

      if (enrolledCourseIds.size === 0) {
        setLoading(false);
        return;
      }

      const coursesSnap = await getDocs(collection(db, 'courses'));
      const courseData: Course[] = [];
      coursesSnap.forEach(doc => {
        if (enrolledCourseIds.has(doc.id)) {
          courseData.push({ courseId: doc.id, ...doc.data() } as unknown as Course);
        }
      });
      setEnrolledCourses(courseData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching enrolled courses:", error);
      setLoading(false);
    }
  };

  const joinLiveClass = (session: LiveClassSession) => {
    setJoinedRoom(session);
  };

  const leaveRoom = () => {
    setJoinedRoom(null);
  };

  if (joinedRoom) {
    return (
      <div className="flex flex-col h-[85vh] bg-slate-900 rounded-xl overflow-hidden shadow-2xl border border-slate-800">
        <div className="flex justify-between items-center p-4 bg-slate-950 border-b border-slate-800">
          <div>
            <h2 className="text-white font-bold text-lg flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
              LIVE: {joinedRoom.courseTitle}
            </h2>
            <p className="text-slate-400 text-xs">You are currently attending a live class.</p>
          </div>
          <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white" onClick={leaveRoom}>
            Leave Room
          </Button>
        </div>
        <div className="flex-1 bg-black">
          <iframe
            src={`https://meet.jit.si/${joinedRoom.roomName}#userInfo.displayName="${appUser?.name || 'Student'}"`}
            allow="camera; microphone; fullscreen; display-capture; autoplay"
            className="w-full h-full border-0"
          ></iframe>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Live Classes</h1>
          <p className="text-slate-500 mt-1">Join live interactive sessions for your enrolled courses.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {enrolledCourses.map(course => {
          const cid = course.courseId || course.title;
          const activeSession = activeSessions.find(s => s.courseId === cid);
          
          return (
            <Card key={cid} className={`overflow-hidden transition-all ${activeSession ? 'border-amber-500 shadow-md shadow-amber-100 ring-2 ring-amber-500/50' : 'hover:shadow-md border-slate-200'}`}>
              <CardHeader className={`pb-3 ${activeSession ? 'bg-amber-50' : 'bg-slate-50'}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{course.title}</CardTitle>
                    <CardDescription className="line-clamp-1">{course.description || 'No description'}</CardDescription>
                  </div>
                  {activeSession && (
                    <span className="flex items-center gap-1 text-xs font-bold text-white bg-red-600 px-2 py-1 rounded-full uppercase tracking-wider animate-pulse shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                      Live Now
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  <span>{activeSession ? 'Class is currently in session' : 'No active sessions right now'}</span>
                </div>
                
                <div className="pt-2">
                  {activeSession ? (
                    <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white shadow-md transition-all hover:-translate-y-0.5" onClick={() => joinLiveClass(activeSession)}>
                      <svg className="w-5 h-5 mr-2 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      Join Live Class Now
                    </Button>
                  ) : (
                    <Button variant="outline" className="w-full text-slate-400 border-slate-200 cursor-not-allowed" disabled>
                      Waiting for teacher...
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {enrolledCourses.length === 0 && !loading && (
          <div className="col-span-full py-16 text-center border-2 border-dashed rounded-lg bg-slate-50 text-slate-500">
            <svg className="w-12 h-12 mx-auto text-slate-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            <h3 className="text-lg font-medium text-slate-900 mb-1">No Enrolled Courses</h3>
            <p>You need to be enrolled in a course to access its live classes.</p>
            <Link href="/dashboard/student/courses" className="text-amber-600 hover:underline mt-4 inline-block">Browse Available Courses</Link>
          </div>
        )}
      </div>
    </div>
  );
}
