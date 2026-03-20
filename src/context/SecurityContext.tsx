import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

interface SecurityContextType {
  securityKey: string | null;
  setSecurityKey: (key: string | null) => void;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

const SEC_KEY_STORAGE = 'cj_sec_session';

export const SecurityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [securityKey, setSecurityKeyInternal] = useState<string | null>(() => {
    return sessionStorage.getItem(SEC_KEY_STORAGE);
  });
  const { isLoggedIn } = useAuth();

  const setSecurityKey = (key: string | null) => {
    setSecurityKeyInternal(key);
    if (key) {
      sessionStorage.setItem(SEC_KEY_STORAGE, key);
    } else {
      sessionStorage.removeItem(SEC_KEY_STORAGE);
    }
  };

  // Clear security key on logout
  useEffect(() => {
    if (!isLoggedIn) {
      setSecurityKey(null);
    }
  }, [isLoggedIn]);

  return (
    <SecurityContext.Provider value={{
      securityKey,
      setSecurityKey
    }}>
      {children}
    </SecurityContext.Provider>
  );
};

export const useSecurity = () => {
  const context = useContext(SecurityContext);
  if (context === undefined) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
};
