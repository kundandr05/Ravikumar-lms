'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Telemetry } from '@/lib/telemetry';

export type UserRole = 'admin' | 'student' | 'parent';

export interface AppUser {
  uid: string;
  email: string | null;
  name: string | null;
  role: UserRole;
  status?: string;
  currentStreak?: number;
  lastLoginDate?: string;
  focusPoints?: number;
}

interface AuthContextType {
  user: FirebaseUser | null;
  appUser: AppUser | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  appUser: null,
  loading: true,
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loginHistoryId, setLoginHistoryId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = { uid: firebaseUser.uid, ...userDoc.data() } as AppUser;
            setAppUser(userData);
            
            // Log session if not already logged in this tab session
            if (typeof window !== 'undefined' && !sessionStorage.getItem('session_logged_' + firebaseUser.uid)) {
              if (userData.role === 'student') {
                const sId = await Telemetry.logSessionStart(firebaseUser.uid);
                if (sId) {
                  setSessionId(sId.sessionId);
                  setLoginHistoryId(sId.loginHistoryId);
                  sessionStorage.setItem('current_session_id', sId.sessionId);
                  sessionStorage.setItem('current_login_history_id', sId.loginHistoryId);
                }
              }
              sessionStorage.setItem('session_logged_' + firebaseUser.uid, 'true');
            } else if (typeof window !== 'undefined') {
              const existingSId = sessionStorage.getItem('current_session_id');
              const existingLHId = sessionStorage.getItem('current_login_history_id');
              if (existingSId) setSessionId(existingSId);
              if (existingLHId) setLoginHistoryId(existingLHId);
            }
          } else {
            setAppUser(null);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setAppUser(null);
        }
      } else {
        setAppUser(null);
        setSessionId(null);
        setLoginHistoryId(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Handle tab closing
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (appUser?.uid && sessionId) {
        Telemetry.logSessionEnd(appUser.uid, sessionId, loginHistoryId || undefined);
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [appUser, sessionId, loginHistoryId]);

  const logout = async () => {
    if (appUser?.uid && sessionId) {
      await Telemetry.logSessionEnd(appUser.uid, sessionId, loginHistoryId || undefined);
      sessionStorage.removeItem('current_session_id');
      sessionStorage.removeItem('current_login_history_id');
      sessionStorage.removeItem('session_logged_' + appUser.uid);
    }
    await auth.signOut();
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{ user, appUser, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
