const mongoose = require('mongoose');

// Middleware to check if a URL parameter is a valid MongoDB ObjectId
const validateParamId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    if (id && !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid ID format for parameter '${paramName}': ${id}`
      });
    }
    next();
  };
};

module.exports = {
  validateParamId
};
