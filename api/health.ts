import { VercelRequest, VercelResponse } from '@vercel/node';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.json({ status: 'ok', message: 'Backend API is running' });
}
