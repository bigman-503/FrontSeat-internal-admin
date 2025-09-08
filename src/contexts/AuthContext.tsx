// Authentication Context for FrontSeat Ad Hub
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/config';
import { AdvertiserUser, getCurrentAdvertiser } from '../firebase/auth';

interface AuthContextType {
  user: User | null;
  advertiser: AdvertiserUser | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName: string, companyName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [advertiser, setAdvertiser] = useState<AdvertiserUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        try {
          const advertiserData = await getCurrentAdvertiser(user);
          setAdvertiser(advertiserData);
        } catch (error) {
          console.error('Error fetching advertiser data:', error);
          setAdvertiser(null);
        }
      } else {
        setAdvertiser(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signUp = async (email: string, password: string, displayName: string, companyName: string) => {
    const { signUpAdvertiser } = await import('../firebase/auth');
    await signUpAdvertiser(email, password, displayName, companyName);
  };

  const signIn = async (email: string, password: string) => {
    const { signInAdvertiser } = await import('../firebase/auth');
    await signInAdvertiser(email, password);
  };

  const signOut = async () => {
    const { signOutAdvertiser } = await import('../firebase/auth');
    await signOutAdvertiser();
  };

  const resetPassword = async (email: string) => {
    const { resetPassword } = await import('../firebase/auth');
    await resetPassword(email);
  };

  const value: AuthContextType = {
    user,
    advertiser,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
