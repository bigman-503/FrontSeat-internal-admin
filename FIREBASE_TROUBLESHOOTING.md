# Firebase Firestore Connection Troubleshooting

## Issue: 400 Bad Request Errors with Firestore

You're experiencing Firebase Firestore connection errors with 400 Bad Request responses. This guide will help you resolve these issues.

## Root Causes & Solutions

### 1. Firestore Security Rules
**Problem**: The most common cause of 400 errors is restrictive or missing Firestore security rules.

**Solution**: 
1. Go to your Firebase Console: https://console.firebase.google.com/
2. Select your project: `frontseat-advertiser`
3. Navigate to Firestore Database → Rules
4. Replace the existing rules with the content from `firestore.rules` file in this project
5. Click "Publish"

### 2. Database Configuration
**Problem**: Firestore database might not be in the correct mode or location.

**Solution**:
1. In Firebase Console, go to Firestore Database
2. Ensure your database is named "(default)" 
3. Ensure it's in "Native mode" (not Datastore mode)
4. If you have a custom-named database, consider creating a new one with the default name

### 3. Project Configuration
**Problem**: Incorrect Firebase project settings or missing services.

**Solution**:
1. Verify your `.env.local` file has the correct values:
   ```
   VITE_FIREBASE_API_KEY=your-api-key
   VITE_FIREBASE_AUTH_DOMAIN=frontseat-advertiser.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=frontseat-advertiser
   VITE_FIREBASE_STORAGE_BUCKET=frontseat-advertiser.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=529082545618
   VITE_FIREBASE_APP_ID=1:529082545618:web:e21bd5a0af124aa3f3440b
   ```

2. Enable required services in Firebase Console:
   - Authentication (Email/Password provider)
   - Firestore Database
   - Storage (if using file uploads)

### 4. Network Connectivity
**Problem**: Network issues or firewall blocking Firebase connections.

**Solution**: The code now includes automatic network connection handling. If issues persist:
1. Check your internet connection
2. Try disabling VPN if you're using one
3. Check if your firewall is blocking Firebase domains

## Testing Your Setup

### 1. Check Connection Status
The Auth page now shows a connection status indicator:
- ✅ Database connected - Everything is working
- ❌ Database connection failed - Check the steps above

### 2. Browser Console
Check the browser console for:
- "Firestore connected successfully" - Good sign
- Any specific error messages that can help identify the issue

### 3. Firebase Console
1. Go to Firebase Console → Authentication → Users
2. Try creating a test user manually
3. Go to Firestore Database → Data
4. Check if you can read/write documents

## Step-by-Step Fix

1. **Update Firestore Rules**:
   ```bash
   # Copy the rules from firestore.rules to Firebase Console
   ```

2. **Verify Environment Variables**:
   ```bash
   # Check your .env.local file has all required variables
   ```

3. **Restart Development Server**:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. **Test Connection**:
   - Open the app
   - Check the connection status on the Auth page
   - Try creating an account

## Common Error Messages & Solutions

### "Missing required environment variables"
- Check your `.env.local` file exists and has all required variables
- Restart your development server after adding environment variables

### "Permission denied"
- Update your Firestore security rules
- Ensure the user is authenticated before accessing Firestore

### "Network error" or "Transport errored"
- Check your internet connection
- Try disabling VPN
- The code now includes automatic retry logic

## Still Having Issues?

1. Check the browser console for specific error messages
2. Verify your Firebase project is active and billing is set up (if required)
3. Try creating a new Firebase project and updating the environment variables
4. Check if your organization has any firewall restrictions

## Files Modified

- `src/firebase/config.ts` - Added connection handling
- `src/pages/Auth.tsx` - Added connection status indicator
- `src/utils/firestore-test.ts` - Added connection testing utility
- `firestore.rules` - Added security rules template
