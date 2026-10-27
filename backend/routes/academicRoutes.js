import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';
import { 
    uploadNote, getNotes, deleteNote, 
    uploadAssignment, getAssignments, deleteAssignment,
    submitAssignment, getSubmissions
} from '../controllers/academicController.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/notes', getNotes);
router.post('/notes', upload.single('file'), uploadNote);
router.delete('/notes/:id', deleteNote);

router.get('/assignments', getAssignments);
router.post('/assignments', upload.single('file'), uploadAssignment);
router.delete('/assignments/:id', deleteAssignment);

router.post('/assignments/submit', upload.single('file'), submitAssignment);
router.get('/assignments/submissions', getSubmissions);

export default router;
