// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/UserModel');

const authMiddleware = async (req, res, next) => {
  try {
    // 1. Lấy token từ Header (Bearer Token)
    const token = req.header('Authorization')?.replace('Bearer ', '') || 
                  req.header('x-auth-token');

    if (!token) {
      return res.status(401).json({ msg: 'No token provided, authorization denied' });
    }

    // 2. Giải mã Token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 3. Tìm user trong DB
    // Hỗ trợ cả trường hợp payload dùng 'id' hoặc 'userId'
    const user = await User.findById(decoded.id || decoded.userId);

    if (!user) {
      return res.status(401).json({ msg: 'User not found' });
    }

    // 4. [QUAN TRỌNG] Kiểm tra Token Version (Logout All Devices)
    // Nếu version trong token KHÁC với version hiện tại trong DB => Token này đã cũ (do đổi pass)
    const currentDbVersion = user.token_version || 0;
    const tokenPayloadVersion = decoded.v || 0;

    if (tokenPayloadVersion !== currentDbVersion) {
      return res.status(401).json({ 
        msg: 'Session expired. Password was changed recently. Please login again.' 
      });
    }

    // 5. Kiểm tra trạng thái tài khoản (Optional)
    if (user.active === false) {
        // Tùy logic của bạn: Có thể cho phép login lại để kích hoạt, hoặc chặn luôn.
        // Ở đây mình chỉ warn, hoặc bạn có thể uncomment dòng dưới để chặn:
        // return res.status(403).json({ msg: 'Account is deactivated' });
    }

    // 6. Gắn thông tin user vào request để dùng ở controller sau
    req.user = user; 
    // Hoặc nếu muốn gọn nhẹ hơn:
    // req.user = { id: user._id, role: user.role, email: user.email };

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