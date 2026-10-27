const teacherMiddleware = (req, res, next) => {
    if (req.user && req.user.role === 'teacher') {
        next();
    } else {
        res.status(401).json({ success: false, message: 'Not authorized as a teacher' });
    }
};

export default teacherMiddleware;
