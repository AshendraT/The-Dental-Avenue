const app = require('../backend/src/app');
const connectDB = require('../backend/src/config/db');

module.exports = async (req, res) => {
  try {
    await connectDB();
  } catch (error) {
    console.error('Database connection failure in serverless function:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to connect to database'
    });
  }
  return app(req, res);
};
