import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase, supabaseService } from '../services/supabase';
import { localStorageService } from '../services/localStorage';
import { encryptionService } from '../services/encryption';
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
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

const AUTO_BACKUP_DELAY = 5000;
const VERSION_CHECK_INTERVAL = 120000;

export const SyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoggedIn } = useAuth();
  const { securityKey } = useSecurity();
  const { showToast } = useToast();

  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<number>(0);
  const [isDirty, setIsDirty] = useState(false);
  
  const isDownloadingRef = useRef(false);
  const isCheckingVersionRef = useRef(false);

  const [showConflict, setShowConflict] = useState(false);
  const [remoteTimeStr, setRemoteTimeStr] = useState<string | null>(null);
  const [pendingRemoteData, setPendingRemoteData] = useState<any>(null);

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
          if (remoteTime > lastSyncTime + 2000) {
            setRemoteTimeStr(new Date(cloudResult.updated_at).toLocaleString());
            setPendingRemoteData(cloudResult.data);
            setShowConflict(true);
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
      const localData = localStorageService.getAllData();
      const encryptedPayload = encryptionService.encrypt(localData, securityKey);
      const checksum = encryptionService.generateChecksum(localData);
      
      const encryptedForCloud = {
          isEncrypted: true,
          payload: encryptedPayload,
          checksum: checksum,
          updatedAt: new Date().toISOString()
      };
      const result = await supabaseService.upsertUserData(user.id, encryptedForCloud);
      const serverTime = new Date(result.updated_at);
      
      setLastSync(serverTime.toLocaleString());
      setLastSyncTime(serverTime.getTime());
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
  }, [user, securityKey, lastSyncTime, showToast]);

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

      const encryptedData = cloudResult.data;
      if (encryptedData.isEncrypted) {
          try {
              const decrypted = encryptionService.decrypt(encryptedData.payload, securityKey);
              
              if (encryptedData.checksum) {
                  const currentChecksum = encryptionService.generateChecksum(decrypted);
                  if (currentChecksum !== encryptedData.checksum) {
                      showToast('데이터 무결성 검증에 실패했습니다. 데이터가 손상되었을 수 있습니다.', 'error');
                      return;
                  }
              }

              localStorageService.saveAllData(decrypted);
              const remoteTime = new Date(cloudResult.updated_at);
              setLastSync(remoteTime.toLocaleString());
              setLastSyncTime(remoteTime.getTime());
              
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
          localStorageService.saveAllData(encryptedData);
          const remoteTime = new Date(cloudResult.updated_at);
          setLastSync(remoteTime.toLocaleString());
          setLastSyncTime(remoteTime.getTime());
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
        const isRemoteNewer = remoteTime > lastSyncTime + 2000;
        
        if (isRemoteNewer) {
          if (isDirty) {
            setRemoteTimeStr(new Date(cloudResult.updated_at).toLocaleString());
            setPendingRemoteData(cloudResult.data);
            setShowConflict(true);
          } else {
            await downloadData(true);
          }
        } else if (isInitial === true && !lastSyncTime) {
          await downloadData(true);
        }
      }
    } catch (error) {
      console.warn('Version check failed', error);
    } finally {
      isCheckingVersionRef.current = false;
    }
  }, [user, lastSyncTime, isSyncing, showConflict, isDirty, downloadData]);

  useEffect(() => {
    if (!isDirty || isSyncing || !user || !securityKey || showConflict) return;

    const timer = setTimeout(() => {
      uploadData(true);
    }, AUTO_BACKUP_DELAY);

    return () => clearTimeout(timer);
  }, [isDirty, isSyncing, user, securityKey, showConflict, uploadData]);

  useEffect(() => {
    if (user && securityKey && !lastSync) {
      checkRemoteVersion(true);
    }
  }, [user, securityKey, lastSync, checkRemoteVersion]);

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
      let decryptedRemote;
      if (pendingRemoteData.isEncrypted) {
        decryptedRemote = encryptionService.decrypt(pendingRemoteData.payload, securityKey);
        
        if (pendingRemoteData.checksum) {
          const remoteChecksum = encryptionService.generateChecksum(decryptedRemote);
          if (remoteChecksum !== pendingRemoteData.checksum) {
            showToast('원격 데이터 무결성 검증에 실패했습니다.', 'error');
            return;
          }
        }
      } else {
        decryptedRemote = pendingRemoteData;
      }

      const localData = localStorageService.getAllData();
      const mergedData = localStorageService.mergeAppData(localData, decryptedRemote);
      
      localStorageService.saveAllData(mergedData);
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

  return (
    <SyncContext.Provider value={{
      isSyncing,
      isDirty,
      lastSync,
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
