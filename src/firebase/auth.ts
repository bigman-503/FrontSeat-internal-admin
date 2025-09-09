// Firebase Authentication utilities
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  User,
  UserCredential
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './config';

// User interface for our app
export interface AdvertiserUser {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'manager' | 'viewer';
  advertiserId: string;
  createdAt: Date;
  lastLogin: Date;
}

// Sign up new advertiser
export const signUpAdvertiser = async (
  email: string,
  password: string,
  displayName: string
): Promise<AdvertiserUser> => {
  try {
    // Create user with email and password
    const userCredential: UserCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    const user = userCredential.user;

    // Update display name
    await updateProfile(user, {
      displayName: displayName
    });

    // Create advertiser document
    const advertiserId = `adv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const advertiserData = {
      uid: user.uid,
      email: user.email,
      displayName: displayName,
      role: 'admin' as const,
      advertiserId: advertiserId,
      createdAt: new Date(),
      lastLogin: new Date(),
      status: 'pending_approval',
      creditLimit: 0,
      currentBalance: 0
    };

    // Save to Firestore
    await setDoc(doc(db, 'advertisers', user.uid), advertiserData);
    await setDoc(doc(db, 'users', user.uid), {
      advertiserId: advertiserId,
      role: 'admin',
      permissions: ['campaign:read', 'campaign:write', 'analytics:read', 'billing:read']
    });

    return advertiserData;
  } catch (error: any) {
    throw new Error(`Sign up failed: ${error.message}`);
  }
};

// Sign in existing advertiser
export const signInAdvertiser = async (
  email: string,
  password: string
): Promise<AdvertiserUser> => {
  try {
    const userCredential: UserCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    const user = userCredential.user;

    // Get advertiser data from Firestore
    const advertiserDoc = await getDoc(doc(db, 'advertisers', user.uid));
    
    if (!advertiserDoc.exists()) {
      throw new Error('Advertiser account not found');
    }

    const advertiserData = advertiserDoc.data() as AdvertiserUser;

    // Update last login
    await setDoc(doc(db, 'advertisers', user.uid), {
      lastLogin: new Date()
    }, { merge: true });

    return {
      ...advertiserData,
      lastLogin: new Date()
    };
  } catch (error: any) {
    throw new Error(`Sign in failed: ${error.message}`);
  }
};

// Sign out
export const signOutAdvertiser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error: any) {
    throw new Error(`Sign out failed: ${error.message}`);
  }
};

// Reset password
export const resetPassword = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    throw new Error(`Password reset failed: ${error.message}`);
  }
};

// Get current user data
export const getCurrentAdvertiser = async (user: User): Promise<AdvertiserUser | null> => {
  try {
    const advertiserDoc = await getDoc(doc(db, 'advertisers', user.uid));
    
    if (!advertiserDoc.exists()) {
      return null;
    }

    return advertiserDoc.data() as AdvertiserUser;
  } catch (error: any) {
    console.error('Error getting current advertiser:', error);
    return null;
  }
};
