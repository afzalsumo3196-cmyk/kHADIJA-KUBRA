import jwt from 'jsonwebtoken';

const authMiddleware = (req, res, next) => {
    // Extract token from Authorization header (Bearer token format)
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Access Denied: No Token Provided' });
    }

    const token = authHeader.split(' ')[1];

    try {
        // Verify token
        const verified = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');
        req.user = verified; // Attach verified payload to req.user (e.g., student ID)
        next(); // Proceed to the next middleware or route handler
    } catch (error) {
        res.status(401).json({ success: false, message: 'Invalid or Expired Token' });
    }
};

export default authMiddleware;
