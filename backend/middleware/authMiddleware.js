// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/UserModel'); // Đảm bảo bạn có UserModel

const authMiddleware = async (req, res, next) => {
  try {
    // Lấy token từ header
    const token = req.header('Authorization')?.replace('Bearer ', '') || 
                  req.header('x-auth-token') ||
                  req.cookies?.token; // Nếu sử dụng cookies

    // Kiểm tra có token không
    if (!token) {
      return res.status(401).json({ 
        msg: 'No token provided, authorization denied' 
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'htsocialsecrectkey');
    
    // Lấy thông tin user từ database
    const user = await User.findById(decoded.userId || decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        msg: 'User not found, token invalid' 
      });
    }

    // Kiểm tra user có active không (tùy chọn)
    if (user.isActive === false) {
      return res.status(401).json({ 
        msg: 'Account is deactivated' 
      });
    }

    // Gắn user info vào request
    req.user = {
      userId: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role || 'user'
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    // Xử lý các loại lỗi khác nhau
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ msg: 'Invalid token' });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ msg: 'Token expired' });
    }

    res.status(500).json({ msg: 'Server error in authentication' });
  }
};

module.exports = authMiddleware;