import { db } from '@/lib/firebase/firebase';
import { collection, addDoc, serverTimestamp, doc, setDoc, updateDoc, increment, getDoc, Timestamp } from 'firebase/firestore';
import { UAParser } from 'ua-parser-js';

export type TimelineEventType = 
  | 'LOGIN' 
  | 'LOGOUT' 
  | 'COURSE_OPENED'
  | 'LESSON_OPENED'
  | 'LESSON_COMPLETED'
  | 'STUDY_MATERIAL_VIEWED'
  | 'STUDY_MATERIAL_DOWNLOADED'
  | 'VIDEO_STARTED'
  | 'VIDEO_PAUSED'
  | 'VIDEO_RESUMED'
  | 'VIDEO_COMPLETED'
  | 'VIDEO_SPEED_CHANGED'
  | 'TEST_STARTED' 
  | 'TEST_SUBMIT' 
  | 'TEST_ASSIGNED' 
  | 'TEST_OPENED' 
  | 'TEST_PAUSED' 
  | 'TEST_LOCKED' 
  | 'TEST_REOPENED' 
  | 'TEST_EXPIRED' 
  | 'ASSIGNMENT_OPENED'
  | 'ASSIGNMENT_SUBMIT' 
  | 'COURSE_ENROLL';

export interface TelemetryEvent {
  studentId: string;
  type: TimelineEventType;
  details: string;
  metadata?: any;
}

