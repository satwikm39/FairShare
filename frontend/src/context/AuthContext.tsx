import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import type { User as BackendUser } from '../types';
import { api } from '../services/api';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';
import { Loader2 } from 'lucide-react';
import { DEMO_USER } from '../services/mock/db';
import { isDemoMode } from '../config/demo';

interface AuthContextType {
  currentUser: (FirebaseUser & Partial<BackendUser>) | null;
  isDemoActive: boolean;
  loading: boolean;
  refreshUserData: () => Promise<void>;
  setDemoModeActive: (active: boolean) => void;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  isDemoActive: false,
  loading: true,
  refreshUserData: async () => {},
  setDemoModeActive: () => {}
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<(FirebaseUser & Partial<BackendUser>) | null>(null);
  const [isDemoActive, setIsDemoActive] = useState(isDemoMode());
  const [loading, setLoading] = useState(true);

  const setDemoModeActive = (active: boolean) => {
    setIsDemoActive(active);
  };

  const fetchBackendUser = async (firebaseUser: FirebaseUser) => {
    try {
      const response = await api.get<BackendUser>('/users/me');
      setCurrentUser({ ...firebaseUser, ...response.data });
    } catch (err) {
      console.error("Failed to fetch backend user data:", err);
      setCurrentUser(firebaseUser as any);
    }
  };

  const refreshUserData = async () => {
    if (isDemoActive) {
      setCurrentUser(DEMO_USER as any);
      return;
    }
    if (auth.currentUser) {
      await fetchBackendUser(auth.currentUser);
    }
  };

  useEffect(() => {
    if (isDemoActive) {
      setCurrentUser(DEMO_USER as any);
      setLoading(false);
      return () => {};
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await fetchBackendUser(user);
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [isDemoActive]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-12 h-12 animate-spin text-brand-500 dark:text-brand-400" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ currentUser, isDemoActive, loading, refreshUserData, setDemoModeActive }}>
      {children}
    </AuthContext.Provider>
  );
};
