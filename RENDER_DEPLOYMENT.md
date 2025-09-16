# Render Backend Deployment Guide

## 🚀 **Step-by-Step Render Deployment**

### **1. Prepare Your Repository**
✅ **Files already created:**
- `render.yaml` - Render configuration
- `package.json` - Updated with build scripts
- `frontseat-service-account.json` - BigQuery credentials

### **2. Deploy to Render**

#### **Option A: Deploy from GitHub (Recommended)**
1. **Go to [Render.com](https://render.com)**
2. **Sign in with GitHub**
3. **Click "New +" → "Web Service"**
4. **Connect your repository:** `bigman-503/FrontSeat-internal-admin`
5. **Render will auto-detect the `render.yaml` configuration**

#### **Option B: Manual Configuration**
If auto-detection doesn't work:
- **Build Command:** `npm install && npm run build:server`
- **Start Command:** `npm run start:server`
- **Environment:** Node
- **Plan:** Free

### **3. Configure Environment Variables**

In your Render dashboard, go to **Environment** tab and add:

```
NODE_ENV=production
PORT=3001
GOOGLE_CLOUD_PROJECT_ID=frontseat-admin
```

### **4. Upload Service Account File**

**Option A: Upload as Secret File (Recommended)**
1. Go to **Environment** tab in Render
2. Click **"Add Secret File"**
3. Name: `GOOGLE_APPLICATION_CREDENTIALS`
4. Upload your `frontseat-service-account.json` file

**Option B: Convert to Environment Variable**
1. Copy the entire contents of `frontseat-service-account.json`
2. In Render Environment tab, add:
   - Key: `GOOGLE_APPLICATION_CREDENTIALS`
   - Value: `{"type":"service_account","project_id":"frontseat-admin",...}`

### **5. Deploy and Get URL**

1. **Click "Create Web Service"**
2. **Wait for deployment to complete** (usually 2-3 minutes)
3. **Copy the generated URL** (e.g., `https://frontseat-backend.onrender.com`)

### **6. Update Frontend Environment**

Update your `.env.local` file:
```bash
VITE_API_BASE_URL=https://your-render-app-name.onrender.com/api
```

### **7. Test the Deployment**

1. **Check health endpoint:**
   ```bash
   curl https://your-render-app-name.onrender.com/api/health
   ```

2. **Test analytics endpoint:**
   ```bash
   curl -X POST https://your-render-app-name.onrender.com/api/analytics/device/test-device-123 \
     -H "Content-Type: application/json" \
     -d '{"startDate":"2025-09-01","endDate":"2025-09-16"}'
   ```

## 🔧 **Troubleshooting**

### **Build Fails:**
- Check Render logs for TypeScript errors
- Ensure all dependencies are in `package.json`

### **Service Account Issues:**
- Verify JSON file is uploaded correctly
- Check environment variable format

### **BigQuery Connection:**
- Ensure service account has BigQuery permissions
- Check project ID is correct

### **Render Free Tier Limitations:**
- **Sleeps after 15 minutes** of inactivity
- **Cold start** takes 30-60 seconds
- **Perfect for development/testing**

## 💰 **Cost**
- **Render Free Plan:** $0/month
- **Includes:** 750 hours/month, 512MB RAM
- **Perfect for:** Development and testing

## 🎯 **Next Steps**
1. Deploy backend to Render
2. Get the Render URL
3. Update frontend environment variables
4. Deploy frontend to Vercel
5. Test the full integration!

## 📝 **Render vs Railway**

| Feature | Render | Railway |
|---------|--------|---------|
| **Free Tier** | 750 hours/month | 500 hours/month |
| **Sleep Mode** | 15 min inactivity | 5 min inactivity |
| **Cold Start** | 30-60 seconds | 10-30 seconds |
| **Reliability** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Ease of Use** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Configuration** | Simple YAML | Multiple files needed |

**Render is the better choice for your use case!**
