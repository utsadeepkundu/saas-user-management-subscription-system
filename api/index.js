import 'dotenv/config';

import app from '../server/app.js';
import connectDB from '../server/config/db.js';
import { assertRuntimeConfig } from '../server/utils/helpers.js';

export default async function handler(req, res) {
  try {
    assertRuntimeConfig();
    await connectDB();

    // Ensure Express router properly matches subpaths in Vercel serverless functions
    if (req.url && !req.url.startsWith('/api')) {
      req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
    }

    return app(req, res);
  } catch (error) {
    console.error('Serverless invocation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Serverless invocation error.',
      ...(process.env.NODE_ENV === 'development' && { details: error.message }),
    });
  }
}
