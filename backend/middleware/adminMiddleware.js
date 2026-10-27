import Student from '../models/Student.js';

const adminMiddleware = async (req, res, next) => {
    try {
        // req.user is set by authMiddleware
        if (!req.user || !req.user.id) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        // Fetch the user to get their role
        const user = await Student.findById(req.user.id);
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Forbidden: Admin access required' });
        }

        // Add user role to req.user for subsequent middleware/controllers
        req.user.role = user.role;
        next();
    } catch (error) {
        console.error('Admin middleware error:', error);
        res.status(500).json({ success: false, message: 'Server error in authorization' });
    }
};

export default adminMiddleware;
