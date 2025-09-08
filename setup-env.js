#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Setting up FrontSeat Ad Hub environment...\n');

// Check if .env.local already exists
const envPath = path.join(process.cwd(), '.env.local');
const templatePath = path.join(process.cwd(), 'env.template');

if (fs.existsSync(envPath)) {
  console.log('⚠️  .env.local already exists!');
  console.log('   If you want to reset it, delete .env.local and run this script again.\n');
  process.exit(0);
}

// Check if template exists
if (!fs.existsSync(templatePath)) {
  console.log('❌ env.template not found!');
  console.log('   Please make sure env.template exists in the project root.\n');
  process.exit(1);
}

// Copy template to .env.local
try {
  fs.copyFileSync(templatePath, envPath);
  console.log('✅ Created .env.local from template');
  console.log('📝 Next steps:');
  console.log('   1. Open .env.local in your editor');
  console.log('   2. Replace the placeholder values with your Firebase config');
  console.log('   3. Get your Firebase config from: https://console.firebase.google.com/');
  console.log('   4. Run: npm run dev');
  console.log('\n🔐 Security note: .env.local is already in .gitignore');
} catch (error) {
  console.log('❌ Error creating .env.local:', error.message);
  process.exit(1);
}
