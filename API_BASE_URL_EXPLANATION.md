# VITE_API_BASE_URL Explained

## What is VITE_API_BASE_URL?

`VITE_API_BASE_URL` is an environment variable that tells your frontend application where to find the backend API server. It's like giving your frontend the address of the backend service.

## Why Do You Need It?

### 1. **Separation of Concerns**
- **Frontend**: Handles user interface, displays data, user interactions
- **Backend**: Handles data processing, database queries, BigQuery integration
- **API**: The communication bridge between them

### 2. **Security**
- **BigQuery credentials** stay on the backend (server-side)
- **Frontend** never directly accesses BigQuery
- **API keys** and sensitive data are protected

### 3. **Scalability**
- **Frontend** can be deployed to CDN (like Vercel, Netlify)
- **Backend** can be deployed separately (like Google Cloud Run, AWS Lambda)
- **Independent scaling** of frontend and backend

## How It Works

```
Frontend (Browser) → API Call → Backend Server → BigQuery
     ↓                    ↓           ↓
  User clicks      fetch('/api/...')  Process data
  device row           ↓           ↓
     ↓            HTTP Request   Return JSON
  Show analytics   ← JSON Response ←
```

## Environment Variable Setup

### 1. **Development (Local)**
Create `.env.local` file:
```env
VITE_API_BASE_URL=http://localhost:3001/api
```

### 2. **Production**
Set in your deployment platform:
```env
VITE_API_BASE_URL=https://your-backend-api.com/api
```

## What Happens Without It?

If `VITE_API_BASE_URL` is not set, the service defaults to `/api`, which means:
- Frontend tries to call `http://localhost:8081/api/analytics/device/123`
- This will fail because there's no backend running
- User sees "Analytics Not Available" message

## Backend API Endpoints

The frontend expects these endpoints to exist:

### Device Analytics
```
POST /api/analytics/device/{deviceId}
Body: { startDate: "2024-01-01", endDate: "2024-01-31" }
Response: DeviceHistoricalData
```

### Device Events
```
GET /api/analytics/device/{deviceId}/events?limit=100
Response: Array of device events
```

### Fleet Analytics
```
POST /api/analytics/fleet
Body: { startDate: "2024-01-01", endDate: "2024-01-31" }
Response: Fleet analytics data
```

## Example Backend Implementation

See `backend-api-example.js` for a complete Node.js/Express implementation that:
- Uses BigQuery client library
- Provides all required endpoints
- Handles CORS for frontend requests
- Returns properly formatted data

## Deployment Options

### Option 1: Same Server
- Deploy frontend and backend on same server
- Use relative URLs: `VITE_API_BASE_URL=/api`

### Option 2: Separate Servers
- Frontend: Vercel, Netlify, GitHub Pages
- Backend: Google Cloud Run, AWS Lambda, Heroku
- Use full URLs: `VITE_API_BASE_URL=https://api.yourdomain.com`

### Option 3: Development
- Frontend: `http://localhost:8081`
- Backend: `http://localhost:3001`
- Use: `VITE_API_BASE_URL=http://localhost:3001/api`

## Benefits of This Architecture

1. **Security**: Sensitive credentials stay on backend
2. **Performance**: Backend can cache data, optimize queries
3. **Reliability**: Backend handles BigQuery connection issues
4. **Flexibility**: Easy to change backend without affecting frontend
5. **Scalability**: Frontend and backend can scale independently

## Troubleshooting

### "Analytics Not Available" Message
1. Check if backend is running
2. Verify `VITE_API_BASE_URL` is set correctly
3. Check browser network tab for failed requests
4. Ensure backend has proper CORS configuration

### CORS Errors
Add to your backend:
```javascript
const cors = require('cors');
app.use(cors({
  origin: ['http://localhost:8081', 'https://your-frontend-domain.com']
}));
```

### Network Errors
- Check if backend URL is accessible
- Verify firewall settings
- Ensure backend is listening on correct port

## Summary

`VITE_API_BASE_URL` is essential for:
- **Security**: Keeps BigQuery credentials safe on backend
- **Architecture**: Proper separation of frontend and backend
- **Scalability**: Independent deployment and scaling
- **Development**: Easy local development setup

Without it, you'll see "Analytics Not Available" because the frontend can't reach the backend API that provides the real data.
