import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase, supabaseService } from '../services/supabase';
import { localStorageService } from '../services/localStorage';
import { encryptionService } from '../services/encryption';
import { useToast } from './ToastContext';
import SyncConflictModal from '../components/ui/SyncConflictModal';

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
  uploadData: (isAuto?: boolean, force?: boolean) => Promise<void>;
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
  
  // Conflict state
  const [showConflict, setShowConflict] = useState(false);
  const [remoteTimeStr, setRemoteTimeStr] = useState<string | null>(null);
  const [pendingRemoteData, setPendingRemoteData] = useState<any>(null);

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

  const uploadData = async (isAuto = false, force = false) => {
    if (!user || !securityKey) return;
    
    // Conflict Check (except when forcing)
    if (!force) {
      try {
        const cloudResult = await supabaseService.fetchUserData(user.id);
        if (cloudResult) {
          const remoteTime = new Date(cloudResult.updated_at).getTime();
          if (remoteTime > lastSyncTime + 2000) {
            setRemoteTimeStr(new Date(cloudResult.updated_at).toLocaleString());
            setPendingRemoteData(cloudResult.data);
            setShowConflict(true);
            setIsDirty(true); // Keep it dirty
            if (isAuto) {
              console.warn('Auto-backup aborted due to conflict');
            } else {
              showToast('클라우드에 최신 데이터가 있어 업로드를 중단했습니다.', 'info');
            }
            return;
          }
        }
      } catch (e) {
        console.warn('Conflict check failed, proceeding with caution', e);
      }
    }

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
    if (!isDirty || isSyncing || !user || !securityKey || showConflict) return;

    const timer = setTimeout(() => {
      uploadData(true);
    }, AUTO_BACKUP_DELAY);

    return () => clearTimeout(timer);
  }, [isDirty, isSyncing, user, securityKey, showConflict]);

  // 2. Version Check Logic
  const checkRemoteVersion = useCallback(async () => {
    if (!user || !lastSyncTime || isSyncing || showConflict) return;

    try {
      const cloudResult = await supabaseService.fetchUserData(user.id);
      if (cloudResult) {
        const remoteTime = new Date(cloudResult.updated_at).getTime();
        // If remote is more than 2 seconds newer (to avoid small clock drifts)
        if (remoteTime > lastSyncTime + 2000) {
          showToast('클라우드에 더 최신 데이터가 있습니다. 곧 동기화 알림이 표시됩니다.', 'info');
          // Update remote info and trigger conflict UI if dirty
          if (isDirty) {
              setRemoteTimeStr(new Date(cloudResult.updated_at).toLocaleString());
              setPendingRemoteData(cloudResult.data);
              setShowConflict(true);
          }
        }
      }
    } catch (e) {
      console.warn('Version check failed', e);
    }
  }, [user, lastSyncTime, isSyncing, showConflict, isDirty]);

  // Initial download on login
  useEffect(() => {
    if (user && securityKey && !lastSync) {
      downloadData();
    }
  }, [user, securityKey, lastSync]);

  // Realtime & Focus version check
  useEffect(() => {
    if (!isLoggedIn || !securityKey || !user) return;

    const interval = setInterval(checkRemoteVersion, VERSION_CHECK_INTERVAL);
    window.addEventListener('focus', checkRemoteVersion);

    // Supabase Realtime Subscription
    const channel = supabase
      .channel(`journal_changes_${user.id}`)
      .on(
        'postgres_changes',
        { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'user_journal_data', 
            filter: `user_id=eq.${user.id}` 
        },
        () => {
          console.log('Realtime change detected');
          checkRemoteVersion();
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', checkRemoteVersion);
      supabase.removeChannel(channel);
    };
  }, [isLoggedIn, securityKey, lastSyncTime, user?.id, checkRemoteVersion]);

  // Conflict Resolution Handlers
  const handleMerge = async () => {
    if (!pendingRemoteData || !securityKey) return;
    try {
      let decryptedRemote;
      if (pendingRemoteData.isEncrypted) {
        decryptedRemote = encryptionService.decrypt(pendingRemoteData.payload, securityKey);
      } else {
        decryptedRemote = pendingRemoteData;
      }

      const localData = localStorageService.getAllData();
      const mergedData = localStorageService.mergeAppData(localData, decryptedRemote);
      
      localStorageService.saveAllData(mergedData);
      window.dispatchEvent(new Event('storage')); // Notify other contexts
      
      setShowConflict(false);
      setPendingRemoteData(null);
      
      showToast('데이터를 성공적으로 병합했습니다. 클라우드에 백업을 시도합니다.', 'success');
      // After merge, force upload the merged result
      await uploadData(false, true);
    } catch (e) {
      showToast('데이터 병합 중 오류가 발생했습니다.', 'error');
    }
  };

  const handleOverwriteLocal = async () => {
    setShowConflict(false);
    setPendingRemoteData(null);
    await downloadData();
  };

  const handleForceUpload = async () => {
    setShowConflict(false);
    setPendingRemoteData(null);
    await uploadData(false, true);
  };

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
      <SyncConflictModal 
        isOpen={showConflict}
        onClose={() => setShowConflict(false)}
        localTime={lastSync}
        remoteTime={remoteTimeStr}
        onMerge={handleMerge}
        onOverwriteLocal={handleOverwriteLocal}
        onForceUpload={handleForceUpload}
      />
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
