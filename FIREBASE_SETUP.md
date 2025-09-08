# Firebase Setup Guide for FrontSeat Ad Hub

## 🚀 **Next Steps to Complete Setup**

### **1. Firebase Project Configuration**

#### **A. Get Your Firebase Config**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing one for "frontseat-ad-hub"
3. Go to Project Settings → General → Your apps
4. Add a Web app (if not already added)
5. Copy the Firebase config object

#### **B. Set Up Environment Variables**
1. Copy the template file: `cp env.template .env.local`
2. Open `.env.local` and replace the placeholder values with your actual Firebase config:

```env
VITE_FIREBASE_API_KEY=your-actual-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-actual-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-actual-sender-id
VITE_FIREBASE_APP_ID=your-actual-app-id
```

**Important**: Never commit `.env.local` to version control - it's already in `.gitignore`.

### **2. Enable Authentication Methods**

#### **A. Email/Password Authentication**
1. Go to Firebase Console → Authentication → Sign-in method
2. Enable "Email/Password" provider
3. Optionally enable "Email link (passwordless sign-in)"

#### **B. Optional: Google Sign-In**
1. In Authentication → Sign-in method
2. Enable "Google" provider
3. Add your domain to authorized domains

### **3. Firestore Database Setup**

#### **A. Create Firestore Database**
1. Go to Firebase Console → Firestore Database
2. Create database in production mode
3. Choose your preferred location

#### **B. Set Up Security Rules**
Replace the default rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Advertisers collection
    match /advertisers/{advertiserId} {
      allow read, write: if request.auth != null 
        && request.auth.uid == advertiserId;
    }
    
    // Users collection
    match /users/{userId} {
      allow read, write: if request.auth != null 
        && request.auth.uid == userId;
    }
    
    // Campaigns collection (will be added later)
    match /campaigns/{campaignId} {
      allow read, write: if request.auth != null 
        && resource.data.advertiserId == get(/databases/$(database)/documents/users/$(request.auth.uid)).data.advertiserId;
    }
  }
}
```

### **4. Test the Authentication**

#### **A. Start the Development Server**
```bash
npm run dev
```

#### **B. Test Sign Up**
1. Navigate to `http://localhost:5173/auth`
2. Click "Sign Up" tab
3. Fill in the form:
   - Full Name: John Doe
   - Company Name: Acme Corp
   - Email: test@example.com
   - Password: password123
4. Click "Create Account"

#### **C. Test Sign In**
1. Use the same credentials to sign in
2. You should be redirected to the dashboard
3. Check the header - it should show your name and company

### **5. Verify Data in Firebase**

#### **A. Check Firestore**
1. Go to Firebase Console → Firestore Database
2. You should see two collections:
   - `advertisers` - Contains advertiser profile data
   - `users` - Contains user authentication data

#### **B. Check Authentication**
1. Go to Firebase Console → Authentication → Users
2. You should see the user you created

### **6. Optional: Add Google Sign-In**

If you want to add Google authentication, update `src/firebase/auth.ts`:

```typescript
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async (): Promise<AdvertiserUser> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Check if advertiser exists
    const advertiserDoc = await getDoc(doc(db, 'advertisers', user.uid));
    
    if (!advertiserDoc.exists()) {
      // Create new advertiser account
      const advertiserData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        companyName: 'Company Name', // You might want to ask for this
        role: 'admin' as const,
        advertiserId: `adv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        lastLogin: new Date(),
        status: 'pending_approval',
        creditLimit: 0,
        currentBalance: 0
      };
      
      await setDoc(doc(db, 'advertisers', user.uid), advertiserData);
      return advertiserData;
    }
    
    return advertiserDoc.data() as AdvertiserUser;
  } catch (error: any) {
    throw new Error(`Google sign in failed: ${error.message}`);
  }
};
```

### **7. Environment Variables Setup**

The project is already configured to use environment variables for better security. The Firebase configuration automatically loads from your `.env.local` file.

## 🎯 **What's Working Now**

✅ **Authentication System**
- Email/password sign up and sign in
- Protected routes (redirects to auth if not logged in)
- User context with advertiser data
- Sign out functionality

✅ **UI Components**
- Beautiful auth page with glassmorphism design
- Form validation and error handling
- Loading states and user feedback
- Responsive design

✅ **Data Structure**
- Advertiser profiles in Firestore
- User authentication data
- Role-based access control ready

## 🚀 **Next Development Steps**

1. **Campaign Management**: Create, edit, delete campaigns
2. **Analytics Dashboard**: Real-time metrics and KPIs
3. **Billing System**: Payment processing and invoicing
4. **Team Management**: Multi-user advertiser accounts
5. **Creative Management**: Upload and manage ad assets
6. **Real-time Updates**: Live campaign performance data

## 🔧 **Troubleshooting**

### **Common Issues**

1. **"Firebase config not found"**
   - Make sure you've updated the config in `src/firebase/config.ts`

2. **"Permission denied"**
   - Check your Firestore security rules
   - Make sure authentication is enabled

3. **"User not found"**
   - Check if the user was created in both Authentication and Firestore
   - Verify the advertiser document was created

4. **"Network error"**
   - Check your internet connection
   - Verify Firebase project is active

### **Debug Mode**
Add this to see detailed Firebase logs:
```typescript
// In src/firebase/config.ts
import { connectFirestoreEmulator } from 'firebase/firestore';

if (import.meta.env.DEV) {
  console.log('Firebase config:', firebaseConfig);
}
```

## 📞 **Need Help?**

If you encounter any issues:
1. Check the browser console for errors
2. Verify Firebase project settings
3. Test with a simple email/password first
4. Check Firestore security rules

The authentication system is now ready! You can start building the campaign management features on top of this solid foundation.
