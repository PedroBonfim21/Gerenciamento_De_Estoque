"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, EmailAuthProvider, reauthenticateWithCredential  } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getUserRole } from '@/lib/firestore';

interface AuthContextType {
  user: User | null;
  userRole: string | null;
  loading: boolean;
  reauthenticate: (password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({ 
    user: null, 
    userRole: null, 
    loading: true, 
    reauthenticate: () => Promise.reject("AuthProvider not yet mounted.") 
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const role = await getUserRole(currentUser.uid);
        setUserRole(role);
      } else {
        setUserRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const reauthenticate = async (password: string) => {
    if (!user) {
        throw new Error("Nenhum utilizador está logado.");
    }
    const credential = EmailAuthProvider.credential(user.email!, password);
    await reauthenticateWithCredential(user, credential);
  };

  const value = { user, userRole, loading, reauthenticate };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}