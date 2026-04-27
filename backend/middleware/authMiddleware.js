// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/UserModel');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '') || 
                  req.header('x-auth-token');

    if (!token) {
      return res.status(401).json({ msg: 'No token provided, authorization denied' });
    }


    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    

    const user = await User.findById(decoded.id || decoded.userId);

    if (!user) {
      return res.status(401).json({ msg: 'User not found' });
    }


    const currentDbVersion = user.token_version || 0;
    const tokenPayloadVersion = decoded.v || 0;

    if (tokenPayloadVersion !== currentDbVersion) {
      return res.status(401).json({ 
        msg: 'Session expired. Password was changed recently. Please login again.' 
      });
    }

    if (user.active === false) {

    }

    req.user = user; 

    next();

  } catch (error) {
    console.error('Auth middleware error:', error.message);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ msg: 'Token expired' });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ msg: 'Invalid token' });
    }

    res.status(500).json({ msg: 'Server error' });
  }
};

module.exports = authMiddleware;