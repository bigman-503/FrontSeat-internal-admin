#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Verifying FrontSeat Ad Hub setup...\n');

// Check if .env.local exists
const envPath = path.join(process.cwd(), '.env.local');

if (!fs.existsSync(envPath)) {
  console.log('❌ .env.local not found!');
  console.log('   Run: npm run setup-env');
  process.exit(1);
}

// Read and validate .env.local
const envContent = fs.readFileSync(envPath, 'utf8');
const envLines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));

const requiredVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID'
];

const envVars = {};
envLines.forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim();
  }
});

console.log('📋 Environment Variables Status:');
console.log('================================');

let allValid = true;

requiredVars.forEach(varName => {
  const value = envVars[varName];
  if (!value || value.includes('your-') || value.includes('here')) {
    console.log(`❌ ${varName}: Not configured`);
    allValid = false;
  } else {
    console.log(`✅ ${varName}: Configured`);
  }
});

console.log('\n📁 File Structure:');
console.log('==================');

const filesToCheck = [
  'src/firebase/config.ts',
  'src/firebase/auth.ts',
  'src/contexts/AuthContext.tsx',
  'src/pages/Auth.tsx',
  'src/components/ProtectedRoute.tsx'
];

filesToCheck.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file}: Missing`);
    allValid = false;
  }
});

console.log('\n🎯 Next Steps:');
console.log('===============');

if (allValid) {
  console.log('✅ Setup looks good!');
  console.log('   1. Run: npm run dev');
  console.log('   2. Go to: http://localhost:5173/auth');
  console.log('   3. Try signing up for a new account');
  console.log('   4. Check your Firebase Console for data');
} else {
  console.log('⚠️  Setup incomplete:');
  console.log('   1. Update .env.local with your Firebase config');
  console.log('   2. Get config from: https://console.firebase.google.com/');
  console.log('   3. Run this script again to verify');
}

console.log('\n🔗 Useful Links:');
console.log('================');
console.log('• Firebase Console: https://console.firebase.google.com/');
console.log('• Setup Guide: FIREBASE_SETUP.md');
console.log('• Environment Guide: ENV_SETUP.md');
