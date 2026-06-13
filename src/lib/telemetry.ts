import { db } from '@/lib/firebase/firebase';
import { collection, addDoc, serverTimestamp, doc, setDoc, updateDoc, increment, getDoc, Timestamp } from 'firebase/firestore';
import { UAParser } from 'ua-parser-js';

export type TimelineEventType = 
  | 'LOGIN' 
  | 'LOGOUT' 
  | 'ENROLLMENT'
  | 'COURSE_OPENED'
  | 'LESSON_OPENED'
  | 'LESSON_COMPLETED'
  | 'TEST_STARTED' 
  | 'TEST_SUBMITTED' 
  | 'TEST_REOPENED'
  | 'TEST_LOCKED'
  | 'ASSIGNMENT_SUBMITTED';

export interface TelemetryEvent {
  studentId: string;
  type: TimelineEventType;
  description: string;
  timestamp?: any;
}

export const Telemetry = {
  /**
   * PHASE 3: STUDENT TIMELINE
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
   * PHASE 1: LOGIN TRACKING
   */
  async logLogin(studentId: string) {
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

      const loginRef = await addDoc(collection(db, 'loginHistory'), {
        studentId,
        loginTime: serverTimestamp(),
        deviceType: device,
        os,
        browser,
        sessionDuration: 0
      });

      // Update studentAnalytics aggregate
      await setDoc(doc(db, 'studentAnalytics', studentId), {
        loginFrequency: increment(1),
        lastActivity: serverTimestamp()
      }, { merge: true });

      await this.logTimelineEvent({
        studentId,
        type: 'LOGIN',
        description: `Logged in from ${device} (${browser} on ${os})`
      });

      return loginRef.id;
    } catch (e) {
      console.error("Session start error:", e);
      return null;
    }
  },

  async logLogout(studentId: string, loginHistoryId: string) {
    try {
      if (!studentId || !loginHistoryId) return;
      
      const docRef = doc(db, 'loginHistory', loginHistoryId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        const startTime = data.loginTime?.toDate();
        const endTime = new Date();
        const durationSeconds = startTime ? Math.floor((endTime.getTime() - startTime.getTime()) / 1000) : 0;

        await updateDoc(docRef, {
          logoutTime: serverTimestamp(),
          sessionDuration: durationSeconds
        });
      }

      await this.logTimelineEvent({
        studentId,
        type: 'LOGOUT',
        description: `Logged out.`
      });

    } catch (e) {
      console.error("Session end error:", e);
    }
  },

  /**
   * PHASE 2: LEARNING SESSION TRACKING
   */
  async startLearningSession(studentId: string, courseId: string, lessonId: string) {
    try {
      if (!studentId || !lessonId) return null;

      const sessionRef = await addDoc(collection(db, 'learningSessions'), {
        studentId,
        courseId,
        lessonId,
        sessionStart: serverTimestamp(),
        duration: 0,
        isActive: true
      });

      await setDoc(doc(db, 'studentAnalytics', studentId), {
        lastActivity: serverTimestamp()
      }, { merge: true });

      return sessionRef.id;
    } catch (e) {
      console.error("Learning session start error", e);
      return null;
    }
  },

  async endLearningSession(studentId: string, sessionId: string) {
    try {
      if (!studentId || !sessionId) return;
      const sessionRef = doc(db, 'learningSessions', sessionId);
      const docSnap = await getDoc(sessionRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        if (!data.isActive) return;

        const startTime = data.sessionStart?.toDate();
        const endTime = new Date();
        const durationSeconds = startTime ? Math.floor((endTime.getTime() - startTime.getTime()) / 1000) : 0;

        await updateDoc(sessionRef, {
          sessionEnd: serverTimestamp(),
          duration: durationSeconds,
          isActive: false
        });

        if (durationSeconds > 0) {
          await setDoc(doc(db, 'studentAnalytics', studentId), {
            totalLearningTime: increment(durationSeconds)
          }, { merge: true });
        }
      }
    } catch (e) {
      console.error("Learning session end error", e);
    }
  },

  /**
   * COURSE/LESSON ACTIVITY FOR TIMELINE
   */
  async logCourseAction(studentId: string, courseId: string, action: 'COURSE_OPENED' | 'LESSON_OPENED' | 'LESSON_COMPLETED', itemName: string) {
    try {
      if (!studentId) return;

      if (action === 'LESSON_COMPLETED') {
        await setDoc(doc(db, 'studentAnalytics', studentId), {
          totalLessonsCompleted: increment(1)
        }, { merge: true });
      }

      await this.logTimelineEvent({
        studentId,
        type: action as TimelineEventType,
        description: `${action.replace('_', ' ')}: ${itemName}`
      });

    } catch (e) {
      console.error("Course telemetry error:", e);
    }
  },

  /**
   * PHASE 4: TEST INTEGRITY MONITORING
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
   * TEST & ASSIGNMENT TIMELINE WRAPPERS
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

  async logAssignmentAction(studentId: string, courseId: string, assignmentId: string, action: 'ASSIGNMENT_SUBMITTED', assignmentTitle: string) {
    try {
      if (!studentId) return;

      if (action === 'ASSIGNMENT_SUBMITTED') {
        await setDoc(doc(db, 'studentAnalytics', studentId), {
          totalAssignmentsSubmitted: increment(1)
        }, { merge: true });
      }

      await this.logTimelineEvent({
        studentId,
        type: action as TimelineEventType,
        description: `${action.replace('_', ' ')}: ${assignmentTitle}`
      });

    } catch (e) {
      console.error("Assignment telemetry error:", e);
    }
  }
};
