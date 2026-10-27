import express from 'express';
import { getNotices, getActiveCourses, submitComplaint, getStudentComplaints, getLectures, getQuizzes, getMyQuizReview, getCertificates, getTranscripts, getStudentAttendance, getStudentGrades, getAcademicRecord, submitQuiz, submitReview /* [LIVE_QUESTIONS_DISABLED] , getActiveLiveQuestions, submitLiveQuestionAnswer */ } from '../controllers/portalController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// All portal routes require authentication
router.use(authMiddleware);

router.get('/notices', getNotices);
router.get('/courses', getActiveCourses);
router.post('/complaints', submitComplaint);
router.get('/complaints', getStudentComplaints);
router.get('/lectures', getLectures);
router.get('/quizzes', getQuizzes);
router.get('/quizzes/:quizId/my-review', getMyQuizReview);
router.post('/quizzes/submit', submitQuiz);
router.get('/certificates', getCertificates);
router.get('/transcripts', getTranscripts);
router.get('/attendance', getStudentAttendance);
router.get('/grades', getStudentGrades);
router.get('/academic-record', getAcademicRecord);
router.post('/reviews', submitReview);
// [LIVE_QUESTIONS_DISABLED] router.get('/live-questions/active', getActiveLiveQuestions);
// [LIVE_QUESTIONS_DISABLED] router.post('/live-questions/submit', submitLiveQuestionAnswer);

export default router;
