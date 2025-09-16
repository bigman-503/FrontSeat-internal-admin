# Development Guide

## 🚀 **Two Development Modes**

Your app has two development modes depending on what you want to test:

### **Mode 1: Frontend Only** (`npm run dev`)
- ✅ **What it does:** Runs only the React frontend
- ✅ **API calls:** Fail gracefully and show sample data
- ✅ **Use case:** Frontend development, UI changes, styling
- ❌ **API routes:** Not available (shows "Development mode" message)

### **Mode 2: Full Stack** (`npm run dev:full` or `vercel dev`)
- ✅ **What it does:** Runs both frontend and API routes
- ✅ **API calls:** Work with real BigQuery integration
- ✅ **Use case:** Testing complete functionality, API development
- ✅ **API routes:** Available at `/api/*`

## 🔧 **Current Issue & Solution**

### **The Problem:**
When you run `npm run dev`, you see:
> "Development mode: Using sample data. Run 'npm run dev:full' for API routes."

This is **expected behavior** because:
1. `npm run dev` only starts the Vite frontend server
2. API routes are only available with `vercel dev`
3. The app gracefully falls back to sample data

### **The Solution:**
To test with real API routes, use:

```bash
# Stop current dev server (Ctrl+C)
# Then run:
npm run dev:full
# or
vercel dev
```

## 📊 **Testing Your API Routes**

### **1. Start Full-Stack Development:**
```bash
npm run dev:full
```

### **2. Test API Endpoints:**
```bash
# Health check
curl http://localhost:3000/api/health

# Device analytics (replace with real device ID)
curl -X POST http://localhost:3000/api/analytics/device/test-device \
  -H "Content-Type: application/json" \
  -d '{"startDate":"2024-01-01","endDate":"2024-01-07"}'
```

### **3. Check Browser Console:**
Look for these messages:
- ✅ `"Retrieved real data from BigQuery"` - API working
- ⚠️ `"Retrieved mock data from API"` - API working but using mock data
- ❌ `"Error fetching from API"` - API not working

## 🎯 **Quick Fix for Your Current Issue**

1. **Stop your current dev server** (Ctrl+C in terminal)
2. **Run full-stack mode:**
   ```bash
   npm run dev:full
   ```
3. **Open browser** to http://localhost:3000
4. **Test device analytics** - should now show real data (or proper error messages)

## 🔍 **Debugging API Issues**

### **Check Environment Variables:**
Make sure you have `.env.local` with:
```bash
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=path-to-service-account.json
```

### **Check API Response:**
In browser console, look for:
```javascript
// Should see this for successful API calls:
🔍 AnalyticsService: Fetching analytics for device...
✅ AnalyticsService: Retrieved real data from BigQuery
```

### **Check Vercel Dev Logs:**
When running `vercel dev`, watch the terminal for:
```
📊 Fetching analytics for device...
✅ Successfully processed X days of real data
```

## 💡 **Pro Tips**

1. **For UI development:** Use `npm run dev` (faster, no API setup needed)
2. **For full testing:** Use `npm run dev:full` (complete functionality)
3. **For production testing:** Deploy to Vercel (real environment)

## 🚨 **Common Issues**

### **"API not responding"**
- Make sure you're using `npm run dev:full`, not `npm run dev`
- Check that Vercel CLI is installed: `npm install -g vercel`

### **"BigQuery not configured"**
- Check your `.env.local` file
- Verify service account permissions
- Look at Vercel dev logs for specific errors

### **Still showing sample data**
- Check browser console for API call logs
- Verify you're using the full-stack dev mode
- Test API endpoints directly with curl

## 🎉 **Success Indicators**

When everything is working correctly, you should see:
- ✅ No "Development mode" banner in the UI
- ✅ Real data from BigQuery (or proper error messages)
- ✅ Console logs showing successful API calls
- ✅ API endpoints responding to curl requests
