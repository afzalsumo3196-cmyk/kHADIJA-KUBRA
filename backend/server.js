import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Import Routes
import authRoutes from './routes/authRoutes.js';
import portalRoutes from './routes/portalRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import teacherRoutes from './routes/teacherRoutes.js';
import publicRoutes from './routes/publicRoutes.js';
import academicRoutes from './routes/academicRoutes.js';
import feeRoutes from './routes/feeRoutes.js';

// Load environment variables
dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));
app.use('/uploads', express.static('uploads'));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ MongoDB Connected successfully!'))
    .catch((err) => console.error('❌ Connection error:', err));

// Route Middleware
app.use('/api/auth', authRoutes);
app.use('/api/portal', portalRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/academic', academicRoutes);
app.use('/api/fees', feeRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('*** GLOBAL ERROR ***:', err);
    res.status(500).json({ success: false, message: err.message || 'Internal Server Error', error: err });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});