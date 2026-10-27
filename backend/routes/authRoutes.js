import express from 'express';
import { login, getProfile, updateProfile } from '../controllers/authController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Public route
router.post('/login', login);

// Protected route
router.get('/profile', authMiddleware, getProfile);
router.put('/profile/update', authMiddleware, upload.single('photo'), updateProfile);

export default router;
