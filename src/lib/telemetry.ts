import { db } from '@/lib/firebase/firebase';
import { collection, addDoc, serverTimestamp, doc, setDoc } from 'firebase/firestore';
import { UAParser } from 'ua-parser-js';

export type TimelineEventType = 'LOGIN' | 'LOGOUT' | 'VIDEO_WATCH' | 'VIDEO_SKIP' | 'PDF_VIEW' | 'TEST_SUBMIT' | 'ASSIGNMENT_SUBMIT' | 'COURSE_ENROLL';

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
   * Log a new learning session (login) and record device data
   */
  async logSessionStart(studentId: string) {
    try {
      if (!studentId) return;
      
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

      const sessionRef = await addDoc(collection(db, 'learningSessions'), {
        studentId,
        startTime: serverTimestamp(),
        device,
        os,
        browser,
      });

      await this.logTimelineEvent({
        studentId,
        type: 'LOGIN',
        details: `Logged in from ${device} (${os})`,
        metadata: { sessionId: sessionRef.id }
      });

      return sessionRef.id;
    } catch (e) {
      console.error("Session start error:", e);
      return null;
    }
  },

  /**
   * Log video playback metrics
   */
  async logVideoMetrics(studentId: string, courseId: string, videoId: string, watchTimeSeconds: number, skipEvents: {from: number, to: number}[]) {
    try {
      if (!studentId || !videoId) return;
      const refId = `${studentId}_${videoId}`;
      await setDoc(doc(db, 'videoAnalytics', refId), {
        studentId,
        courseId,
        videoId,
        totalWatchTimeSeconds: watchTimeSeconds,
        skipEvents,
        lastWatched: serverTimestamp(),
      }, { merge: true }); // Merge to update instead of overwrite entirely
      
      if (watchTimeSeconds > 10) {
        await this.logTimelineEvent({
          studentId,
          type: 'VIDEO_WATCH',
          details: `Watched video for ${Math.round(watchTimeSeconds / 60)} minutes`,
          metadata: { videoId, courseId }
        });
      }
      
      if (skipEvents.length > 0) {
        await this.logTimelineEvent({
          studentId,
          type: 'VIDEO_SKIP',
          details: `Skipped sections in video ${skipEvents.length} times`,
          metadata: { videoId, skipEvents }
        });
      }
    } catch (e) {
      console.error("Video metrics error:", e);
    }
  }
};
