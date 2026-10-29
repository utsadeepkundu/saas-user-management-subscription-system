import 'dotenv/config';

import app from './app.js';
import connectDB from './config/db.js';
import { assertRuntimeConfig } from './utils/helpers.js';

const PORT = process.env.PORT || 5000;

// Connect to MongoDB and start server
const startServer = async () => {
  try {
    assertRuntimeConfig();
    await connectDB();

    app.listen(PORT, () => {
      console.log(`
╔══════════════════════════════════════════════════╗
║                                                  ║
║   🚀 Server running on port ${PORT}               ║
║   📦 Environment: ${process.env.NODE_ENV || 'development'}              ║
║   🔗 API: http://localhost:${PORT}/api             ║
║                                                  ║
╚══════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
