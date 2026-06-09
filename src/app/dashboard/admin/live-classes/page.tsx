'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/firebase';
import { collection, query, getDocs, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Course } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

interface LiveClassSession {
  id: string; // courseId
  courseId: string;
  courseTitle: string;
  roomName: string;
  startedAt: number;
  status: 'live';
}

export default function AdminLiveClassesPage() {
  const { appUser } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [activeSessions, setActiveSessions] = useState<LiveClassSession[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State for the currently joined Jitsi room in the admin view
  const [joinedRoom, setJoinedRoom] = useState<LiveClassSession | null>(null);

  useEffect(() => {
    fetchCourses();
    
    // Listen for active live sessions
    const unsubscribe = onSnapshot(collection(db, 'live_classes'), (snapshot) => {
      const sessions: LiveClassSession[] = [];
      snapshot.forEach(doc => {
        sessions.push({ id: doc.id, ...doc.data() } as LiveClassSession);
      });
      setActiveSessions(sessions);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const fetchCourses = async () => {
    try {
      const coursesSnap = await getDocs(collection(db, 'courses'));
      const courseData: Course[] = [];
      coursesSnap.forEach(doc => {
        courseData.push({ courseId: doc.id, ...doc.data() } as unknown as Course);
      });
      setCourses(courseData);
    } catch (error) {
      console.error("Error fetching courses:", error);
    }
  };

  const startLiveClass = async (course: Course) => {
    const cid = course.courseId || course.title; // fallback
    const roomName = `RaviClasses_${cid}_${Math.random().toString(36).substring(7)}`;
    const session: LiveClassSession = {
      id: cid,
      courseId: cid,
      courseTitle: course.title,
      roomName: roomName,
      startedAt: Date.now(),
      status: 'live'
    };

    try {
      await setDoc(doc(db, 'live_classes', cid), session);
      setJoinedRoom(session);
    } catch (error) {
      console.error("Error starting live class:", error);
      alert("Failed to start live class.");
    }
  };

  const endLiveClass = async (courseId: string) => {
    if (!confirm("Are you sure you want to end this live class for everyone?")) return;
    try {
      await deleteDoc(doc(db, 'live_classes', courseId));
      if (joinedRoom?.courseId === courseId) {
        setJoinedRoom(null);
      }
    } catch (error) {
      console.error("Error ending live class:", error);
      alert("Failed to end live class.");
    }
  };

  const joinExistingClass = (session: LiveClassSession) => {
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
            <p className="text-slate-400 text-xs">Students enrolled in this course can now join this room.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800" onClick={leaveRoom}>
              Leave Room (Keep Live)
            </Button>
            <Button variant="destructive" onClick={() => endLiveClass(joinedRoom.courseId)}>
              End Live Class
            </Button>
          </div>
        </div>
        <div className="flex-1 bg-black">
          <iframe
            src={`https://meet.jit.si/${joinedRoom.roomName}#userInfo.displayName="Admin%20(${appUser?.name})"`}
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
          <p className="text-slate-500 mt-1">Host native WebRTC live video sessions directly within the LMS.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map(course => {
          const cid = course.courseId || course.title;
          const activeSession = activeSessions.find(s => s.courseId === cid);
          
          return (
            <Card key={cid} className={`overflow-hidden transition-all ${activeSession ? 'border-red-500 shadow-md shadow-red-100' : 'hover:shadow-md'}`}>
              <CardHeader className={`pb-3 ${activeSession ? 'bg-red-50' : 'bg-slate-50'}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{course.title}</CardTitle>
                    <CardDescription className="line-clamp-1">{course.description || 'No description'}</CardDescription>
                  </div>
                  {activeSession && (
                    <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded-full uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span>
                      Live
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                  <span>Open Course</span>
                </div>
                
                <div className="pt-2">
                  {activeSession ? (
                    <div className="flex gap-2">
                      <Button className="w-full bg-red-600 hover:bg-red-700 text-white" onClick={() => joinExistingClass(activeSession)}>
                        Rejoin Room
                      </Button>
                      <Button variant="outline" className="text-red-600 hover:bg-red-50" onClick={() => endLiveClass(cid)}>
                        End
                      </Button>
                    </div>
                  ) : (
                    <Button className="w-full bg-indigo-600 hover:bg-indigo-700" onClick={() => startLiveClass(course)}>
                      <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                      Start Live Class
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {courses.length === 0 && !loading && (
          <div className="col-span-full py-12 text-center border-2 border-dashed rounded-lg bg-slate-50 text-slate-500">
            <p>No courses available to host live classes for.</p>
          </div>
        )}
      </div>
    </div>
  );
}
