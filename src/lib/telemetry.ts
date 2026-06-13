import { db } from '@/lib/firebase/firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc } from 'firebase/firestore';
import { format } from 'date-fns';

export const Telemetry = {
  /**
   * SIMPLE LOGIN TRACKING
   */
  async logLogin(studentId: string, studentName: string = 'Unknown') {
    try {
      if (!studentId) return null;
      
      const today = new Date();
      const dateStr = format(today, 'yyyy-MM-dd');

      const loginRef = await addDoc(collection(db, 'loginHistory'), {
        studentId,
        studentName,
        loginTime: serverTimestamp(),
        logoutTime: null,
        sessionDuration: 0,
        date: dateStr
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
        const durationMins = startTime ? Math.floor((endTime.getTime() - startTime.getTime()) / 60000) : 0;

        await updateDoc(docRef, {
          logoutTime: serverTimestamp(),
          sessionDuration: durationMins
        });
      }
    } catch (e) {
      console.error("Session end error:", e);
    }
  }
};
