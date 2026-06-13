import { db } from '@/lib/firebase/firebase';
import { collection, addDoc, serverTimestamp, doc, setDoc, updateDoc, increment, getDoc } from 'firebase/firestore';
import { UAParser } from 'ua-parser-js';

export type TimelineEventType = 
  | 'LOGIN' 
  | 'LOGOUT' 
  | 'COURSE_OPENED'
  | 'LESSON_OPENED'
  | 'LESSON_COMPLETED'
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
   * Log an event to the student's global timeline
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
   * Activity Logs (Detailed component-level logging)
   */
  async logActivity(studentId: string, type: string, targetId: string, targetName: string, additionalData: any = {}) {
    try {
      if (!studentId) return;
      await addDoc(collection(db, 'activityLogs'), {
        studentId,
        type,
        targetId,
        targetName,
        ...additionalData,
        timestamp: serverTimestamp(),
      });
    } catch (e) {
      console.error("Activity logging error:", e);
    }
  },

  /**
   * Log a new learning session (login) and record device data
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

      // Record in loginHistory
      await addDoc(collection(db, 'loginHistory'), {
        studentId,
        loginTime: serverTimestamp(),
        device,
        os,
        browser,
      });

      // Record in learningSessions
      const sessionRef = await addDoc(collection(db, 'learningSessions'), {
        studentId,
        startTime: serverTimestamp(),
        device,
        os,
        browser,
        isActive: true
      });

      // Update studentAnalytics aggregate
      await setDoc(doc(db, 'studentAnalytics', studentId), {
        totalLogins: increment(1),
        lastLoginAt: serverTimestamp()
      }, { merge: true });

      await this.logTimelineEvent({
        studentId,
        type: 'LOGIN',
        details: `Logged in from ${device} (${browser} on ${os})`,
        metadata: { sessionId: sessionRef.id }
      });

      return sessionRef.id;
    } catch (e) {
      console.error("Session start error:", e);
      return null;
    }
  },

  /**
   * Log session end (logout or beforeunload)
   */
  async logSessionEnd(studentId: string, sessionId: string) {
    try {
      if (!studentId || !sessionId) return;
      
      const sessionRef = doc(db, 'learningSessions', sessionId);
      const sessionDoc = await getDoc(sessionRef);
      
      if (sessionDoc.exists()) {
        const data = sessionDoc.data();
        if (!data.isActive) return; // already closed

        const startTime = data.startTime?.toDate();
        const endTime = new Date();
        const durationSeconds = startTime ? Math.floor((endTime.getTime() - startTime.getTime()) / 1000) : 0;

        await updateDoc(sessionRef, {
          endTime: serverTimestamp(),
          durationSeconds,
          isActive: false
        });

        // Add to total learning time in analytics
        if (durationSeconds > 0) {
          await setDoc(doc(db, 'studentAnalytics', studentId), {
            totalLearningTimeSeconds: increment(durationSeconds)
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
   * Log Video Activity
   */
  async logVideoEvent(
    studentId: string, 
    courseId: string, 
    videoId: string, 
    action: 'STARTED' | 'PAUSED' | 'RESUMED' | 'COMPLETED' | 'SPEED_CHANGED',
    stats: { watchPercentage?: number, watchDurationSeconds?: number, skippedDurationSeconds?: number, playbackSpeed?: number }
  ) {
    try {
      if (!studentId || !videoId) return;
      const refId = `${studentId}_${videoId}`;
      
      // We will constantly merge updates so videoAnalytics holds the latest state
      await setDoc(doc(db, 'videoAnalytics', refId), {
        studentId,
        courseId,
        videoId,
        lastAction: action,
        lastActionTime: serverTimestamp(),
        ...stats
      }, { merge: true });

      // We only log critical events to the timeline to avoid spam
      if (action === 'STARTED') {
        await this.logTimelineEvent({
          studentId,
          type: 'VIDEO_STARTED',
          details: `Started watching a video.`,
          metadata: { videoId, courseId }
        });
      } else if (action === 'COMPLETED') {
        await this.logTimelineEvent({
          studentId,
          type: 'VIDEO_COMPLETED',
          details: `Completed watching a video.`,
          metadata: { videoId, courseId }
        });
        
        // Update analytics
        await setDoc(doc(db, 'studentAnalytics', studentId), {
          completedVideos: increment(1)
        }, { merge: true });
      }

      // Detailed activity log
      await this.logActivity(studentId, `VIDEO_${action}`, videoId, 'Video', stats);

    } catch (e) {
      console.error("Video telemetry error:", e);
    }
  },

  /**
   * Log Course Activity
   */
  async logCourseAction(studentId: string, courseId: string, action: 'COURSE_OPENED' | 'LESSON_OPENED' | 'LESSON_COMPLETED', itemName: string) {
    try {
      if (!studentId) return;

      await this.logActivity(studentId, action, courseId, itemName);

      await this.logTimelineEvent({
        studentId,
        type: action as TimelineEventType,
        details: `${action.replace('_', ' ')}: ${itemName}`,
        metadata: { courseId }
      });

    } catch (e) {
      console.error("Course telemetry error:", e);
    }
  },

  /**
   * Log Assignment Activity
   */
  async logAssignmentAction(studentId: string, courseId: string, assignmentId: string, action: 'ASSIGNMENT_OPENED' | 'ASSIGNMENT_SUBMIT', assignmentTitle: string) {
    try {
      if (!studentId) return;

      if (action === 'ASSIGNMENT_SUBMIT') {
        await addDoc(collection(db, 'assignmentTracking'), {
          studentId,
          courseId,
          assignmentId,
          submittedAt: serverTimestamp(),
          status: 'submitted'
        });
      }

      await this.logActivity(studentId, action, assignmentId, assignmentTitle);

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
