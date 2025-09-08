# Update .env.local with complete Firebase configuration
$envContent = @"
VITE_FIREBASE_API_KEY=AIzaSyCdctIfWauSSkVv23cvS8sEp2LR1TOXcS0
VITE_FIREBASE_AUTH_DOMAIN=frontseat-advertiser.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=frontseat-advertiser
VITE_FIREBASE_STORAGE_BUCKET=frontseat-advertiser.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=529082545618
VITE_FIREBASE_APP_ID=1:529082545618:web:e21bd5a0af124aa3f3440b
"@

$envContent | Out-File -FilePath ".env.local" -Encoding UTF8
Write-Host "✅ Updated .env.local with complete Firebase configuration!"
Write-Host "🎉 All environment variables are now configured!"
