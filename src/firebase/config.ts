// Firebase configuration for FrontSeat Ad Hub
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyA5OifYyKp-Z4OkFjtzyOs_mLD3FgNSzzc",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "frontseat-admin.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "frontseat-admin",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "frontseat-admin.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "102646555109",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:102646555109:web:c2b69d07970664bbc14f0c"
};

// Debug: Log Firebase configuration (without sensitive data)
console.log('🔧 Firebase Config Check:');
console.log('  - API Key:', import.meta.env.VITE_FIREBASE_API_KEY ? '✅ Set' : '❌ Missing');
console.log('  - Auth Domain:', import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ? '✅ Set' : '❌ Missing');
console.log('  - Project ID:', import.meta.env.VITE_FIREBASE_PROJECT_ID ? '✅ Set' : '❌ Missing');
console.log('  - Storage Bucket:', import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ? '✅ Set' : '❌ Missing');
console.log('  - Messaging Sender ID:', import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ? '✅ Set' : '❌ Missing');
console.log('  - App ID:', import.meta.env.VITE_FIREBASE_APP_ID ? '✅ Set' : '❌ Missing');

// Configuration validation (silent in production)

// Validate that all required environment variables are present (with fallbacks)
const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN', 
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !import.meta.env[envVar]);

if (missingEnvVars.length > 0) {
  console.warn(
    `⚠️ Missing environment variables: ${missingEnvVars.join(', ')}\n` +
    'Using fallback values. Please check your .env.local file.'
  );
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Configure Auth settings
auth.useDeviceLanguage();

// Add error handling for auth
auth.onAuthStateChanged((user) => {
  // User authentication state changed
}, (error) => {
  console.error('Auth state change error:', error);
});

// Configure Firestore settings to handle connection issues
import { enableNetwork } from 'firebase/firestore';

// Enable network connection asynchronously
enableNetwork(db).then(() => {
  // Firestore connected successfully
}).catch((error) => {
  console.error('Firestore connection error:', error);
});

export default app;
