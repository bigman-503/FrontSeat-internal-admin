# Environment Variables Setup

## 🚀 **Quick Setup**

### **Option 1: Use the Setup Script (Recommended)**
```bash
npm run setup-env
```

### **Option 2: Manual Setup**
1. Copy the template: `cp env.template .env.local`
2. Edit `.env.local` with your Firebase configuration

## 📝 **Environment Variables**

The following environment variables are required:

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_FIREBASE_API_KEY` | Firebase API key | `AIzaSyB...` |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain | `project-id.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID | `frontseat-ad-hub` |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket | `project-id.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID | `123456789` |
| `VITE_FIREBASE_APP_ID` | Firebase app ID | `1:123456789:web:abc123` |

## 🔐 **Security Notes**

- ✅ `.env.local` is already in `.gitignore`
- ✅ Never commit environment variables to version control
- ✅ Use different Firebase projects for development and production
- ✅ Rotate API keys regularly

## 🛠️ **Getting Your Firebase Config**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Project Settings → General
4. Scroll down to "Your apps" section
5. Click on your web app or add a new one
6. Copy the config object values

## 🐛 **Troubleshooting**

### **"Missing required environment variables" Error**
- Make sure `.env.local` exists in the project root
- Check that all variables are set (no empty values)
- Restart your development server after making changes

### **"Firebase config not found" Error**
- Verify your Firebase project is active
- Check that the project ID matches your Firebase project
- Ensure all environment variables are correctly formatted

### **Environment Variables Not Loading**
- Make sure variable names start with `VITE_`
- Restart the development server: `npm run dev`
- Check for typos in variable names

## 📁 **File Structure**

```
frontseat-ad-hub/
├── .env.local          # Your environment variables (gitignored)
├── env.template        # Template file
├── setup-env.js        # Setup script
└── src/
    └── firebase/
        └── config.ts   # Firebase configuration
```

## ✅ **Verification**

After setting up your environment variables:

1. Run `npm run dev`
2. Check the browser console for any Firebase errors
3. Try signing up for a new account
4. Verify data appears in your Firebase Console

If everything works, you're ready to start building! 🎉
