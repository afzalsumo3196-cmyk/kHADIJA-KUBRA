import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import adminMiddleware from '../middleware/adminMiddleware.js';
import {
  addStudent,
  addTeacher,
  updateTeacher,
  getDashboardStats,
  getAllStudents,
  getAllTeachers,
  getAllComplaints,
  getAllCertificates,
  issueCertificate,
  updateCertificate,
  deleteCertificate,
  uploadTranscript,
  getAllTranscripts,
  getTranscriptsByStudent,
  deleteTranscript,
  createCourse,
  getAllCourses,
  updateCourse,
  deleteCourse,
  assignCoursesToUser,
  getAttendance,
  getAttendanceCards,
  getDetailedAttendance,
  getStudentAttendanceSummary,
  markAttendance,
  deleteUser,
  cleanupDummyData,
  getAllNotices,
  createNotice,
  deleteNotice,
  updateStudent,
  getPendingFees,
  approveFee,
  resetFee,
  getSetting,
  updateSetting,
  updateCourseOutline,
  deleteCourseOutline,
  getRecycleBin,
  restoreUser,
  hardDeleteUser,
  getFileHubData,
  replyToComplaint,
  deleteComplaint,
  generateFeeSchedule,
  getStudentVoucher,
  updateStudentVoucher
} from '../controllers/adminController.js';
import { addReview, deleteReview, replyToReview } from '../controllers/reviewController.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Apply both middlewares to all admin routes
router.use(authMiddleware);
router.use(adminMiddleware);

router.get('/stats', getDashboardStats);
router.get('/students', getAllStudents);
router.get('/teachers', getAllTeachers);
router.get('/complaints', getAllComplaints);
router.put('/complaints/:id/reply', replyToComplaint);
router.delete('/complaints/:id', deleteComplaint);
router.get('/courses', getAllCourses);
router.get('/attendance', getAttendance);
router.get('/attendance-cards', getAttendanceCards);
router.get('/detailed-attendance', getDetailedAttendance);
router.get('/attendance-summary', getStudentAttendanceSummary);

const studentUpload = upload.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'cnicDocument', maxCount: 1 },
  { name: 'marksheetDocument', maxCount: 1 }
]);

const teacherUpload = upload.fields([
  { name: 'cvDocument', maxCount: 1 },
  { name: 'degreeDocument', maxCount: 1 },
  { name: 'coverLetterDocument', maxCount: 1 }
]);

router.post('/students', studentUpload, addStudent);
router.put('/students/:id', studentUpload, updateStudent);
router.post('/teachers', teacherUpload, addTeacher);
router.put('/teachers/:id', teacherUpload, updateTeacher);
router.get('/transcripts', getAllTranscripts);
router.get('/transcripts/student/:regNo', getTranscriptsByStudent);
router.post('/transcripts', upload.single('file'), uploadTranscript);
router.delete('/transcripts/:id', deleteTranscript);
router.get('/certificates', getAllCertificates);
router.post('/certificates', upload.single('file'), issueCertificate);
router.put('/certificates/:id', upload.single('file'), updateCertificate);
router.delete('/certificates/:id', deleteCertificate);
router.post('/courses', createCourse);
router.put('/courses/:id', updateCourse);
router.delete('/courses/:id', deleteCourse);
router.post('/assign-courses', assignCoursesToUser);
router.post('/attendance', markAttendance);

router.post('/reviews', addReview);
router.put('/reviews/:id/reply', replyToReview);
router.delete('/reviews/:id', deleteReview);

router.delete('/user/:id', deleteUser);
router.delete('/cleanup-dummy-data', cleanupDummyData);

router.get('/notices', getAllNotices);
router.post('/notices', createNotice);
router.delete('/notices/:id', deleteNotice);

router.get('/fees/pending', getPendingFees);
router.put('/fees/approve/:studentId', approveFee);
router.put('/fees/reset/:studentId', resetFee);
router.post('/fees/generate-schedule', generateFeeSchedule);
router.get('/fees/student/:id/voucher', getStudentVoucher);
router.put('/fees/student/:id/voucher', updateStudentVoucher);

router.get('/settings/:key', getSetting);
router.put('/settings/:key', updateSetting);

router.put('/courses/:id/outline', upload.single('file'), updateCourseOutline);
router.delete('/courses/:id/outline', deleteCourseOutline);

router.get('/recycle-bin', getRecycleBin);
router.put('/recycle-bin/restore/:id', restoreUser);
router.delete('/recycle-bin/hard-delete/:id', hardDeleteUser);

router.get('/file-hub', getFileHubData);

export default router;