export const Telemetry = {
  /**
   * 1. STUDENT TIMELINE SYSTEM
   */
  async logTimelineEvent(event: TelemetryEvent) {
    try {
      if (!event.studentId) return;
      await addDoc(collection(db, 'studentTimeline'), {
        ...event,
        timestamp: serverTimestamp(),
      });
    } catch (e) {
      console.error("Telemetry error:", e);
    }
  },

  /**
   * 2. LOGIN HISTORY & 3. LEARNING SESSION TRACKING
   */
  async logSessionStart(studentId: string) {
    try {
      if (!studentId) return null;
      
      let device = 'Unknown';
      let os = 'Unknown';
      let browser = 'Unknown';

      if (typeof window !== 'undefined') {
        const parser = new UAParser(window.navigator.userAgent);
        const result = parser.getResult();
        device = result.device.type === 'mobile' ? 'Mobile' : result.device.type === 'tablet' ? 'Tablet' : 'Desktop';
        os = result.os.name || 'Unknown';
        browser = result.browser.name || 'Unknown';
      }

      const now = new Date();
      const loginDateStr = now.toISOString().split('T')[0];

      // Record in loginHistory
      const loginRef = await addDoc(collection(db, 'loginHistory'), {
        studentId,
        loginTime: serverTimestamp(),
        loginDate: loginDateStr,
        deviceType: device,
        os,
        browser,
        sessionDuration: 0
      });

      // Record in learningSessions
      const sessionRef = await addDoc(collection(db, 'learningSessions'), {
        studentId,
        loginHistoryId: loginRef.id,
        sessionStart: serverTimestamp(),
        duration: 0,
        isActive: true
      });

      // Update studentAnalytics aggregate
      await setDoc(doc(db, 'studentAnalytics', studentId), {
        loginFrequency: increment(1),
        lastActivity: serverTimestamp()
      }, { merge: true });

      await this.logTimelineEvent({
        studentId,
        type: 'LOGIN',
        details: `Logged in from ${device} (${browser} on ${os})`,
        metadata: { sessionId: sessionRef.id }
      });

      return { sessionId: sessionRef.id, loginHistoryId: loginRef.id };
    } catch (e) {
      console.error("Session start error:", e);
      return null;
    }
  },

  async logSessionEnd(studentId: string, sessionId: string, loginHistoryId?: string) {
    try {
      if (!studentId || !sessionId) return;
      
      const sessionRef = doc(db, 'learningSessions', sessionId);
      const sessionDoc = await getDoc(sessionRef);
      
      if (sessionDoc.exists()) {
        const data = sessionDoc.data();
        if (!data.isActive) return;

        const startTime = data.sessionStart?.toDate();
        const endTime = new Date();
        const durationSeconds = startTime ? Math.floor((endTime.getTime() - startTime.getTime()) / 1000) : 0;

        await updateDoc(sessionRef, {
          sessionEnd: serverTimestamp(),
          duration: durationSeconds,
          isActive: false
        });

        if (loginHistoryId) {
          await updateDoc(doc(db, 'loginHistory', loginHistoryId), {
            logoutTime: serverTimestamp(),
            sessionDuration: durationSeconds
          });
        }

        // Add to aggregate learning time
        if (durationSeconds > 0) {
          await setDoc(doc(db, 'studentAnalytics', studentId), {
            totalLearningTime: increment(durationSeconds)
          }, { merge: true });
        }
      }

      await this.logTimelineEvent({
        studentId,
        type: 'LOGOUT',
        details: `Logged out.`,
        metadata: { sessionId }
      });

    } catch (e) {
      console.error("Session end error:", e);
    }
  },

  /**
   * 1. VIDEO ANALYTICS SYSTEM
   */
  async logVideoEvent(
    studentId: string, 
    courseId: string, 
    lessonId: string, 
    action: 'STARTED' | 'PAUSED' | 'RESUMED' | 'COMPLETED' | 'SPEED_CHANGED' | 'SEEK_FORWARD' | 'SEEK_BACKWARD',
    stats: { 
      watchDuration?: number, 
      watchPercentage?: number, 
      skippedDuration?: number, 
      playbackSpeed?: number,
      pictureInPicture?: boolean,
      fullscreen?: boolean,
      lastWatchedPosition?: number
    }
  ) {
    try {
      if (!studentId || !lessonId) return;
      const refId = `${studentId}_${lessonId}`;
      
      await setDoc(doc(db, 'videoAnalytics', refId), {
        studentId,
        courseId,
        lessonId,
        timestamp: serverTimestamp(),
        completionStatus: action === 'COMPLETED' ? 'COMPLETED' : 'IN_PROGRESS',
        ...stats
      }, { merge: true });

      // Only timeline significant events
      if (action === 'STARTED' || action === 'COMPLETED') {
        await this.logTimelineEvent({
          studentId,
          type: action === 'STARTED' ? 'VIDEO_STARTED' : 'VIDEO_COMPLETED',
          details: `${action === 'STARTED' ? 'Started' : 'Completed'} watching a video.`,
          metadata: { lessonId, courseId }
        });
      }

      // Update student activity
      await setDoc(doc(db, 'studentAnalytics', studentId), {
        lastActivity: serverTimestamp()
      }, { merge: true });

    } catch (e) {
      console.error("Video telemetry error:", e);
    }
  },

  /**
   * Course & Lesson Activity
   */
  async logCourseAction(studentId: string, courseId: string, action: 'COURSE_OPENED' | 'LESSON_OPENED' | 'LESSON_COMPLETED', itemName: string, lessonId?: string) {
    try {
      if (!studentId) return;

      if (action === 'LESSON_OPENED' && lessonId) {
        // Track in learning sessions if we have an active one? 
        // We'll just update last activity
        await setDoc(doc(db, 'studentAnalytics', studentId), {
          lastActivity: serverTimestamp()
        }, { merge: true });
      }

      if (action === 'LESSON_COMPLETED') {
        await setDoc(doc(db, 'studentAnalytics', studentId), {
          totalLessonsCompleted: increment(1)
        }, { merge: true });
      }

      await this.logTimelineEvent({
        studentId,
        type: action as TimelineEventType,
        details: `${action.replace('_', ' ')}: ${itemName}`,
        metadata: { courseId, lessonId }
      });

    } catch (e) {
      console.error("Course telemetry error:", e);
    }
  },

  /**
   * 6. TEST INTEGRITY MONITORING
   */
  async logTestViolation(studentId: string, testId: string, violationType: string) {
    try {
      if (!studentId || !testId) return;
      
      await addDoc(collection(db, 'testViolations'), {
        studentId,
        testId,
        violationType,
        timestamp: serverTimestamp()
      });

      await setDoc(doc(db, 'studentAnalytics', studentId), {
        lastActivity: serverTimestamp()
      }, { merge: true });

    } catch (e) {
      console.error("Test violation logging error:", e);
    }
  },

  /**
   * 10. MISSED TEST & ASSIGNMENT ANALYTICS
   */
  async logMissedTest(studentId: string, testId: string, courseId: string, dueDate: Date) {
    try {
      await setDoc(doc(db, 'missedTests', `${studentId}_${testId}`), {
        studentId,
        testId,
        courseId,
        dueDate: Timestamp.fromDate(dueDate),
        missedStatus: true,
        recordedAt: serverTimestamp()
      }, { merge: true });
    } catch (e) {
      console.error("Missed test logging error", e);
    }
  },

  async logAssignmentAction(studentId: string, courseId: string, assignmentId: string, action: 'ASSIGNMENT_OPENED' | 'ASSIGNMENT_SUBMIT', assignmentTitle: string) {
    try {
      if (!studentId) return;

      if (action === 'ASSIGNMENT_SUBMIT') {
        await setDoc(doc(db, 'assignmentTracking', `${studentId}_${assignmentId}`), {
          studentId,
          courseId,
          assignmentId,
          submissionDate: serverTimestamp(),
          status: 'submitted'
        }, { merge: true });

        await setDoc(doc(db, 'studentAnalytics', studentId), {
          totalAssignmentsSubmitted: increment(1)
        }, { merge: true });
      }

      await this.logTimelineEvent({
        studentId,
        type: action as TimelineEventType,
        details: `${action.replace('_', ' ')}: ${assignmentTitle}`,
        metadata: { courseId, assignmentId }
      });

    } catch (e) {
      console.error("Assignment telemetry error:", e);
    }
  }
};
