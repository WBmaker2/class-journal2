import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase, supabaseService } from '../services/supabase';
import { exportDatabase, importDatabase } from '../services/db';
import { mergeAppData, type AppDataSnapshot } from '../services/appDataMerge';
import {
  getRemoteSyncResolution,
  hasMeaningfulLocalData,
  type RemoteSyncResolution,
} from '../services/syncDecision';
import {
  createEncryptedCloudPayload,
  decryptCloudPayload,
  isEncryptedCloudPayload,
  type EncryptedCloudPayload,
} from '../services/syncPayload';
import { createSyncPreviewState, type SyncPreviewMode } from '../services/syncPreview';
import { useToast } from './ToastContext';
import { useAuth } from './AuthContext';
import { useSecurity } from './SecurityContext';
import SyncConflictModal from '../components/ui/SyncConflictModal';

interface SyncContextType {
  isSyncing: boolean;
  isDirty: boolean;
  lastSync: string | null;
  uploadData: (isAuto?: boolean, force?: boolean) => Promise<void>;
  downloadData: (isAuto?: boolean) => Promise<void>;
  markAsDirty: () => void;
  openSyncPreview: (mode: SyncPreviewMode) => Promise<void>;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

const AUTO_BACKUP_DELAY = 5000;
const VERSION_CHECK_INTERVAL = 120000;
type CloudSyncData = EncryptedCloudPayload | AppDataSnapshot;
type SyncPromptMode = 'conflict' | 'server-update';

export const SyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoggedIn } = useAuth();
  const { securityKey } = useSecurity();
  const { showToast } = useToast();

  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const lastSyncTimeRef = useRef<number>(0);
  const [isDirty, setIsDirty] = useState(false);
  
  const isDownloadingRef = useRef(false);
  const isCheckingVersionRef = useRef(false);
  const hasCheckedInitialRef = useRef(false);

  const [showConflict, setShowConflict] = useState(false);
  const [syncPromptMode, setSyncPromptMode] = useState<SyncPromptMode>('conflict');
  const [isPreviewPrompt, setIsPreviewPrompt] = useState(false);
  const [remoteTimeStr, setRemoteTimeStr] = useState<string | null>(null);
  const [pendingRemoteData, setPendingRemoteData] = useState<CloudSyncData | null>(null);

  const openSyncPrompt = useCallback((mode: SyncPromptMode, remoteData: CloudSyncData, updatedAt: string) => {
    setSyncPromptMode(mode);
    setIsPreviewPrompt(false);
    setRemoteTimeStr(new Date(updatedAt).toLocaleString());
    setPendingRemoteData(remoteData);
    setShowConflict(true);
  }, []);

  const openSyncPreview = useCallback(async (mode: SyncPreviewMode) => {
    const localData = await exportDatabase() as AppDataSnapshot;
    const preview = createSyncPreviewState(mode, lastSync);

    setSyncPromptMode(mode);
    setIsPreviewPrompt(true);
    setRemoteTimeStr(new Date(preview.remoteTime).toLocaleString());
    setPendingRemoteData(localData);
    setShowConflict(true);
  }, [lastSync]);

  const markAsDirty = useCallback(() => {
    if (isLoggedIn && securityKey) {
      setIsDirty(true);
    }
  }, [isLoggedIn, securityKey]);

  const uploadData = useCallback(async (isAuto = false, force = false) => {
    if (!user || !securityKey) return;
    
    if (!force) {
      try {
        const cloudResult = await supabaseService.fetchUserData(user.id);
        if (cloudResult) {
          const remoteTime = new Date(cloudResult.updated_at).getTime();
          if (remoteTime > lastSyncTimeRef.current + 2000) {
            openSyncPrompt('conflict', cloudResult.data as CloudSyncData, cloudResult.updated_at);
            setIsDirty(true);
            if (isAuto) {
              console.warn('Auto-backup aborted due to conflict');
            } else {
              showToast('클라우드에 더 최신 데이터가 있어 업로드를 중단했습니다.', 'info');
            }
            return;
          }
        }
      } catch (error) {
        console.warn('Conflict check failed, proceeding with caution', error);
      }
    }

    setIsSyncing(true);
    try {
      const localData = await exportDatabase();
      const encryptedForCloud = createEncryptedCloudPayload(localData, securityKey);
      const result = await supabaseService.upsertUserData(user.id, encryptedForCloud);
      const serverTime = new Date(result.updated_at);
      
      setLastSync(serverTime.toLocaleString());
      lastSyncTimeRef.current = serverTime.getTime();
      setIsDirty(false);
      
      if (!isAuto) {
        showToast('로컬 데이터를 암호화하여 클라우드에 백업했습니다.', 'success');
      }
    } catch (error) {
      console.error('Upload error:', error);
      if (!isAuto) {
        showToast('백업 중 오류가 발생했습니다.', 'error');
      }
    } finally {
      setIsSyncing(false);
    }
  }, [user, securityKey, showToast, openSyncPrompt]);

  const downloadData = useCallback(async (isAuto = false) => {
    if (!user || !securityKey || isDownloadingRef.current) return;

    isDownloadingRef.current = true;
    setIsSyncing(true);
    try {
      const cloudResult = await supabaseService.fetchUserData(user.id);
      if (!cloudResult) {
          if (!isAuto) showToast('클라우드에 저장된 데이터가 없습니다.', 'info');
          return;
      }

      const remoteData = cloudResult.data as CloudSyncData;
      if (isEncryptedCloudPayload(remoteData)) {
          try {
              const decrypted = decryptCloudPayload<AppDataSnapshot>(remoteData, securityKey);
              await importDatabase(decrypted);
              const remoteTime = new Date(cloudResult.updated_at);
              setLastSync(remoteTime.toLocaleString());
              lastSyncTimeRef.current = remoteTime.getTime();
              
              if (isAuto) {
                showToast('클라우드에서 최신 데이터를 가져왔습니다.', 'success');
              } else {
                showToast('클라우드 데이터를 성공적으로 복구했습니다.', 'success');
              }
              window.dispatchEvent(new Event('storage')); 
          } catch {
              showToast('보안 비밀번호가 올바르지 않습니다.', 'error');
          }
      } else {
          await importDatabase(remoteData);
          const remoteTime = new Date(cloudResult.updated_at);
          setLastSync(remoteTime.toLocaleString());
          lastSyncTimeRef.current = remoteTime.getTime();
          showToast('데이터를 복구했습니다 (암호화되지 않은 이전 버전).', 'info');

          window.dispatchEvent(new Event('storage'));
      }
    } catch (error) {
      console.error('Download error:', error);
      showToast('복구 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsSyncing(false);
      isDownloadingRef.current = false;
    }
  }, [user, securityKey, showToast]);

  const checkRemoteVersion = useCallback(async (isInitial = false) => {
    if (!user || isSyncing || showConflict || isCheckingVersionRef.current) return;

    isCheckingVersionRef.current = true;
    try {
      const cloudResult = await supabaseService.fetchUserData(user.id);
      if (cloudResult) {
        const remoteTime = new Date(cloudResult.updated_at).getTime();
        const isRemoteNewer = remoteTime > lastSyncTimeRef.current + 2000;
        const localData = await exportDatabase() as AppDataSnapshot;
        const resolution: RemoteSyncResolution = getRemoteSyncResolution({
          isInitial,
          isDirty,
          hasLocalData: hasMeaningfulLocalData(localData),
          isRemoteNewer,
        });
        
        if (resolution === 'prompt-conflict') {
          openSyncPrompt('conflict', cloudResult.data as CloudSyncData, cloudResult.updated_at);
        } else if (resolution === 'prompt-server-update') {
          openSyncPrompt('server-update', cloudResult.data as CloudSyncData, cloudResult.updated_at);
        } else if (resolution === 'download') {
          await downloadData(true);
        } else if (isInitial === true && !lastSyncTimeRef.current && !hasMeaningfulLocalData(localData)) {
          await downloadData(true);
        }
      }
    } catch (error) {
      console.warn('Version check failed', error);
    } finally {
      isCheckingVersionRef.current = false;
    }
  }, [user, isSyncing, showConflict, isDirty, downloadData, openSyncPrompt]);

  useEffect(() => {
    if (!isDirty || isSyncing || !user || !securityKey || showConflict) return;

    const timer = setTimeout(() => {
      uploadData(true);
    }, AUTO_BACKUP_DELAY);

    return () => clearTimeout(timer);
  }, [isDirty, isSyncing, user, securityKey, showConflict, uploadData]);

  useEffect(() => {
    if (user && securityKey && !hasCheckedInitialRef.current) {
      hasCheckedInitialRef.current = true;
      checkRemoteVersion(true);
    }
  }, [user, securityKey, checkRemoteVersion]);

  useEffect(() => {
    if (!isLoggedIn || !securityKey || !user) return;

    const handleFocus = () => checkRemoteVersion();
    const interval = setInterval(checkRemoteVersion, VERSION_CHECK_INTERVAL);
    window.addEventListener('focus', handleFocus);

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
      window.removeEventListener('focus', handleFocus);
      supabase.removeChannel(channel);
    };
  }, [isLoggedIn, securityKey, user, checkRemoteVersion]);

  // Conflict Resolution Handlers
  const handleMerge = async () => {
    if (!pendingRemoteData || !securityKey) return;
    try {
      let decryptedRemote: AppDataSnapshot;
      if (isEncryptedCloudPayload(pendingRemoteData)) {
        decryptedRemote = decryptCloudPayload<AppDataSnapshot>(pendingRemoteData, securityKey);
      } else {
        decryptedRemote = pendingRemoteData;
      }

      const localData = await exportDatabase();
      const mergedData = mergeAppData(localData as AppDataSnapshot, decryptedRemote);
      
      await importDatabase(mergedData);
      window.dispatchEvent(new Event('storage')); 
      
      setShowConflict(false);
      setPendingRemoteData(null);
      
      showToast('데이터를 성공적으로 병합했습니다. 클라우드에 백업을 시도합니다.', 'success');
      await uploadData(false, true);
    } catch {
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

  const closePreviewPrompt = useCallback(() => {
    setShowConflict(false);
    setPendingRemoteData(null);
    setIsPreviewPrompt(false);
    showToast('미리보기 모드에서는 데이터가 변경되지 않았습니다.', 'info');
  }, [showToast]);

  return (
    <SyncContext.Provider value={{
      isSyncing,
      isDirty,
      lastSync,
      uploadData,
      downloadData,
      markAsDirty,
      openSyncPreview
    }}>
      {children}
      <SyncConflictModal 
        isOpen={showConflict}
        onClose={isPreviewPrompt ? closePreviewPrompt : () => setShowConflict(false)}
        mode={syncPromptMode}
        localTime={lastSync}
        remoteTime={remoteTimeStr}
        onMerge={isPreviewPrompt ? closePreviewPrompt : handleMerge}
        onOverwriteLocal={isPreviewPrompt ? closePreviewPrompt : handleOverwriteLocal}
        onForceUpload={isPreviewPrompt ? closePreviewPrompt : handleForceUpload}
      />
    </SyncContext.Provider>
  );
};

export const useSync = () => {
  const context = useContext(SyncContext);
  if (context === undefined) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  return context;
};
