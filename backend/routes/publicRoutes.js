import express from 'express';
import multer from 'multer';
import path from 'path';
import { getReviews } from '../controllers/reviewController.js';
import { submitAdmission, checkDuplicateAdmission } from '../controllers/admissionController.js';

const router = express.Router();

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

router.get('/reviews', getReviews);
router.get('/check-duplicate', checkDuplicateAdmission);

router.post('/admission', upload.fields([
    { name: 'documentFile', maxCount: 1 },
    { name: 'passportPhoto', maxCount: 1 },
    { name: 'cnicPhoto', maxCount: 1 }
]), submitAdmission);

export default router;
