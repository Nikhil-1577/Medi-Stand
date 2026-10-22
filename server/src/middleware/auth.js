const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // If in demo mode and no token, attach a mock caregiver user for frictionless operation
  if (!token && (process.env.DEMO_MODE === 'true' || process.env.NODE_ENV === 'development')) {
    req.user = {
      _id: '000000000000000000000001',
      name: 'Dr. Om Jagdhane (Lead Caregiver)',
      email: 'om.jagdhane@medistand.io',
      role: 'admin',
    };
    return next();
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized to access this route. Please log in.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'medistand_jwt_secret_dev_key_2026_xyz');
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired authentication token' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to perform this action`,
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
