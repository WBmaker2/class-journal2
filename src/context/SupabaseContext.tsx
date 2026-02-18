import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
  lastSync: string | null;
  securityKey: string | null;
  setSecurityKey: (key: string | null) => void;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  uploadData: () => Promise<void>;
  downloadData: () => Promise<void>;
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

export const SupabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [securityKey, setSecurityKey] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (_event.includes('SIGNED_IN')) {
          setSecurityKey(null); // Clear key on logout
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

  const uploadData = async () => {
    if (!user || !securityKey) {
        showToast('로그인 및 보안 비밀번호 입력이 필요합니다.', 'error');
        return;
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
      setLastSync(new Date().toLocaleString());
      showToast('로컬 데이터를 암호화하여 클라우드에 백업했습니다.', 'success');
    } catch (error: any) {
      console.error('Upload error:', error);
      showToast('백업 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const downloadData = async () => {
    if (!user || !securityKey) {
        showToast('로그인 및 보안 비밀번호 입력이 필요합니다.', 'error');
        return;
    }

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
              setLastSync(new Date(cloudResult.updated_at).toLocaleString());
              showToast('클라우드 데이터를 성공적으로 복구했습니다.', 'success');
              setTimeout(() => window.location.reload(), 1000);
          } catch (e) {
              showToast('보안 비밀번호가 올바르지 않습니다.', 'error');
          }
      } else {
          // Legacy plain data
          localStorageService.saveAllData(encryptedData);
          showToast('데이터를 복구했습니다 (암호화되지 않은 이전 버전).', 'info');
          setTimeout(() => window.location.reload(), 1000);
      }
    } catch (error: any) {
      console.error('Download error:', error);
      showToast('복구 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Initial download on login
  useEffect(() => {
    if (user && securityKey && !lastSync) {
      downloadData();
    }
  }, [user, securityKey, lastSync]);

  return (
    <SupabaseContext.Provider value={{
      user,
      session,
      isLoggedIn: !!user,
      isSyncing,
      lastSync,
      securityKey,
      setSecurityKey,
      signIn,
      signOut,
      uploadData,
      downloadData
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
