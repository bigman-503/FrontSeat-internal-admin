# Vercel Deployment Guide

## 🚀 **Option 1: Separate Backend + Vercel Frontend (Recommended)**

### **Frontend Deployment (Vercel)**
1. **Connect your GitHub repo to Vercel**
2. **Set build settings:**
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
3. **Environment Variables in Vercel:**
   ```
   VITE_FIREBASE_API_KEY=your-firebase-key
   VITE_FIREBASE_AUTH_DOMAIN=frontseat-admin.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=frontseat-admin
   VITE_FIREBASE_STORAGE_BUCKET=frontseat-admin.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=102646555109
   VITE_FIREBASE_APP_ID=1:102646555109:web:c2b69d07970664bbc14f0c
   VITE_GOOGLE_MAPS_API_KEY=your-maps-key
   VITE_API_BASE_URL=https://your-backend-url.com/api
   ```

### **Backend Deployment (Railway - Recommended)**
1. **Go to [Railway.app](https://railway.app)**
2. **Connect GitHub and select your repo**
3. **Set up environment variables:**
   ```
   GOOGLE_CLOUD_PROJECT_ID=frontseat-admin
   GOOGLE_APPLICATION_CREDENTIALS=./frontseat-service-account.json
   PORT=3001
   ```
4. **Upload service account file** (or use environment variable)
5. **Deploy!** Railway will automatically detect it's a Node.js app

### **Backend Deployment (Google Cloud Run)**
1. **Create a Dockerfile:**
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   COPY . .
   RUN npm run build:server
   EXPOSE 3001
   CMD ["npm", "run", "start:server"]
   ```
2. **Deploy to Cloud Run:**
   ```bash
   gcloud run deploy frontseat-backend \
     --source . \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated
   ```

## 🔄 **Option 2: Vercel API Routes (Serverless)**

### **Convert Backend to Vercel Functions**
1. **Create `api/analytics/device/[deviceId].ts`:**
   ```typescript
   import { VercelRequest, VercelResponse } from '@vercel/node';
   import { BigQuery } from '@google-cloud/bigquery';

   export default async function handler(req: VercelRequest, res: VercelResponse) {
     // Move your BigQuery logic here
     // This becomes a serverless function
   }
   ```

2. **Deploy everything to Vercel**
3. **Update frontend to use `/api/analytics/device/[deviceId]`**

## 📋 **Recommended Approach**

**Use Option 1** because:
- ✅ Your current backend code works perfectly
- ✅ Better performance (always-on server)
- ✅ Easier to debug and maintain
- ✅ Can handle more complex BigQuery operations
- ✅ Better for real-time analytics

## 🔧 **Quick Setup Steps**

1. **Deploy backend to Railway:**
   - Connect GitHub repo
   - Add environment variables
   - Deploy

2. **Deploy frontend to Vercel:**
   - Connect GitHub repo
   - Add environment variables
   - Update `VITE_API_BASE_URL` to Railway URL

3. **Test the integration:**
   - Frontend calls backend API
   - Backend queries BigQuery
   - Real analytics data flows through

## 💰 **Cost Estimate**

- **Vercel Frontend:** Free tier (hobby plan)
- **Railway Backend:** $5/month (hobby plan)
- **Google Cloud BigQuery:** Pay per query (very cheap)
- **Total:** ~$5-10/month

## 🎯 **Next Steps**

1. Choose your backend platform (Railway recommended)
2. Deploy backend first
3. Update frontend environment variables
4. Deploy frontend to Vercel
5. Test the full integration
