import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import teacherMiddleware from '../middleware/teacherMiddleware.js';
import { 
    uploadLecture, 
    createQuiz,
    getTeacherLectures,
    getTeacherQuizzes,
    getQuizAttempts,
    getFacultyStudents,
    submitAttendance,
    submitStudentMarks,
    getMyCourses,
    getMyAttendance,
    getStudentAttendance,
    deleteQuiz,
    editQuiz,
    deleteLecture,
// [LIVE_QUESTIONS_DISABLED] createLiveQuestion, getTeacherLiveQuestions, endLiveQuestion,
// gradeStudentAnswer,
// deleteLiveQuestion,
    renameGradeCategory,
    deleteGradeCategory
} from '../controllers/teacherController.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.use(authMiddleware);
router.use(teacherMiddleware);

router.get('/lectures', getTeacherLectures);
router.get('/quizzes', getTeacherQuizzes);
router.get('/quizzes/:quizId/attempts', getQuizAttempts);
router.get('/students', getFacultyStudents);
router.get('/courses', getMyCourses);
router.get('/my-attendance', getMyAttendance);
router.get('/attendance', getStudentAttendance);
// [LIVE_QUESTIONS_DISABLED] router.get('/live-questions', getTeacherLiveQuestions);

router.post('/lectures', upload.single('file'), uploadLecture);
router.post('/quizzes', createQuiz);
router.post('/attendance', submitAttendance);
router.post('/grades', submitStudentMarks);
// [LIVE_QUESTIONS_DISABLED] router.post('/live-questions', createLiveQuestion);
router.put('/quizzes/:quizId', editQuiz);
// [LIVE_QUESTIONS_DISABLED] router.put('/live-questions/:id/end', endLiveQuestion);
// [LIVE_QUESTIONS_DISABLED] router.put('/live-questions/:questionId/grade', gradeStudentAnswer);
router.put('/grades/category', renameGradeCategory);

router.delete('/quizzes/:quizId', deleteQuiz);
router.delete('/lectures/:lectureId', deleteLecture);
// [LIVE_QUESTIONS_DISABLED] router.delete('/live-questions/:id', deleteLiveQuestion);
router.delete('/grades/category', deleteGradeCategory);

export default router;
