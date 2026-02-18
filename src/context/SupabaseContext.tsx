import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, supabaseService } from '../services/supabase';
import { localStorageService } from '../services/localStorage';
import { useToast } from './ToastContext';

interface SupabaseContextType {
  user: User | null;
  session: any;
  isLoggedIn: boolean;
  isSyncing: boolean;
  lastSync: string | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  syncData: () => Promise<void>;
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

export const SupabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async () => {
    try {
      await supabaseService.signInWithGoogle();
    } catch (error: any) {
      showToast('로그인 중 오류가 발생했습니다: ' + error.message, 'error');
    }
  };

  const signOut = async () => {
    try {
      await supabaseService.signOut();
      showToast('로그아웃 되었습니다.', 'success');
    } catch (error: any) {
      showToast('로그아웃 중 오류가 발생했습니다.', 'error');
    }
  };

  const syncData = useCallback(async () => {
    if (!user) return;
    
    setIsSyncing(true);
    try {
      // 1. Fetch cloud data
      const cloudResult = await supabaseService.fetchUserData(user.id);
      const localData = localStorageService.getAllData();
      
      if (cloudResult) {
        // Simple strategy: Merge or take latest
        // For now, if cloud exists, we could ask or just take latest. 
        // Let's implement a simple "Take latest" based on updated_at if we add it to local too,
        // but for now let's just upload local if local has data and cloud is empty, 
        // or download if local is empty and cloud has data.
        
        // If we want a real sync, we should compare timestamps.
        // For v3.0 simplified version, we'll favor cloud if it exists, 
        // unless it's the very first time.
        
        // TODO: Advanced merge logic
        localStorageService.saveAllData(cloudResult.data);
        setLastSync(new Date(cloudResult.updated_at).toLocaleString());
      } else {
        // First time cloud sync: Upload local data
        await supabaseService.upsertUserData(user.id, localData);
        setLastSync(new Date().toLocaleString());
        showToast('로컬 데이터를 클라우드로 백업했습니다.', 'success');
      }
    } catch (error: any) {
      console.error('Sync error:', error);
      showToast('동기화 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsSyncing(false);
    }
  }, [user, showToast]);

  // Initial sync on login
  useEffect(() => {
    if (user) {
      syncData();
    }
  }, [user, syncData]);

  return (
    <SupabaseContext.Provider value={{
      user,
      session,
      isLoggedIn: !!user,
      isSyncing,
      lastSync,
      signIn,
      signOut,
      syncData
    }}>
      {children}
    </SupabaseContext.Provider>
  );
};

export const useSupabase = () => {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
};
