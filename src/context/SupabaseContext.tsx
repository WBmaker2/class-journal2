import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase, supabaseService } from '../services/supabase';
import { localStorageService } from '../services/localStorage';
import { encryptionService } from '../services/encryption';
import { useToast } from './ToastContext';

interface SupabaseContextType {
  user: User | null;
  session: any;
  isLoggedIn: boolean;
  isSyncing: boolean;
  isDirty: boolean;
  lastSync: string | null;
  securityKey: string | null;
  setSecurityKey: (key: string | null) => void;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  uploadData: (isAuto?: boolean) => Promise<void>;
  downloadData: () => Promise<void>;
  markAsDirty: () => void;
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

const SEC_KEY_STORAGE = 'cj_sec_session';
const AUTO_BACKUP_DELAY = 5000; // 5 seconds
const VERSION_CHECK_INTERVAL = 120000; // 2 minutes

export const SupabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<number>(0);
  const [isDirty, setIsDirty] = useState(false);
  const [securityKey, setSecurityKeyInternal] = useState<string | null>(() => {
    return sessionStorage.getItem(SEC_KEY_STORAGE);
  });
  const { showToast } = useToast();

  const markAsDirty = () => {
    if (isLoggedIn && securityKey) {
      setIsDirty(true);
    }
  };

  const isLoggedIn = !!user;

  const setSecurityKey = (key: string | null) => {
    setSecurityKeyInternal(key);
    if (key) {
      sessionStorage.setItem(SEC_KEY_STORAGE, key);
    } else {
      sessionStorage.removeItem(SEC_KEY_STORAGE);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (_event === 'SIGNED_OUT') {
          setSecurityKey(null);
          setLastSync(null);
          setLastSyncTime(0);
      }
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
      setSecurityKey(null);
      showToast('로그아웃 되었습니다.', 'success');
    } catch (error: any) {
      showToast('로그아웃 중 오류가 발생했습니다.', 'error');
    }
  };

  const uploadData = async (isAuto = false) => {
    if (!user || !securityKey) return;
    
    setIsSyncing(true);
    try {
      const localData = localStorageService.getAllData();
      const encryptedPayload = encryptionService.encrypt(localData, securityKey);
      const encryptedForCloud = {
          isEncrypted: true,
          payload: encryptedPayload,
          updatedAt: new Date().toISOString()
      };
      await supabaseService.upsertUserData(user.id, encryptedForCloud);
      const now = new Date();
      setLastSync(now.toLocaleString());
      setLastSyncTime(now.getTime());
      setIsDirty(false);
      if (!isAuto) {
        showToast('로컬 데이터를 암호화하여 클라우드에 백업했습니다.', 'success');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      if (!isAuto) {
        showToast('백업 중 오류가 발생했습니다.', 'error');
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const downloadData = async () => {
    if (!user || !securityKey) return;

    setIsSyncing(true);
    try {
      const cloudResult = await supabaseService.fetchUserData(user.id);
      if (!cloudResult) {
          showToast('클라우드에 저장된 데이터가 없습니다.', 'info');
          return;
      }

      const encryptedData = cloudResult.data;
      if (encryptedData.isEncrypted) {
          try {
              const decrypted = encryptionService.decrypt(encryptedData.payload, securityKey);
              localStorageService.saveAllData(decrypted);
              const remoteTime = new Date(cloudResult.updated_at);
              setLastSync(remoteTime.toLocaleString());
              setLastSyncTime(remoteTime.getTime());
              showToast('클라우드 데이터를 성공적으로 복구했습니다.', 'success');
              // Trigger reload or state sync in other contexts
              window.dispatchEvent(new Event('storage')); 
          } catch (e) {
              showToast('보안 비밀번호가 올바르지 않습니다.', 'error');
          }
      } else {
          localStorageService.saveAllData(encryptedData);
          const remoteTime = new Date(cloudResult.updated_at);
          setLastSync(remoteTime.toLocaleString());
          setLastSyncTime(remoteTime.getTime());
          showToast('데이터를 복구했습니다 (암호화되지 않은 이전 버전).', 'info');
          window.dispatchEvent(new Event('storage'));
      }
    } catch (error: any) {
      console.error('Download error:', error);
      showToast('복구 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // 1. Auto Backup Logic (Debounce)
  useEffect(() => {
    if (!isDirty || isSyncing || !user || !securityKey) return;

    const timer = setTimeout(() => {
      uploadData(true);
    }, AUTO_BACKUP_DELAY);

    return () => clearTimeout(timer);
  }, [isDirty, isSyncing, user, securityKey]);

  // 2. Version Check Logic
  const checkRemoteVersion = async () => {
    if (!user || !lastSyncTime || isSyncing) return;

    try {
      const cloudResult = await supabaseService.fetchUserData(user.id);
      if (cloudResult) {
        const remoteTime = new Date(cloudResult.updated_at).getTime();
        // If remote is more than 2 seconds newer (to avoid small clock drifts)
        if (remoteTime > lastSyncTime + 2000) {
          showToast('클라우드에 더 최신 데이터가 있습니다. [설정]에서 복구해 주세요.', 'info');
        }
      }
    } catch (e) {
      console.warn('Version check failed', e);
    }
  };

  // Initial download on login
  useEffect(() => {
    if (user && securityKey && !lastSync) {
      downloadData();
    }
  }, [user, securityKey, lastSync]);

  // Polling & Focus version check
  useEffect(() => {
    if (!isLoggedIn || !securityKey) return;

    const interval = setInterval(checkRemoteVersion, VERSION_CHECK_INTERVAL);
    window.addEventListener('focus', checkRemoteVersion);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', checkRemoteVersion);
    };
  }, [isLoggedIn, securityKey, lastSyncTime]);

  return (
    <SupabaseContext.Provider value={{
      user,
      session,
      isLoggedIn,
      isSyncing,
      isDirty,
      lastSync,
      securityKey,
      setSecurityKey,
      signIn,
      signOut,
      uploadData,
      downloadData,
      markAsDirty
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
