import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { googleDriveService } from '../services/googleDrive';
import { localStorageService } from '../services/localStorage';
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
  const { showToast } = useToast();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [pendingChanges, setPendingChanges] = useState(false);
  const [autoSync, setAutoSync] = useState(true);
  const [conflictError, setConflictError] = useState<{ local: string, remote: string } | null>(null);

  const lastSavedData = useRef<string | null>(null);
  const syncTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!localStorage.getItem(DEVICE_ID_KEY)) {
      const deviceId = Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem(DEVICE_ID_KEY, deviceId);
    }
  }, []);

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
    // Set initial data state for change detection
    lastSavedData.current = JSON.stringify(localStorageService.getAllData());
  }, []);

  // Detect Data Changes by polling localStorage
  useEffect(() => {
    const interval = setInterval(() => {
      const currentData = JSON.stringify(localStorageService.getAllData());
      if (lastSavedData.current !== currentData) {
        setPendingChanges(true);
        lastSavedData.current = currentData;
      }
    }, 1000); // Check every second

    return () => clearInterval(interval);
  }, []);

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
          localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify({ accessToken: token, expiresAt }));
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
      const metadata = await googleDriveService.getBackupMetadata(accessToken, BACKUP_FILE_NAME);
      const deviceId = localStorage.getItem(DEVICE_ID_KEY) || 'unknown';
      const lastSyncTime = localStorage.getItem(SYNC_TIME_KEY);
      const currentTimestamp = new Date().toISOString();

      if (!force && metadata && metadata.appProperties) {
        const remoteTimestamp = metadata.appProperties.timestamp;
        const remoteDeviceId = metadata.appProperties.deviceId;
        if (lastSyncTime && new Date(remoteTimestamp).getTime() > new Date(lastSyncTime).getTime() + 1000 && remoteDeviceId !== deviceId) {
          setConflictError({ local: lastSyncTime, remote: remoteTimestamp });
          showToast('데이터 충돌이 발생했습니다. 해결이 필요합니다.', 'error', 5000);
          setIsSyncing(false);
          return;
        }
      }

      const data = localStorageService.getAllData();
      const appProperties = { timestamp: currentTimestamp, deviceId, version: '2.0' };

      if (metadata && metadata.id) {
        await googleDriveService.updateBackupFile(accessToken, metadata.id, data, appProperties);
      } else {
        await googleDriveService.createBackupFile(accessToken, BACKUP_FILE_NAME, data, appProperties);
      }
      
      const nowStr = new Date().toLocaleString();
      setLastSync(nowStr);
      localStorage.setItem(SYNC_TIME_KEY, currentTimestamp);
      setPendingChanges(false);
      lastSavedData.current = JSON.stringify(data); // Update reference
      showToast('전체 데이터를 Google Drive에 백업했습니다.', 'success');

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
  }, [isLoggedIn, accessToken, handleLogout, showToast]);

  useEffect(() => {
    if (autoSync && pendingChanges && isLoggedIn && !isSyncing && !conflictError) {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = window.setTimeout(() => {
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
      
      if (data.classes && data.classData) {
        localStorageService.saveAllData(data);
        const remoteTimestamp = metadata.appProperties?.timestamp || new Date().toISOString();
        localStorage.setItem(SYNC_TIME_KEY, remoteTimestamp);
        setLastSync(new Date(remoteTimestamp).toLocaleString());
        showToast('클라우드 데이터를 성공적으로 복구했습니다. 앱을 새로고침합니다.', 'success');
        setTimeout(() => window.location.reload(), 1000);
      } else {
        throw new Error('다운로드한 파일 형식이 올바르지 않습니다.');
      }
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
  }, [isLoggedIn, accessToken, handleLogout, showToast]);

  const resolveConflict = useCallback((action: 'local' | 'remote') => {
    if (action === 'local') {
      uploadData(true);
    } else {
      downloadData();
    }
    setConflictError(null);
  }, [uploadData, downloadData]);

  return (
    <GoogleDriveContext.Provider value={{
      isLoggedIn, isSyncing, lastSync, error, pendingChanges, autoSync,
      conflictError, handleLogin, handleLogout, uploadData, downloadData,
      setAutoSync, resolveConflict
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
