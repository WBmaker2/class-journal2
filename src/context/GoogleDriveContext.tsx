import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { googleDriveService } from '../services/googleDrive';
import { useJournal } from './JournalContext';
import { useToast } from './ToastContext';

const BACKUP_FILE_NAME = 'class_journal_backup.json';
const TOKEN_STORAGE_KEY = 'cj_google_token';
const SYNC_TIME_KEY = 'cj_last_sync_time';
const DEVICE_ID_KEY = 'cj_device_id';

interface StoredToken {
  accessToken: string;
  expiresAt: number;
}

interface GoogleDriveContextType {
  isLoggedIn: boolean;
  isSyncing: boolean;
  lastSync: string | null;
  error: string | null;
  pendingChanges: boolean;
  autoSync: boolean;
  conflictError: { local: string; remote: string } | null;
  handleLogin: (clientId: string) => Promise<void>;
  handleLogout: () => void;
  uploadData: (force?: boolean) => Promise<void>;
  downloadData: () => Promise<void>;
  setAutoSync: (enabled: boolean) => void;
  resolveConflict: (action: 'local' | 'remote') => void;
}

const GoogleDriveContext = createContext<GoogleDriveContextType | undefined>(undefined);

export const GoogleDriveProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { students, records, todos, saveCurrentRecord, updateTodos, manageStudents } = useJournal();
  const { showToast } = useToast();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null); // For display
  const [error, setError] = useState<string | null>(null);
  
  // New States for Reliability
  const [pendingChanges, setPendingChanges] = useState(false);
  const [autoSync, setAutoSync] = useState(true);
  const [conflictError, setConflictError] = useState<{ local: string, remote: string } | null>(null);

  const isRestoring = useRef(false);
  const isFirstMount = useRef(true);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Device ID
  useEffect(() => {
    if (!localStorage.getItem(DEVICE_ID_KEY)) {
      const deviceId = Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem(DEVICE_ID_KEY, deviceId);
    }
  }, []);

  // Check for stored token & last sync time on mount
  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (stored) {
      try {
        const { accessToken, expiresAt } = JSON.parse(stored) as StoredToken;
        if (Date.now() < expiresAt - 5 * 60 * 1000) {
          setAccessToken(accessToken);
          setIsLoggedIn(true);
        } else {
          localStorage.removeItem(TOKEN_STORAGE_KEY);
        }
      } catch (e) {
        console.error('Failed to parse stored token', e);
        localStorage.removeItem(TOKEN_STORAGE_KEY);
      }
    }

    const savedLastSync = localStorage.getItem(SYNC_TIME_KEY);
    if (savedLastSync) {
      setLastSync(new Date(savedLastSync).toLocaleString());
    }
  }, []);

  // Detect Data Changes
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    if (isRestoring.current) {
      isRestoring.current = false;
      return;
    }
    
    setPendingChanges(true);
  }, [students, records, todos]);

  const handleLogin = useCallback((clientId: string) => {
    return new Promise<void>((resolve, reject) => {
      try {
        const tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'https://www.googleapis.com/auth/drive.file',
          callback: '', 
        });

        tokenClient.callback = (response: any) => {
          if (response.error !== undefined) {
            reject(response);
            return;
          }
          
          const token = response.access_token;
          const expiresIn = response.expires_in;
          const expiresAt = Date.now() + expiresIn * 1000;

          localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify({
            accessToken: token,
            expiresAt
          }));
          
          setAccessToken(token);
          setIsLoggedIn(true);
          showToast('Google 계정으로 로그인했습니다.', 'success');
          resolve();
        };

        tokenClient.requestAccessToken({ prompt: 'consent' });
      } catch (err) {
        reject(err);
      }
    });
  }, [showToast]);

  const handleLogout = useCallback(() => {
    if (accessToken) {
      google.accounts.oauth2.revoke(accessToken, () => {
        setAccessToken(null);
        setIsLoggedIn(false);
        localStorage.removeItem(TOKEN_STORAGE_KEY);
      });
    } else {
      setIsLoggedIn(false);
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
    showToast('로그아웃되었습니다.', 'info');
  }, [accessToken, showToast]);

  const uploadData = useCallback(async (force = false) => {
    if (!isLoggedIn || !accessToken) return;
    
    setIsSyncing(true);
    setError(null);
    setConflictError(null);

    try {
      // 1. Check for Conflict (unless forced)
      const metadata = await googleDriveService.getBackupMetadata(accessToken, BACKUP_FILE_NAME);
      const deviceId = localStorage.getItem(DEVICE_ID_KEY) || 'unknown';
      const lastSyncTime = localStorage.getItem(SYNC_TIME_KEY);
      const currentTimestamp = new Date().toISOString();

      if (!force && metadata && metadata.appProperties) {
        const remoteTimestamp = metadata.appProperties.timestamp;
        const remoteDeviceId = metadata.appProperties.deviceId;

        // If remote is newer than our last sync time, AND it was NOT uploaded by us
        if (lastSyncTime && new Date(remoteTimestamp).getTime() > new Date(lastSyncTime).getTime() + 1000 && remoteDeviceId !== deviceId) {
          console.warn('Conflict detected');
          setConflictError({ local: lastSyncTime, remote: remoteTimestamp });
          showToast('데이터 충돌이 발생했습니다. 해결이 필요합니다.', 'error', 5000);
          setIsSyncing(false);
          return; // Stop upload
        }
      }

      // 2. Prepare Data
      const data = { 
        students, 
        records, 
        todos, 
        timestamp: currentTimestamp // Payload timestamp
      };

      const appProperties = {
        timestamp: currentTimestamp,
        deviceId: deviceId,
        version: '1.0'
      };

      // 3. Upload
      if (metadata && metadata.id) {
        await googleDriveService.updateBackupFile(accessToken, metadata.id, data, appProperties);
      } else {
        await googleDriveService.createBackupFile(accessToken, BACKUP_FILE_NAME, data, appProperties);
      }
      
      // 4. Update State
      const nowStr = new Date().toLocaleString();
      setLastSync(nowStr);
      localStorage.setItem(SYNC_TIME_KEY, currentTimestamp);
      setPendingChanges(false);
      showToast('데이터를 Google Drive에 백업했습니다.', 'success');

    } catch (err: any) {
      if (err.message && err.message.includes('401')) {
        setError('인증이 만료되었습니다. 다시 로그인해주세요.');
        showToast('인증이 만료되었습니다.', 'error');
        handleLogout();
      } else {
        setError(err.message || '업로드 실패');
        showToast(err.message || '업로드 실패', 'error');
      }
    } finally {
      setIsSyncing(false);
    }
  }, [isLoggedIn, accessToken, students, records, todos, handleLogout, showToast]);

  // Auto Sync Logic - using uploadData from closure
  useEffect(() => {
    if (autoSync && pendingChanges && isLoggedIn && !isSyncing && !conflictError) {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      
      syncTimeoutRef.current = setTimeout(() => {
        uploadData();
      }, 30000); // 30 seconds debounce
    }

    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, [autoSync, pendingChanges, isLoggedIn, isSyncing, conflictError, uploadData]);

  const downloadData = useCallback(async () => {
    if (!isLoggedIn || !accessToken) return;
    setIsSyncing(true);
    setError(null);
    setConflictError(null);

    try {
      const metadata = await googleDriveService.getBackupMetadata(accessToken, BACKUP_FILE_NAME);
      if (!metadata || !metadata.id) {
        throw new Error('클라우드에 백업 파일이 없습니다.');
      }
      
      const data = await googleDriveService.downloadBackupFile(accessToken, metadata.id);
      
      // Prevent marking this restoration as a new change
      isRestoring.current = true;

      // Update local context
      if (data.records && Array.isArray(data.records)) {
        data.records.forEach((r: any) => saveCurrentRecord(r));
      }
      if (data.students && Array.isArray(data.students)) {
         manageStudents(data.students);
      }
      if (data.todos && Array.isArray(data.todos)) {
        updateTodos(data.todos);
      }

      const remoteTimestamp = metadata.appProperties?.timestamp || new Date().toISOString();
      localStorage.setItem(SYNC_TIME_KEY, remoteTimestamp);
      setLastSync(new Date(remoteTimestamp).toLocaleString());
      showToast('클라우드 데이터를 성공적으로 가져왔습니다.', 'success');
    } catch (err: any) {
      if (err.message && err.message.includes('401')) {
        setError('인증이 만료되었습니다. 다시 로그인해주세요.');
        showToast('인증이 만료되었습니다.', 'error');
        handleLogout();
      } else {
        setError(err.message || '다운로드 실패');
        showToast(err.message || '다운로드 실패', 'error');
      }
    } finally {
      setIsSyncing(false);
    }
  }, [isLoggedIn, accessToken, saveCurrentRecord, updateTodos, manageStudents, handleLogout, showToast]);

  const resolveConflict = useCallback((action: 'local' | 'remote') => {
    if (action === 'local') {
      uploadData(true); // Force upload
    } else {
      downloadData(); // Overwrite local
    }
    setConflictError(null);
  }, [uploadData, downloadData]);

  return (
    <GoogleDriveContext.Provider value={{
      isLoggedIn,
      isSyncing,
      lastSync,
      error,
      pendingChanges,
      autoSync,
      conflictError,
      handleLogin,
      handleLogout,
      uploadData,
      downloadData,
      setAutoSync,
      resolveConflict
    }}>
      {children}
    </GoogleDriveContext.Provider>
  );
};

export const useGoogleDrive = () => {
  const context = useContext(GoogleDriveContext);
  if (context === undefined) {
    throw new Error('useGoogleDrive must be used within a GoogleDriveProvider');
  }
  return context;
};
