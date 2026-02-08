import { useState, useCallback, useEffect } from 'react';
import { googleDriveService } from '../services/googleDrive';
import { useJournal } from '../context/JournalContext';

const BACKUP_FILE_NAME = 'class_journal_backup.json';
const TOKEN_STORAGE_KEY = 'cj_google_token';

interface StoredToken {
  accessToken: string;
  expiresAt: number;
}

export const useGoogleDrive = () => {
  const { students, records, todos, saveCurrentRecord, updateTodos } = useJournal();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check for stored token on mount
  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (stored) {
      try {
        const { accessToken, expiresAt } = JSON.parse(stored) as StoredToken;
        // Check if token is still valid (with 5-minute buffer)
        if (Date.now() < expiresAt - 5 * 60 * 1000) {
          setAccessToken(accessToken);
          setIsLoggedIn(true);
        } else {
          // Token expired, clear storage
          localStorage.removeItem(TOKEN_STORAGE_KEY);
        }
      } catch (e) {
        console.error('Failed to parse stored token', e);
        localStorage.removeItem(TOKEN_STORAGE_KEY);
      }
    }
  }, []);

  const handleLogin = useCallback((clientId: string) => {
    return new Promise<void>((resolve, reject) => {
      try {
        const tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'https://www.googleapis.com/auth/drive.file',
          callback: '', // Initial empty callback
        });

        tokenClient.callback = (response: any) => {
          if (response.error !== undefined) {
            reject(response);
            return;
          }
          
          const token = response.access_token;
          const expiresIn = response.expires_in; // seconds
          const expiresAt = Date.now() + expiresIn * 1000;

          // Save token to storage
          localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify({
            accessToken: token,
            expiresAt
          }));
          
          setAccessToken(token);
          setIsLoggedIn(true);
          resolve();
        };

        tokenClient.requestAccessToken({ prompt: 'consent' });
      } catch (err) {
        reject(err);
      }
    });
  }, []);

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
  }, [accessToken]);

  const uploadData = useCallback(async () => {
    if (!isLoggedIn || !accessToken) return;
    setIsSyncing(true);
    setError(null);
    try {
      const data = { students, records, todos, timestamp: new Date().toISOString() };
      const fileId = await googleDriveService.findBackupFile(accessToken, BACKUP_FILE_NAME);
      
      if (fileId) {
        await googleDriveService.updateBackupFile(accessToken, fileId, data);
      } else {
        await googleDriveService.createBackupFile(accessToken, BACKUP_FILE_NAME, data);
      }
      
      setLastSync(new Date().toLocaleString());
    } catch (err: any) {
      if (err.message && err.message.includes('401')) {
        setError('인증이 만료되었습니다. 다시 로그인해주세요.');
        handleLogout();
      } else {
        setError(err.message || '업로드 실패');
      }
    } finally {
      setIsSyncing(false);
    }
  }, [isLoggedIn, accessToken, students, records, todos, handleLogout]);

  const downloadData = useCallback(async () => {
    if (!isLoggedIn || !accessToken) return;
    setIsSyncing(true);
    setError(null);
    try {
      const fileId = await googleDriveService.findBackupFile(accessToken, BACKUP_FILE_NAME);
      if (!fileId) {
        throw new Error('클라우드에 백업 파일이 없습니다.');
      }
      
      const data = await googleDriveService.downloadBackupFile(accessToken, fileId);
      
      // Update local context
      if (data.records) {
        data.records.forEach((r: any) => saveCurrentRecord(r));
      }
      if (data.todos) {
        updateTodos(data.todos);
      }
      
      setLastSync(new Date().toLocaleString());
      alert('성공적으로 데이터를 내려받았습니다.');
    } catch (err: any) {
      if (err.message && err.message.includes('401')) {
        setError('인증이 만료되었습니다. 다시 로그인해주세요.');
        handleLogout();
      } else {
        setError(err.message || '다운로드 실패');
      }
    } finally {
      setIsSyncing(false);
    }
  }, [isLoggedIn, accessToken, saveCurrentRecord, updateTodos, handleLogout]);

  return {
    isLoggedIn,
    isSyncing,
    lastSync,
    error,
    handleLogin,
    handleLogout,
    uploadData,
    downloadData
  };
};
