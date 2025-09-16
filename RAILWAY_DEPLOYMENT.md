# Railway Backend Deployment Guide

## 🚀 **Step-by-Step Railway Deployment**

### **1. Prepare Your Repository**
✅ **Files already created:**
- `railway.json` - Railway configuration
- `.railwayenv` - Environment variables template
- `package.json` - Updated with build scripts

### **2. Deploy to Railway**

#### **Option A: Deploy from GitHub (Recommended)**
1. **Go to [Railway.app](https://railway.app)**
2. **Sign in with GitHub**
3. **Click "New Project"**
4. **Select "Deploy from GitHub repo"**
5. **Choose your repository:** `bigman-503/FrontSeat-internal-admin`
6. **Railway will auto-detect it's a Node.js project**

#### **Option B: Deploy with Railway CLI**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize project
railway init

# Deploy
railway up
```

### **3. Configure Railway Settings**

#### **Build Settings:**
- **Build Command:** `npm run build:server`
- **Start Command:** `npm run start:server`
- **Root Directory:** `/` (leave empty)

#### **Environment Variables:**
Go to your Railway project → Variables tab and add:

```
GOOGLE_CLOUD_PROJECT_ID=frontseat-admin
NODE_ENV=production
PORT=3001
```

#### **Service Account Key:**
You have two options:

**Option 1: Upload JSON File**
1. Go to Railway project → Files
2. Upload `frontseat-service-account.json`
3. Set `GOOGLE_APPLICATION_CREDENTIALS=./frontseat-service-account.json`

**Option 2: Convert to Environment Variables (Recommended)**
1. Copy the contents of `frontseat-service-account.json`
2. In Railway, add these variables:
```
GOOGLE_APPLICATION_CREDENTIALS={"type":"service_account","project_id":"frontseat-admin",...}
```

### **4. Railway Configuration Details**

The `railway.json` file tells Railway:
- ✅ **Start Command:** `npm run start:server`
- ✅ **Health Check:** `/api/health`
- ✅ **Auto-restart on failure**
- ✅ **Build Type:** NIXPACKS (auto-detects Node.js)

### **5. Build Process**

Railway will automatically:
1. **Install dependencies:** `npm install`
2. **Build TypeScript:** `npm run build:server` (via postinstall)
3. **Start server:** `npm run start:server`
4. **Health check:** Test `/api/health` endpoint

### **6. Get Your Backend URL**

After deployment:
1. **Go to Railway project dashboard**
2. **Copy the generated URL** (e.g., `https://your-app.railway.app`)
3. **Your API will be available at:** `https://your-app.railway.app/api/analytics`

### **7. Update Frontend**

Update your `.env.local` file:
```bash
VITE_API_BASE_URL=https://your-app.railway.app/api
```

### **8. Test the Deployment**

1. **Check health endpoint:**
   ```bash
   curl https://your-app.railway.app/api/health
   ```

2. **Test analytics endpoint:**
   ```bash
   curl -X POST https://your-app.railway.app/api/analytics/device/test-device-123 \
     -H "Content-Type: application/json" \
     -d '{"startDate":"2025-09-01","endDate":"2025-09-16"}'
   ```

### **9. Deploy Frontend to Vercel**

1. **Go to [Vercel.com](https://vercel.com)**
2. **Import your GitHub repository**
3. **Set environment variables:**
   ```
   VITE_FIREBASE_API_KEY=your-key
   VITE_FIREBASE_AUTH_DOMAIN=frontseat-admin.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=frontseat-admin
   VITE_FIREBASE_STORAGE_BUCKET=frontseat-admin.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=102646555109
   VITE_FIREBASE_APP_ID=1:102646555109:web:c2b69d07970664bbc14f0c
   VITE_GOOGLE_MAPS_API_KEY=your-maps-key
   VITE_API_BASE_URL=https://your-app.railway.app/api
   ```
4. **Deploy!**

## 🔧 **Troubleshooting**

### **Build Fails:**
- Check Railway logs for TypeScript errors
- Ensure all dependencies are in `package.json`

### **Service Account Issues:**
- Verify JSON file is uploaded correctly
- Check environment variable format

### **BigQuery Connection:**
- Ensure service account has BigQuery permissions
- Check project ID is correct

## 💰 **Cost**
- **Railway Hobby Plan:** $5/month
- **Includes:** 512MB RAM, 1GB storage
- **Perfect for:** Your analytics backend

## 🎯 **Next Steps**
1. Deploy backend to Railway
2. Get the Railway URL
3. Update frontend environment variables
4. Deploy frontend to Vercel
5. Test the full integration!
