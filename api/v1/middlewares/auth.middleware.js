const jwt = require('jsonwebtoken');


exports.auth = (allowedRoles = []) => {
  return (req, res, next) => {
    // Check for authorization header
    const authHeader = req.headers.authorization || req.headers.Authorization;
    // console.log('authHeader', authHeader);

    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Get token from header
    const token = authHeader.split(' ')[1];

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log(decoded);
      req.user = decoded;

      // Check if user has required role
      if (allowedRoles.length && !allowedRoles.includes(decoded.role)) {
        return res.status(403).json({ message: 'Insufficient permissions' });
      }

      next();
    } catch (err) {
      // Handle different JWT errors specifically
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token expired' });
      }
      if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Invalid token' });
      }
      return res.status(401).json({ message: 'Authentication failed' });
    }
  };
};
