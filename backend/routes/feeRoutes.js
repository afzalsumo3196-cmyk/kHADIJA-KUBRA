import express from 'express';
import { getStudentFeeDetails, submitFeeSlip, getMyVoucher } from '../controllers/feeController.js';
import upload from '../middleware/uploadMiddleware.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/student/:regNo', getStudentFeeDetails);
router.post('/submit', upload.single('feeSlip'), submitFeeSlip);
router.get('/my-voucher', authMiddleware, getMyVoucher);

export default router;
