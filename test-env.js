import { readFileSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, '..');

console.log('Testing environment variable loading...');

try {
  // Try to read .env.local directly
  const envPath = resolve(__dirname, '.env.local');
  const envContent = readFileSync(envPath, 'utf8');
  console.log('📄 .env.local content:');
  console.log(envContent);
  
  // Parse environment variables
  const envVars = {};
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      envVars[key.trim()] = value.trim();
    }
  });
  
  console.log('🔍 Parsed environment variables:');
  Object.entries(envVars).forEach(([key, value]) => {
    console.log(`  ${key}: ${value ? '✅ Set' : '❌ Empty'}`);
  });
  
} catch (error) {
  console.error('❌ Error reading .env.local:', error.message);
}
