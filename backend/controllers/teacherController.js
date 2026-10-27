import Lecture from '../models/Lecture.js';
import Quiz from '../models/Quiz.js';
import Student from '../models/Student.js'; // to get teacher's faculty
import Attendance from '../models/Attendance.js';
import Grade from '../models/Grade.js';
import Course from '../models/Course.js';
import { findGradesForQuiz } from '../utils/quizGradeMatcher.js';
// [LIVE_QUESTIONS_DISABLED] import LiveQuestion from '../models/LiveQuestion.js';

export const uploadLecture = async (req, res) => {
    try {
        const { title, description, duration, courseId, fileUrl } = req.body;
        
        let finalFileUrl = fileUrl;
        let fileType = 'link';

        if (req.file) {
            finalFileUrl = req.file.path;
            fileType = req.file.mimetype.startsWith('video') ? 'video' : 'document';
        }

        if (!title || (!finalFileUrl && !req.file) || !courseId) {
            return res.status(400).json({ success: false, message: 'Please provide title, file or URL, and select a course' });
        }

        const teacher = await Student.findById(req.user.id || req.user._id);
        if (!teacher) {
            return res.status(404).json({ success: false, message: 'Teacher not found' });
        }

        const newLecture = new Lecture({
            title,
            description,
            fileUrl: finalFileUrl,
            fileType,
            duration,
            course: courseId,
            faculty: teacher.faculty // Keep faculty for fallback
        });

        await newLecture.save();
        res.status(201).json({ success: true, message: 'Lecture uploaded successfully', lecture: newLecture });
    } catch (error) {
        console.error('Upload Lecture Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const parseQuizIsoDate = (dateVal) => {
    if (!dateVal) return null;
    if (typeof dateVal !== 'string') {
        if (dateVal instanceof Date && !isNaN(dateVal.getTime())) return dateVal;
        throw new Error('Invalid start/end date');
    }
    const trimmed = dateVal.trim();
    if (!trimmed) return null;

    // Must have explicit timezone indicator ('Z' or offset like +05:00)
    const hasTimezone = /([zZ]|[+-]\d{2}:?\d{2})$/.test(trimmed);
    if (!hasTimezone) {
        throw new Error('Invalid start/end date: must include UTC or timezone offset');
    }

    const timestamp = Date.parse(trimmed);
    if (isNaN(timestamp)) {
        throw new Error('Invalid start/end date');
    }

    return new Date(timestamp);
};

const sanitizeQuizQuestions = (rawQuestions) => {
    if (!Array.isArray(rawQuestions) || rawQuestions.length === 0) {
        throw new Error('Please provide at least one question.');
    }
    return rawQuestions.map((q, idx) => {
        const questionText = (q.questionText || '').trim();
        const options = Array.isArray(q.options) 
            ? q.options.map(opt => (typeof opt === 'string' ? opt.trim() : String(opt || '').trim())).filter(opt => opt !== '') 
            : [];
        const correctAnswer = (q.correctAnswer || '').trim();

        if (!questionText) {
            throw new Error(`Question ${idx + 1}: Question text cannot be empty.`);
        }
        if (options.length < 2) {
            throw new Error(`Question ${idx + 1}: Must provide at least 2 options.`);
        }
        if (!correctAnswer) {
            throw new Error(`Question ${idx + 1}: Correct answer must be selected.`);
        }
        const match = options.find(opt => opt.toLowerCase() === correctAnswer.toLowerCase());
        if (!match) {
            throw new Error(`Question ${idx + 1}: Correct answer must match one of the options.`);
        }

        return {
            questionText,
            options,
            correctAnswer: match
        };
    });
};

export const createQuiz = async (req, res) => {
    try {
        const { title, questions, status, courseId, timeLimit, allowedAttempts, startDate, endDate } = req.body;

        if (!title || !questions || questions.length === 0 || !courseId) {
            return res.status(400).json({ success: false, message: 'Please provide title, course, and at least one question' });
        }

        const teacher = await Student.findById(req.user.id || req.user._id);
        if (!teacher) {
            return res.status(404).json({ success: false, message: 'Teacher not found' });
        }

        const assignedCourseIds = (teacher.assignedCourses || []).map(c => (c._id || c).toString());
        if (!assignedCourseIds.includes(courseId.toString())) {
            return res.status(403).json({ success: false, message: 'Forbidden: You are not assigned to this course' });
        }

        let parsedStart = null;
        let parsedEnd = null;
        try {
            parsedStart = parseQuizIsoDate(startDate);
            parsedEnd = parseQuizIsoDate(endDate);
        } catch (dateErr) {
            return res.status(400).json({ success: false, message: dateErr.message || 'Invalid start/end date' });
        }

        if (parsedStart && parsedEnd && parsedEnd <= parsedStart) {
            return res.status(400).json({ success: false, message: 'End date must be after start date' });
        }

        let sanitizedQuestions;
        try {
            sanitizedQuestions = sanitizeQuizQuestions(questions);
        } catch (qErr) {
            return res.status(400).json({ success: false, message: qErr.message });
        }

        const newQuiz = new Quiz({
            title: title.trim(),
            course: courseId,
            faculty: teacher.faculty, // Keep for backward compatibility
            questions: sanitizedQuestions,
            status: status || 'Active',
            timeLimit: timeLimit ? parseInt(timeLimit) : 15,
            allowedAttempts: allowedAttempts ? parseInt(allowedAttempts) : 1,
            startDate: parsedStart,
            endDate: parsedEnd
        });

        await newQuiz.save();
        res.status(201).json({ success: true, message: 'Quiz created successfully', quiz: newQuiz });
    } catch (error) {
        console.error('Create Quiz Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const editQuiz = async (req, res) => {
    try {
        const { quizId } = req.params;
        const { title, questions, status, courseId, timeLimit, allowedAttempts, startDate, endDate } = req.body;

        if (!title || !questions || questions.length === 0 || !courseId) {
            return res.status(400).json({ success: false, message: 'Please provide title, course, and at least one question' });
        }

        const teacher = await Student.findById(req.user.id || req.user._id);
        if (!teacher) {
            return res.status(404).json({ success: false, message: 'Teacher not found' });
        }

        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
            return res.status(404).json({ success: false, message: 'Quiz not found' });
        }

        const assignedCourseIds = (teacher.assignedCourses || []).map(c => (c._id || c).toString());
        const quizCourseId = (quiz.course._id || quiz.course).toString();
        if (!assignedCourseIds.includes(quizCourseId) || !assignedCourseIds.includes(courseId.toString())) {
            return res.status(403).json({ success: false, message: 'Forbidden: You are not assigned to this course' });
        }

        let parsedStart = null;
        let parsedEnd = null;
        try {
            parsedStart = parseQuizIsoDate(startDate);
            parsedEnd = parseQuizIsoDate(endDate);
        } catch (dateErr) {
            return res.status(400).json({ success: false, message: dateErr.message || 'Invalid start/end date' });
        }

        if (parsedStart && parsedEnd && parsedEnd <= parsedStart) {
            return res.status(400).json({ success: false, message: 'End date must be after start date' });
        }

        let sanitizedQuestions;
        try {
            sanitizedQuestions = sanitizeQuizQuestions(questions);
        } catch (qErr) {
            return res.status(400).json({ success: false, message: qErr.message });
        }

        quiz.title = title.trim();
        quiz.course = courseId;
        quiz.questions = sanitizedQuestions;
        quiz.status = status || 'Active';
        quiz.timeLimit = timeLimit ? parseInt(timeLimit) : 15;
        quiz.allowedAttempts = allowedAttempts ? parseInt(allowedAttempts) : 1;
        quiz.startDate = parsedStart;
        quiz.endDate = parsedEnd;

        await quiz.save();
        res.status(200).json({ success: true, message: 'Quiz updated successfully', quiz });
    } catch (error) {
        console.error('Edit Quiz Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
export const getTeacherLectures = async (req, res) => {
    try {
        const teacher = await Student.findById(req.user.id || req.user._id);
        if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found' });

        const lectures = await Lecture.find({ course: { $in: teacher.assignedCourses } }).populate('course', 'title courseCode').sort({ createdAt: -1 });
        res.status(200).json({ success: true, lectures });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const deleteLecture = async (req, res) => {
    try {
        const { lectureId } = req.params;
        const lecture = await Lecture.findById(lectureId);
        
        if (!lecture) {
            return res.status(404).json({ success: false, message: 'Lecture not found' });
        }
        
        await Lecture.findByIdAndDelete(lectureId);
        res.status(200).json({ success: true, message: 'Lecture deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const getTeacherQuizzes = async (req, res) => {
    try {
        const teacher = await Student.findById(req.user.id || req.user._id);
        if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found' });

        const quizzes = await Quiz.find({ course: { $in: teacher.assignedCourses } }).populate('course', 'title courseCode').sort({ createdAt: -1 });
        
        // Fetch attempt count for each quiz
        const courseIds = quizzes.filter(q => q.course && q.course._id).map(q => q.course._id);
        const allGrades = await Grade.find({
            course: { $in: courseIds },
            type: 'Online Quiz'
        });

        const quizzesWithCounts = quizzes.map(quiz => {
            const quizGrades = findGradesForQuiz(quiz, allGrades, quizzes);
            return {
                ...quiz.toObject(),
                attemptCount: quizGrades.length
            };
        });

        res.status(200).json({ success: true, quizzes: quizzesWithCounts });
    } catch (error) {
        console.error('Get Teacher Quizzes Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const getQuizAttempts = async (req, res) => {
    try {
        const { quizId } = req.params;
        const teacher = await Student.findById(req.user.id || req.user._id);
        if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found' });

        const quiz = await Quiz.findById(quizId);
        if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });

        // Fetch all candidate grades for this quiz
        const allCourseQuizzes = await Quiz.find({ course: quiz.course });
        const candidateGrades = await Grade.find({
            course: quiz.course,
            type: 'Online Quiz'
        }).sort({ createdAt: -1 });

        const grades = findGradesForQuiz(quiz, candidateGrades, allCourseQuizzes);

        // Fetch student profiles to get names
        const studentRegNos = grades.map(g => g.studentId);
        const students = await Student.find({ regNo: { $in: studentRegNos } }).select('name regNo email');

        const studentMap = {};
        students.forEach(s => {
            studentMap[s.regNo] = s;
        });

        const attempts = [];

        grades.forEach(g => {
            const student = studentMap[g.studentId] || { name: 'Unknown Student', regNo: g.studentId };

            if (Array.isArray(g.attempts) && g.attempts.length > 0) {
                const bestScore = Math.max(...g.attempts.map(a => a.score ?? 0));
                
                g.attempts.forEach(att => {
                    attempts.push({
                        _id: `${g._id}_${att.attemptNo}`,
                        gradeId: g._id,
                        studentId: g.studentId,
                        studentName: student.name,
                        studentEmail: student.email || '',
                        attemptNo: att.attemptNo,
                        isBest: att.score === bestScore,
                        marksObtained: att.score,
                        totalMarks: att.totalMarks || g.totalMarks,
                        createdAt: att.submittedAt || g.submittedAt || g.createdAt
                    });
                });
            } else {
                attempts.push({
                    _id: g._id,
                    gradeId: g._id,
                    studentId: g.studentId,
                    studentName: student.name,
                    studentEmail: student.email || '',
                    attemptNo: 1,
                    isBest: true,
                    marksObtained: g.marksObtained,
                    totalMarks: g.totalMarks,
                    createdAt: g.submittedAt || g.createdAt
                });
            }
        });

        res.status(200).json({ success: true, attempts });
    } catch (error) {
        console.error('Get Quiz Attempts Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const getFacultyStudents = async (req, res) => {
    try {
        // Now it can optionally filter by course if courseId is passed in query
        const { courseId } = req.query;
        const teacher = await Student.findById(req.user.id || req.user._id);
        if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found' });

        let filter = { role: 'student' };
        if (courseId) {
            filter.assignedCourses = courseId;
        } else {
            filter.assignedCourses = { $in: teacher.assignedCourses };
        }

        const students = await Student.find(filter).select('-password').sort({ name: 1 });

        if (courseId) {
            // Fetch all grades for this course
            const grades = await Grade.find({ course: courseId });
            
            // Map grades to each student
            const studentsWithGrades = students.map(student => {
                const studentGrades = grades.filter(g => g.studentId === student.regNo);
                return {
                    ...student.toObject(),
                    grades: studentGrades
                };
            });
            return res.status(200).json({ success: true, students: studentsWithGrades });
        }

        res.status(200).json({ success: true, students });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const submitAttendance = async (req, res) => {
    try {
        const { date, courseId, timeSlot, records } = req.body; 
        
        if (!date || !courseId || !records || !Array.isArray(records)) {
            return res.status(400).json({ success: false, message: 'Invalid data format or missing course' });
        }

        const teacher = await Student.findById(req.user.id || req.user._id);
        if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found' });

        const formattedDate = new Date(new Date(date).setHours(0, 0, 0, 0));
        const slot = timeSlot || 'Morning';
        const teacherId = teacher._id;

        for (const record of records) {
            await Attendance.findOneAndUpdate(
                { userId: record.studentId, course: courseId, date: formattedDate, timeSlot: slot },
                { 
                    status: record.status, 
                    faculty: teacher.faculty, 
                    course: courseId, 
                    date: formattedDate, 
                    userId: record.studentId,
                    targetType: 'Student',
                    timeSlot: slot,
                    markedBy: 'Teacher',
                    markedById: teacherId,
                    remarks: record.remarks || ''
                },
                { upsert: true, new: true }
            );
        }

        res.status(200).json({ success: true, message: 'Attendance submitted successfully' });
    } catch (error) {
        console.error('Submit Attendance Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const submitStudentMarks = async (req, res) => {
    try {
        const { title, type, totalMarks, courseId, marksData } = req.body;

        if (!title || !type || !totalMarks || !courseId || !marksData || !Array.isArray(marksData)) {
            return res.status(400).json({ success: false, message: 'Invalid data format or missing course' });
        }

        const teacher = await Student.findById(req.user.id || req.user._id);
        if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found' });

        const bulkOps = marksData.map(record => ({
            updateOne: {
                filter: { studentId: record.studentId, title, type, course: courseId },
                update: { $set: { marksObtained: record.marksObtained, totalMarks, faculty: teacher.faculty, course: courseId } },
                upsert: true
            }
        }));

        if (bulkOps.length > 0) {
            await Grade.bulkWrite(bulkOps);
        }
        res.status(200).json({ success: true, message: 'Marks submitted successfully' });
    } catch (error) {
        console.error('Submit Marks Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const getMyCourses = async (req, res) => {
    try {
        const teacher = await Student.findById(req.user.id || req.user._id).populate('assignedCourses');
        if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found' });
        res.status(200).json({ success: true, courses: (teacher.assignedCourses || []).filter(c => c && c._id) });
    } catch (error) {
        console.error('Get My Courses Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const getMyAttendance = async (req, res) => {
    try {
        const teacherId = req.user.id || req.user._id;
        const teacher = await Student.findById(teacherId);
        
        if (!teacher) {
            return res.status(404).json({ success: false, message: 'Teacher not found' });
        }

        const logs = await Attendance.find({ userId: teacher._id, targetType: 'Teacher' }).populate('course', 'title courseCode').sort({ date: -1 });
        
        let presentCount = 0;
        logs.forEach(log => {
            if (log.status === 'Present') presentCount++;
        });

        const rate = logs.length > 0 ? Math.round((presentCount / logs.length) * 100) : 0;

        res.status(200).json({ success: true, rate, logs, total: logs.length, presents: presentCount, absents: logs.length - presentCount });
    } catch (error) {
        console.error('Error fetching attendance:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const getStudentAttendance = async (req, res) => {
    try {
        const { date, courseId, timeSlot } = req.query;
        if (!date || !courseId || !timeSlot) {
            return res.status(400).json({ success: false, message: 'Date, courseId, and timeSlot are required' });
        }

        const teacher = await Student.findById(req.user.id || req.user._id);
        if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found' });

        // Ensure teacher is assigned to this course
        const assignedCourseIds = (teacher.assignedCourses || []).map(c => (c._id || c).toString());
        if (!assignedCourseIds.includes(courseId.toString())) {
            return res.status(403).json({ success: false, message: 'Forbidden: You are not assigned to this course' });
        }

        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const records = await Attendance.find({
            targetType: 'Student',
            course: courseId,
            timeSlot: timeSlot,
            date: { $gte: startOfDay, $lte: endOfDay }
        }).populate('userId', 'name regNo');

        res.status(200).json({ success: true, records });
    } catch (error) {
        console.error('Get Student Attendance Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const deleteQuiz = async (req, res) => {
    try {
        const { quizId } = req.params;
        const teacher = await Student.findById(req.user.id || req.user._id);
        if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found' });

        const quiz = await Quiz.findById(quizId);
        if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });

        // Ensure teacher is assigned to the course of this quiz
        const assignedCourseIds = (teacher.assignedCourses || []).map(c => (c._id || c).toString());
        const quizCourseId = (quiz.course._id || quiz.course).toString();
        if (!assignedCourseIds.includes(quizCourseId)) {
            return res.status(403).json({ success: false, message: 'Forbidden: You are not assigned to this course' });
        }

        await Quiz.findByIdAndDelete(quizId);
        res.status(200).json({ success: true, message: 'Quiz deleted successfully' });
    } catch (error) {
        console.error('Delete Quiz Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// [LIVE_QUESTIONS_DISABLED] createLiveQuestion
/* 
export const createLiveQuestion = async (req, res) => {
    try {
        const { courseId, questionText, questions, duration, publishType, scheduledTime } = req.body;

        const finalQuestions = Array.isArray(questions) ? questions.filter(q => q.trim() !== '') : [];
        if (finalQuestions.length === 0 && questionText) {
            finalQuestions.push(questionText);
        }

        if (!courseId || finalQuestions.length === 0 || !duration) {
            return res.status(400).json({ success: false, message: 'Missing required fields: select course, set duration, and add at least one question.' });
        }

        const teacher = await Student.findById(req.user.id || req.user._id);
        if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found' });

        // Ensure course belongs to teacher
        if (!teacher.assignedCourses.includes(courseId)) {
            return res.status(403).json({ success: false, message: 'Forbidden: Course not assigned to you' });
        }

        let status = 'draft';
        let publishedAt = null;
        let endAt = null;

        if (publishType === 'now') {
            status = 'active';
            publishedAt = new Date();
            endAt = new Date(Date.now() + duration * 60 * 1000);
        } else if (publishType === 'scheduled' && scheduledTime) {
            status = 'draft'; // Lazy-activated when fetched
            publishedAt = new Date(scheduledTime);
            endAt = new Date(new Date(scheduledTime).getTime() + duration * 60 * 1000);
        }

        const liveQuestion = new LiveQuestion({
            teacher: teacher._id,
            course: courseId,
            questionText: finalQuestions[0], // fallback for single-question compatibility
            questions: finalQuestions,
            duration,
            publishType: publishType || 'now',
            scheduledTime: publishType === 'scheduled' ? new Date(scheduledTime) : null,
            status,
            publishedAt,
            endAt,
            answers: []
        });

        await liveQuestion.save();
        res.status(201).json({ success: true, liveQuestion });
    } catch (error) {
        console.error('Create Live Question Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
*/

// [LIVE_QUESTIONS_DISABLED] getTeacherLiveQuestions
/* 
export const getTeacherLiveQuestions = async (req, res) => {
    try {
        const teacherId = req.user.id || req.user._id;

        // Automatically close/end any active questions whose endAt time has passed
        await LiveQuestion.updateMany(
            { teacher: teacherId, status: 'active', endAt: { $lte: new Date() } },
            { $set: { status: 'ended' } }
        );

        // Fetch live questions populated with student details on answers
        const questions = await LiveQuestion.find({ teacher: teacherId })
            .populate('course', 'title courseCode')
            .populate('answers.student', 'name regNo')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, questions });
    } catch (error) {
        console.error('Get Teacher Live Questions Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
*/

// [LIVE_QUESTIONS_DISABLED] endLiveQuestion
/* 
export const endLiveQuestion = async (req, res) => {
    try {
        const { id } = req.params;
        const teacherId = req.user.id || req.user._id;

        const liveQuestion = await LiveQuestion.findOne({ _id: id, teacher: teacherId });
        if (!liveQuestion) {
            return res.status(404).json({ success: false, message: 'Live question not found or unauthorized' });
        }

        liveQuestion.status = 'ended';
        liveQuestion.endAt = new Date();
        await liveQuestion.save();

        res.status(200).json({ success: true, message: 'Live question ended successfully', liveQuestion });
    } catch (error) {
        console.error('End Live Question Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
*/

// [LIVE_QUESTIONS_DISABLED] gradeStudentAnswer
/* 
export const gradeStudentAnswer = async (req, res) => {
    try {
        const { questionId } = req.params;
        const { studentId, obtainedMarks, totalMarks } = req.body;
        const teacherId = req.user.id || req.user._id;

        if (!studentId || obtainedMarks === undefined || totalMarks === undefined) {
            return res.status(400).json({ success: false, message: 'Missing student ID, obtained marks, or total marks' });
        }

        const liveQuestion = await LiveQuestion.findOne({ _id: questionId, teacher: teacherId });
        if (!liveQuestion) {
            return res.status(404).json({ success: false, message: 'Live question session not found or unauthorized' });
        }

        const answerIndex = liveQuestion.answers.findIndex(ans => ans.student.toString() === studentId.toString());
        if (answerIndex === -1) {
            return res.status(404).json({ success: false, message: 'Student answer submission not found' });
        }

        liveQuestion.answers[answerIndex].obtainedMarks = Number(obtainedMarks);
        liveQuestion.answers[answerIndex].totalMarks = Number(totalMarks);
        liveQuestion.answers[answerIndex].gradedAt = new Date();

        await liveQuestion.save();

        res.status(200).json({ 
            success: true, 
            message: 'Student submission graded successfully!',
            answer: liveQuestion.answers[answerIndex]
        });
    } catch (error) {
        console.error('Grade Student Answer Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
*/

// [LIVE_QUESTIONS_DISABLED] deleteLiveQuestion
/* 
export const deleteLiveQuestion = async (req, res) => {
    try {
        const { id } = req.params;
        const teacherId = req.user.id || req.user._id;

        const liveQuestion = await LiveQuestion.findOneAndDelete({ _id: id, teacher: teacherId });
        if (!liveQuestion) {
            return res.status(404).json({ success: false, message: 'Live question session not found or unauthorized' });
        }

        res.status(200).json({ success: true, message: 'Live question session deleted successfully' });
    } catch (error) {
        console.error('Delete Live Question Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
*/

export const renameGradeCategory = async (req, res) => {
    try {
        const { oldTitle, newTitle, type, courseId } = req.body;
        if (!oldTitle || !newTitle || !type || !courseId) {
            return res.status(400).json({ success: false, message: 'Missing parameters' });
        }
        
        await Grade.updateMany(
            { title: oldTitle, type, course: courseId },
            { $set: { title: newTitle } }
        );
        
        res.status(200).json({ success: true, message: 'Category renamed successfully' });
    } catch (error) {
        console.error('Rename Category Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const deleteGradeCategory = async (req, res) => {
    try {
        const { title, type, courseId } = req.query;
        if (!title || !type || !courseId) {
            return res.status(400).json({ success: false, message: 'Missing parameters' });
        }
        
        await Grade.deleteMany(
            { title, type, course: courseId }
        );
        
        res.status(200).json({ success: true, message: 'Category deleted successfully' });
    } catch (error) {
        console.error('Delete Category Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
