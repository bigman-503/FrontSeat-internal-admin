# FrontSeat Fleet Management Dashboard

A real-time fleet management dashboard for monitoring Android tablets across a fleet of vehicles. Built with React, TypeScript, Firebase, and Google Maps.

## 🚀 Features

### Real-time Fleet Monitoring
- **Live Device Status**: Real-time updates every 15 seconds from Android tablets
- **Fleet Overview**: Total devices, online/offline status, battery levels, and uptime
- **Device Management**: Complete device list with filtering and search capabilities
- **Location Tracking**: Interactive Google Maps with real-time device positions
- **Fleet Analytics**: Battery health, network connectivity, and performance metrics

### Dashboard Pages
1. **Dashboard**: Fleet overview with key metrics and recent activity
2. **Devices**: Complete device management with real-time status
3. **Fleet Status**: Detailed fleet health and analytics
4. **Locations**: Interactive map with device tracking
5. **Analytics**: Historical data and trends (coming soon)

## 🏗️ Architecture

### Data Flow
```
Android Tablets → Google Cloud Run → Firestore (Live) + BigQuery (Historical) → React Dashboard
```

### Technology Stack
- **Frontend**: React 18, TypeScript, Tailwind CSS, Shadcn/ui
- **State Management**: React Query, Custom Hooks
- **Real-time Data**: Firebase Firestore listeners
- **Maps**: Google Maps JavaScript API
- **Charts**: Recharts
- **Build Tool**: Vite

## 📊 Data Structure

### Device Information (from Android tablets)
```typescript
interface Device {
  deviceId: string;
  deviceName: string;
  platform: 'android' | 'ios' | 'windows' | 'linux' | 'unknown';
  model: string;
  osVersion: string;
  appVersion: string;
  batteryLevel: number;
  charging: boolean;
  location: {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: number;
  };
  networkStatus: {
    connected: boolean;
    signalStrength?: number;
    type: 'wifi' | 'cellular' | 'ethernet' | 'unknown';
    online: boolean;
  };
  online: boolean;
  storageUsage: number;
  timestamp: string;
  uptime: number;
  screenStatus: {
    isScreenOn: boolean;
    currentApp: string;
    appPackageName: string;
  };
  memoryUsage: number;
  heartbeatCount: number;
  lastSeen: string;
  status: 'online' | 'offline' | 'low_battery' | 'error' | 'maintenance';
}
```

## 🛠️ Setup Instructions

### 1. Environment Configuration

Copy the environment template and configure your services:

```bash
cp env.template .env.local
```

Update `.env.local` with your actual configuration:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id

# Google Maps API Key
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

### 2. Firebase Setup

1. **Create Firebase Project**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project or use existing one
   - Enable Firestore Database

2. **Configure Firestore**:
   - Create Firestore database in production mode
   - Set up security rules for device data access
   - Create collections: `device_heartbeats`, `heartbeat_history`, `device_events`

3. **Firestore Security Rules**:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Device heartbeats - read-only for authenticated users
    match /device_heartbeats/{deviceId} {
      allow read: if request.auth != null;
    }
    
    // Heartbeat history - read-only for authenticated users
    match /heartbeat_history/{document} {
      allow read: if request.auth != null;
    }
    
    // Device events - read/write for authenticated users
    match /device_events/{document} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 3. Google Maps Setup

1. **Get API Key**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Enable Maps JavaScript API
   - Create API key with appropriate restrictions

2. **Configure API Key**:
   - Add your domain to the API key restrictions
   - Enable Maps JavaScript API and Places API

### 4. Install Dependencies

```bash
npm install
```

### 5. Start Development Server

```bash
npm run dev
```

The dashboard will be available at `http://localhost:5173`

## 📱 Android Integration

The dashboard is designed to work with the FrontSeat Android analytics monitor app that sends data every 15 seconds to:

**Endpoint**: `https://frontseat-heartbeat-ingest-102646555109.us-west1.run.app/api/heartbeat`

**Authentication**: `X-Device-Secret: frontseat-secret-20250913-154315`

The Android app sends device data in the format specified in the `Device` interface above.

## 🔧 Key Components

### Services
- **`DeviceService`**: Firestore integration for real-time device data
- **`useDevices`**: React hook for device data management
- **`GoogleMap`**: Interactive map component for device locations

### Pages
- **`Dashboard`**: Fleet overview with metrics and recent activity
- **`Devices`**: Device management with filtering and search
- **`FleetStatus`**: Detailed fleet health analytics
- **`Locations`**: Interactive map with device tracking

### Features
- **Real-time Updates**: Automatic refresh every 15 seconds
- **Error Handling**: Graceful error states and retry mechanisms
- **Loading States**: Smooth loading indicators
- **Responsive Design**: Works on desktop and mobile
- **Search & Filter**: Device filtering by status, platform, battery level
- **Interactive Maps**: Click markers to view device details

## 🎯 Usage

### Fleet Overview
- View total devices, online/offline counts, and battery levels
- Monitor recent device activity and status changes
- Quick access to device locations and health metrics

### Device Management
- Search and filter devices by name, status, or platform
- View detailed device information including battery, network, and uptime
- Monitor device health and performance metrics

### Location Tracking
- Interactive Google Maps with real-time device positions
- Color-coded markers (green = online, red = offline)
- Click markers to view device details
- Center map on selected devices

### Fleet Analytics
- Battery health distribution across the fleet
- Network connectivity analysis
- Device status overview
- Performance metrics and trends

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

### Deploy to Firebase Hosting

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

### Environment Variables for Production

Ensure all environment variables are properly configured in your hosting platform:
- Firebase configuration
- Google Maps API key
- Any other service-specific keys

## 🔒 Security Considerations

1. **API Key Protection**: Never expose API keys in client-side code
2. **Firestore Rules**: Implement proper security rules for data access
3. **Authentication**: Ensure proper user authentication and authorization
4. **Rate Limiting**: Consider implementing rate limiting for API calls

## 📈 Performance Optimization

1. **Real-time Updates**: Efficient Firestore listeners with proper cleanup
2. **Map Performance**: Optimized marker rendering and clustering
3. **Data Caching**: React Query for efficient data caching
4. **Bundle Size**: Code splitting and lazy loading for better performance

## 🐛 Troubleshooting

### Common Issues

1. **Firebase Connection Errors**:
   - Check Firebase configuration
   - Verify Firestore security rules
   - Ensure proper authentication

2. **Google Maps Not Loading**:
   - Verify API key is correct
   - Check API key restrictions
   - Ensure Maps JavaScript API is enabled

3. **Real-time Updates Not Working**:
   - Check Firestore listeners
   - Verify device data format
   - Check network connectivity

4. **Device Data Not Appearing**:
   - Verify Android app is sending data
   - Check Cloud Run ingestion service
   - Verify Firestore data structure

## 📞 Support

For technical support or questions:
1. Check the troubleshooting section above
2. Review Firebase and Google Maps documentation
3. Check the Android app integration status
4. Verify all environment variables are correctly set

## 🔄 Updates and Maintenance

- **Real-time Data**: Automatically updates every 15 seconds
- **Error Recovery**: Automatic retry mechanisms for failed requests
- **Performance Monitoring**: Built-in loading states and error handling
- **Data Validation**: Proper data type checking and validation

The dashboard is designed to be a robust, real-time fleet management solution that provides comprehensive monitoring and control over your device fleet.
