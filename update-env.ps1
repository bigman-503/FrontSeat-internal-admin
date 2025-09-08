# Update .env.local with Firebase configuration
$envContent = @"
VITE_FIREBASE_API_KEY=AIzaSyCdctIfWauSSkVv23cvS8sEp2LR1TOXcS0
VITE_FIREBASE_AUTH_DOMAIN=frontseat-advertiser.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=frontseat-advertiser
VITE_FIREBASE_STORAGE_BUCKET=frontseat-advertiser.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=529082545618
VITE_FIREBASE_APP_ID=your-app-id-here
"@

$envContent | Out-File -FilePath ".env.local" -Encoding UTF8
Write-Host "✅ Updated .env.local with your Firebase configuration"
Write-Host "⚠️  You still need to get the App ID from Firebase Console"
Write-Host "   Go to: Project Settings → General → Your apps → Web app"
