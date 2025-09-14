@echo off
echo Creating .env.local file...

(
echo # Firebase Configuration for FrontSeat Fleet Management
echo VITE_FIREBASE_API_KEY=AIzaSyA5OifYyKp-Z4OkFjtzyOs_mLD3FgNSzzc
echo VITE_FIREBASE_AUTH_DOMAIN=frontseat-admin.firebaseapp.com
echo VITE_FIREBASE_PROJECT_ID=frontseat-admin
echo VITE_FIREBASE_STORAGE_BUCKET=frontseat-admin.firebasestorage.app
echo VITE_FIREBASE_MESSAGING_SENDER_ID=102646555109
echo VITE_FIREBASE_APP_ID=1:102646555109:web:c2b69d07970664bbc14f0c
echo.
echo # Google Maps API Key for device location tracking
echo VITE_GOOGLE_MAPS_API_KEY=AIzaSyDMug8i1h5yRY82V9SRURoLY6oawKPD8_Y
) > .env.local

echo .env.local file created successfully!
echo.
echo Please restart your development server: npm run dev
