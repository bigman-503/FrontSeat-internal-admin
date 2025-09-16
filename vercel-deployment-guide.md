# Vercel Deployment Guide - Full Stack App

## 🎯 **Current Architecture: Vercel API Routes**

This app now uses **Vercel API Routes** for the backend, meaning everything runs on Vercel as serverless functions.

### **What's Included:**
- ✅ **Frontend:** React + Vite (deployed to Vercel)
- ✅ **Backend:** Serverless API routes (deployed to Vercel)
- ✅ **BigQuery Integration:** Built into API routes
- ✅ **Single Deployment:** Everything in one place

## 🚀 **Deployment Steps**

### **1. Deploy to Vercel**

```bash
# Install Vercel CLI (if not already installed)
npm i -g vercel

# Deploy from your project root
vercel

# Follow the prompts:
# - Set up and deploy? Y
# - Which scope? (your account)
# - Link to existing project? N
# - Project name: frontseat-internal-admin
# - Directory: ./
# - Override settings? N
```

### **2. Set Environment Variables in Vercel**

Go to your Vercel dashboard → Project Settings → Environment Variables:

```bash
# Firebase (for frontend)
VITE_FIREBASE_API_KEY=your-firebase-key
VITE_FIREBASE_AUTH_DOMAIN=frontseat-admin.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=frontseat-admin
VITE_FIREBASE_STORAGE_BUCKET=frontseat-admin.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=102646555109
VITE_FIREBASE_APP_ID=1:102646555109:web:c2b69d07970664bbc14f0c
VITE_GOOGLE_MAPS_API_KEY=your-maps-key

# BigQuery (for API routes)
GOOGLE_CLOUD_PROJECT_ID=frontseat-admin
GOOGLE_APPLICATION_CREDENTIALS=your-service-account-json-content

# Optional: Override API base URL (defaults to /api)
VITE_API_BASE_URL=/api
```

### **3. Test Your Deployment**

Your API endpoints will be available at:
- `https://your-app.vercel.app/api/health`
- `https://your-app.vercel.app/api/test`
- `https://your-app.vercel.app/api/analytics/device/[deviceId]`
- `https://your-app.vercel.app/api/analytics/fleet`

## 🔧 **Local Development**

### **Option 1: Use Vercel CLI (Recommended)**
```bash
# Install Vercel CLI
npm i -g vercel

# Run locally with API routes
vercel dev

# This will start both frontend and API routes
# Frontend: http://localhost:3000
# API: http://localhost:3000/api/*
```

### **Option 2: Frontend Only (for quick frontend changes)**
```bash
# Just run the frontend (API calls will go to production)
npm run dev
```

## 📊 **How It Works**

### **Frontend → API Routes**
1. Frontend makes request to `/api/analytics/device/123`
2. Vercel routes this to `api/analytics/device/[deviceId].ts`
3. Serverless function executes (with BigQuery if configured)
4. Response sent back to frontend

### **BigQuery Integration**
- API routes have access to your BigQuery credentials
- Same logic as your original Express server
- Falls back to mock data if BigQuery not configured

## 💰 **Cost Comparison**

| Service | Cost | Notes |
|---------|------|-------|
| **Vercel (Current)** | $0-20/month | Free tier: 100GB bandwidth, 1000 serverless function invocations |
| **Render (Previous)** | $7/month | Always-on server |
| **Railway** | $5/month | Always-on server |

**Winner: Vercel** - Pay only for what you use!

## 🔄 **Migration Benefits**

### **Before (Render + Vercel)**
- ❌ Two separate deployments
- ❌ Two different platforms to manage
- ❌ Higher costs ($7 + $0-20)
- ❌ More complex CI/CD

### **After (Vercel Only)**
- ✅ Single deployment
- ✅ One platform to manage
- ✅ Lower costs ($0-20 total)
- ✅ Simpler CI/CD
- ✅ Better performance (CDN + edge functions)

## 🛠 **Troubleshooting**

### **API Routes Not Working?**
1. Check Vercel function logs in dashboard
2. Ensure environment variables are set
3. Test with `/api/test` endpoint first

### **BigQuery Issues?**
1. Verify `GOOGLE_CLOUD_PROJECT_ID` is set
2. Check service account permissions
3. Look at function logs for BigQuery errors

### **CORS Issues?**
- API routes include CORS headers
- Should work out of the box

## 🎉 **You're Done!**

Your app now runs entirely on Vercel with:
- ✅ Frontend (React + Vite)
- ✅ Backend (Serverless API routes)
- ✅ BigQuery integration
- ✅ Single deployment
- ✅ Cost effective

**No more separate backend services needed!** 🚀
