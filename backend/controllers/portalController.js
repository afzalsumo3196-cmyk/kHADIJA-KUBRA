import Notice from '../models/Notice.js';
import Course from '../models/Course.js';
import Complaint from '../models/Complaint.js';
import Lecture from '../models/Lecture.js';
import Quiz from '../models/Quiz.js';
import Student from '../models/Student.js';
import Certificate from '../models/Certificate.js';
import Transcript from '../models/Transcript.js';
import Attendance from '../models/Attendance.js';
import Grade from '../models/Grade.js';
import { findGradeForQuiz } from '../utils/quizGradeMatcher.js';
import Review from '../models/Review.js';
// [LIVE_QUESTIONS_DISABLED] import LiveQuestion from '../models/LiveQuestion.js';

// Fetch all notices
export const getNotices = async (req, res) => {
    try {
        const notices = await Notice.find().sort({ date: -1 });
        res.status(200).json({ success: true, notices });
    } catch (error) {
        console.error('Error fetching notices:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Fetch active courses
export const getActiveCourses = async (req, res) => {
    try {
        const studentId = req.user.id || req.user._id;
        const student = await Student.findById(studentId).populate('assignedCourses');
        
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        const validCourses = (student.assignedCourses || []).filter(c => c && c._id);

        const coursesWithTeachers = await Promise.all(
            validCourses.map(async (course) => {
                const teacher = await Student.findOne({ role: 'teacher', assignedCourses: course._id });
                
                return {
                    ...course.toObject(),
                    teacherName: teacher ? teacher.name : 'TBA'
                };
            })
        );

        res.status(200).json({ success: true, courses: coursesWithTeachers });
    } catch (error) {
        console.error('Error fetching courses:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Submit a new complaint
export const submitComplaint = async (req, res) => {
  try {
    const { category, urgency, subject, description } = req.body;

    // req.user authMiddleware se aata hai. 
    // Agar aapke middleware ne iska naam req.student rakha hai toh req.student.id use karein.
    const studentId = req.user.id || req.user._id; 

    if (!studentId) {
      return res.status(401).json({ message: 'Unauthorized: Student ID missing' });
    }

    // Naya complaint banayein aur usko logged-in student ke sath link karein
    const newComplaint = new Complaint({
      studentId: studentId,
      category,
      urgency,
      subject,
      description,
      status: 'Pending' // Default status
    });

    await newComplaint.save();

    res.status(201).json({ success: true, message: 'Complaint submitted successfully!' });
  } catch (error) {
    console.error('Complaint Error:', error);
    res.status(500).json({ message: 'Server error while submitting complaint.', error: error.message });
  }
};

// Fetch lectures for student
export const getLectures = async (req, res) => {
    try {
        const studentId = req.user.id || req.user._id;
        const student = await Student.findById(studentId);
        
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        // Fetch lectures matching student's assigned courses
        let query = { course: { $in: student.assignedCourses } };
        if (req.query.courseId) {
            query.course = req.query.courseId;
        }

        const lectures = await Lecture.find(query).populate('course', 'title courseCode').sort({ createdAt: -1 });
        res.status(200).json({ success: true, lectures });
    } catch (error) {
        console.error('Error fetching lectures:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Fetch quizzes for student
export const getQuizzes = async (req, res) => {
    try {
        const studentId = req.user.id || req.user._id;
        const student = await Student.findById(studentId);
        
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Handle missing courses gracefully
        if (!student.assignedCourses || student.assignedCourses.length === 0) {
            return res.status(200).json([]);
        }

        const assignedCourseIds = student.assignedCourses.map(c => (c._id || c).toString());

        // If courseId is provided in query, verify student is actually enrolled in this course
        if (req.query.courseId) {
            const requestedCourseId = req.query.courseId.toString();
            if (!assignedCourseIds.includes(requestedCourseId)) {
                return res.status(200).json([]);
            }
        }

        // Fetch active quizzes matching student's assigned courses (or specific course if requested and verified)
        let query = {
            course: req.query.courseId ? req.query.courseId : { $in: student.assignedCourses },
            status: 'Active'
        };

        const quizzes = await Quiz.find(query).populate('course', 'title courseCode');

        // Fetch student's grades to check for attempts
        const grades = await Grade.find({ studentId: student.regNo, type: 'Online Quiz' });
 
        const quizzesWithAttempts = quizzes.map(quiz => {
            const grade = findGradeForQuiz(quiz, grades, quizzes);
            const attemptsMade = grade ? (grade.attemptsCount || 1) : 0;
            const allowedAttempts = quiz.allowedAttempts || 1;
            const hasReachedMaxAttempts = attemptsMade >= allowedAttempts;

            const quizObj = quiz.toObject();

            // Security: Strip correctAnswer from all questions in the quiz list response
            if (Array.isArray(quizObj.questions)) {
                quizObj.questions = quizObj.questions.map(q => {
                    const { correctAnswer, ...safeQuestion } = q;
                    return safeQuestion;
                });
            }

            if (grade) {
                return {
                    ...quizObj,
                    isAttempted: hasReachedMaxAttempts,
                    attemptsMade,
                    allowedAttempts,
                    marksObtained: grade.marksObtained,
                    totalMarks: grade.totalMarks
                };
            }
            return {
                ...quizObj,
                isAttempted: false,
                attemptsMade: 0,
                allowedAttempts
            };
        });

        res.status(200).json(quizzesWithAttempts);
    } catch (error) {
        console.error('Error fetching quizzes:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Fetch certificates for student
export const getCertificates = async (req, res) => {
    try {
        const studentId = req.user.id || req.user._id;
        const student = await Student.findById(studentId);
        
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        // Fetch certificates matching student's regNo (studentId in Certificate schema)
        const certificates = await Certificate.find({ studentId: student.regNo }).sort({ createdAt: -1 });

        res.status(200).json({ success: true, certificates });
    } catch (error) {
        console.error('Error fetching certificates:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Fetch transcripts for student
export const getTranscripts = async (req, res) => {
    try {
        const studentId = req.user.id || req.user._id;
        const student = await Student.findById(studentId);
        
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        const transcripts = await Transcript.find({ regNo: student.regNo });
        res.status(200).json(transcripts);
    } catch (error) {
        console.error('Error fetching transcripts:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Fetch student attendance
export const getStudentAttendance = async (req, res) => {
    try {
        const studentId = req.user.id || req.user._id;
        const student = await Student.findById(studentId);
        
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        let query = { userId: student._id, targetType: 'Student', course: { $in: student.assignedCourses } };
        if (req.query.courseId) {
            query.course = req.query.courseId;
        }

        const logs = await Attendance.find(query).populate('course', 'title courseCode').sort({ date: -1 });
        
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

// Fetch teacher attendance
export const getTeacherAttendance = async (req, res) => {
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

// Fetch student grades
export const getStudentGrades = async (req, res) => {
    try {
        const studentId = req.user.id || req.user._id;
        const student = await Student.findById(studentId);
        
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        let query = { studentId: student.regNo, course: { $in: student.assignedCourses } };
        if (req.query.courseId) {
            query.course = req.query.courseId;
        }

        const grades = await Grade.find(query).populate('course', 'title courseCode').lean();

        let lqQuery = { 'answers.student': studentId };
        if (req.query.courseId) {
            lqQuery.course = req.query.courseId;
        } else {
            lqQuery.course = { $in: student.assignedCourses };
        }

        const liveQuestions = await LiveQuestion.find(lqQuery).populate('course', 'title courseCode').lean();
        
        liveQuestions.forEach(lq => {
            const ans = lq.answers.find(a => a.student.toString() === studentId.toString());
            if (ans && ans.obtainedMarks !== undefined && ans.obtainedMarks !== null) {
                grades.push({
                    _id: lq._id,
                    course: lq.course,
                    title: lq.questionText || 'Live Question',
                    type: 'Live Question',
                    marksObtained: ans.obtainedMarks,
                    totalMarks: ans.totalMarks || 0,
                    createdAt: ans.gradedAt || ans.submittedAt || lq.createdAt
                });
            }
        });

        grades.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

        res.status(200).json({ success: true, grades });
    } catch (error) {
        console.error('Error fetching grades:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Fetch academic record (dynamic GPA and transcript)
export const getAcademicRecord = async (req, res) => {
    try {
        const studentId = req.user.id || req.user._id;
        const student = await Student.findById(studentId);
        
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        const grades = await Grade.find({ studentId: student.regNo }).populate('course');

        // Aggregate grades by course
        const courseMap = {};
        grades.forEach(grade => {
            if (!grade.course) return;
            const courseId = grade.course._id.toString();
            if (!courseMap[courseId]) {
                courseMap[courseId] = {
                    course: grade.course,
                    marksObtained: 0,
                    totalMarks: 0,
                    categories: []
                };
            }
            courseMap[courseId].marksObtained += grade.marksObtained;
            
            // Exclude Extra/Bonus marks from the total possible denominator
            if (grade.type !== 'Extra' && !grade.title.toLowerCase().includes('extra') && !grade.title.toLowerCase().includes('bonus')) {
                courseMap[courseId].totalMarks += grade.totalMarks;
            }

            courseMap[courseId].categories.push({
                title: grade.title,
                type: grade.type,
                marksObtained: grade.marksObtained,
                totalMarks: grade.totalMarks
            });
        });

        // Group courses by semester
        const semesterMap = {};
        let totalPoints = 0;
        let totalCredits = 0;

        // Helper for GPA from percentage
        const getGPA = (percentage) => {
            if (percentage >= 85) return 4.0;
            if (percentage >= 80) return 3.7;
            if (percentage >= 75) return 3.3;
            if (percentage >= 70) return 3.0;
            if (percentage >= 65) return 2.7;
            if (percentage >= 60) return 2.3;
            if (percentage >= 55) return 2.0;
            if (percentage >= 50) return 1.7;
            return 0.0;
        };
        const getGradeLetter = (percentage) => {
            if (percentage >= 85) return 'A';
            if (percentage >= 80) return 'A-';
            if (percentage >= 75) return 'B+';
            if (percentage >= 70) return 'B';
            if (percentage >= 65) return 'B-';
            if (percentage >= 60) return 'C+';
            if (percentage >= 55) return 'C';
            if (percentage >= 50) return 'C-';
            return 'F';
        };

        Object.values(courseMap).forEach(courseData => {
            const sem = courseData.course.semester || 1;
            if (!semesterMap[sem]) {
                semesterMap[sem] = { semester: sem, courses: [], totalSemGPA: 0, count: 0 };
            }
            
            const percentage = courseData.totalMarks > 0 ? (courseData.marksObtained / courseData.totalMarks) * 100 : 0;
            const courseGPA = getGPA(percentage);
            const courseGrade = getGradeLetter(percentage);

            semesterMap[sem].courses.push({
                courseId: courseData.course._id,
                title: courseData.course.title,
                code: courseData.course.courseCode,
                marksObtained: courseData.marksObtained,
                totalMarks: courseData.totalMarks,
                percentage: percentage.toFixed(2),
                gpa: courseGPA.toFixed(2),
                grade: courseGrade,
                categories: courseData.categories
            });

            semesterMap[sem].totalSemGPA += courseGPA;
            semesterMap[sem].count += 1;
            
            totalPoints += courseGPA;
            totalCredits += 1;
        });

        const semesterResults = Object.values(semesterMap).map(sem => ({
            semester: sem.semester,
            courses: sem.courses,
            gpa: sem.count > 0 ? (sem.totalSemGPA / sem.count).toFixed(2) : "0.00"
        })).sort((a, b) => b.semester - a.semester); // descending order

        const cgpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : "0.00";

        res.status(200).json({
            success: true,
            studentProfile: {
                programName: student.programName,
                currentSemester: student.currentSemester,
                totalSemesters: student.totalSemesters
            },
            cgpa,
            semesterResults
        });

    } catch (error) {
        console.error('Error fetching academic record:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Submit Quiz and auto-save grade
export const submitQuiz = async (req, res) => {
    try {
        const studentId = req.user.id || req.user._id;
        const student = await Student.findById(studentId);
        
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        const { quizId, answers } = req.body;
        if (!quizId) {
            return res.status(400).json({ success: false, message: 'Quiz ID is required' });
        }
        
        const quiz = await Quiz.findById(quizId).populate('course');
        if (!quiz) {
            return res.status(404).json({ success: false, message: 'Quiz not found' });
        }

        // Verify student course enrollment
        const assignedCourseIds = (student.assignedCourses || []).map(c => c.toString());
        const quizCourseId = (quiz.course._id || quiz.course).toString();
        if (!assignedCourseIds.includes(quizCourseId)) {
            return res.status(403).json({ success: false, message: 'Forbidden: You are not enrolled in this course' });
        }

        if (quiz.status !== 'Active') {
            return res.status(400).json({ success: false, message: 'This quiz is currently inactive' });
        }

        const now = new Date();
        if (quiz.startDate && now < new Date(quiz.startDate)) {
            return res.status(400).json({ success: false, message: 'This quiz has not started yet' });
        }
        // Allow a grace period of (timeLimit + 5 minutes) so that a student who started before the deadline
        // is not abruptly rejected when submitting as the clock passes the deadline.
        if (quiz.endDate) {
            const graceMinutes = (Number(quiz.timeLimit) || 15) + 5;
            const cutoff = new Date(new Date(quiz.endDate).getTime() + graceMinutes * 60 * 1000);
            if (now > cutoff) {
                return res.status(400).json({ success: false, message: 'This quiz has ended and the submission window has closed.' });
            }
        }

        // Check if there is an existing grade (using exact quizId first, then legacy fallback)
        let existingGrade = await Grade.findOne({ 
            studentId: student.regNo, 
            quizId: quiz._id 
        });

        if (!existingGrade) {
            const legacyGrades = await Grade.find({
                studentId: student.regNo,
                course: quiz.course._id,
                type: 'Online Quiz',
                quizId: null
            });
            const allQuizzesForCourse = await Quiz.find({ course: quiz.course._id });
            existingGrade = findGradeForQuiz(quiz, legacyGrades, allQuizzesForCourse);
        }

        const allowedAttempts = quiz.allowedAttempts || 1;
        const attemptsMade = existingGrade ? (existingGrade.attemptsCount || 1) : 0;

        if (attemptsMade >= allowedAttempts) {
            return res.status(400).json({ success: false, message: 'You have reached the maximum number of attempts allowed for this quiz' });
        }

        // Calculate score and build question evaluation breakdown
        let score = 0;
        let correctCount = 0;
        let wrongCount = 0;
        let unansweredCount = 0;
        const evaluatedAnswers = []; // For backward compatibility answers
        const attemptAnswers = [];   // For attempt entry (NO correctAnswer field)
        const submittedAnswers = answers || {};

        quiz.questions.forEach((q, index) => {
            let selected = submittedAnswers[index] !== undefined 
                ? submittedAnswers[index] 
                : (submittedAnswers[String(index)] !== undefined ? submittedAnswers[String(index)] : null);

            if (typeof selected === 'string') {
                selected = selected.trim();
                if (selected === '') selected = null;
            } else if (selected === undefined) {
                selected = null;
            }

            const isAnswered = selected !== null;
            const normSelected = isAnswered ? String(selected).trim().toLowerCase() : null;
            const normCorrect = q.correctAnswer ? String(q.correctAnswer).trim().toLowerCase() : '';
            const isCorrect = Boolean(isAnswered && normSelected === normCorrect);

            if (!isAnswered) {
                unansweredCount += 1;
            } else if (isCorrect) {
                correctCount += 1;
                score += 1;
            } else {
                wrongCount += 1;
            }

            evaluatedAnswers.push({
                questionIndex: index,
                selected: selected || '',
                correctAnswer: q.correctAnswer,
                isCorrect,
                marks: isCorrect ? 1 : 0
            });

            attemptAnswers.push({
                questionIndex: index,
                selected, // null when unanswered
                isCorrect,
                marks: isCorrect ? 1 : 0
            });
        });

        const totalQuestions = quiz.questions.length;
        const submissionTime = new Date();
        const nextAttemptNo = (existingGrade && existingGrade.attempts && existingGrade.attempts.length > 0)
            ? existingGrade.attempts.length + 1
            : attemptsMade + 1;

        const newAttemptEntry = {
            attemptNo: nextAttemptNo,
            submittedAt: submissionTime,
            score,
            totalMarks: totalQuestions,
            correctCount,
            wrongCount,
            unansweredCount,
            answers: attemptAnswers
        };

        // Auto-save to Grade collection
        if (existingGrade) {
            existingGrade.attemptsCount = attemptsMade + 1;
            if (!existingGrade.quizId) {
                existingGrade.quizId = quiz._id;
            }
            if (!existingGrade.attempts) {
                existingGrade.attempts = [];
            }
            existingGrade.attempts.push(newAttemptEntry);

            // Store the best score
            if (score > existingGrade.marksObtained) {
                existingGrade.marksObtained = score;
                existingGrade.totalMarks = totalQuestions;
                existingGrade.answers = evaluatedAnswers;
            } else if (!existingGrade.answers || existingGrade.answers.length === 0) {
                existingGrade.answers = evaluatedAnswers;
            }
            existingGrade.submittedAt = submissionTime;
            await existingGrade.save();
        } else {
            const newGrade = new Grade({
                studentId: student.regNo,
                quizId: quiz._id,
                course: quiz.course._id,
                title: quiz.title,
                type: "Online Quiz",
                marksObtained: score,
                totalMarks: totalQuestions,
                faculty: quiz.faculty || "Unknown",
                attemptsCount: 1,
                answers: evaluatedAnswers,
                submittedAt: submissionTime,
                attempts: [newAttemptEntry]
            });
            await newGrade.save();
        }

        res.status(200).json({ 
            success: true, 
            score, 
            totalQuestions, 
            correctCount,
            wrongCount,
            unansweredCount,
            attemptNo: nextAttemptNo,
            message: 'Quiz submitted and graded successfully' 
        });

    } catch (error) {
        console.error('Error submitting quiz:', error);
        res.status(500).json({ success: false, message: 'Server error while submitting quiz' });
    }
};

// Get student's review of their quiz attempts (Strictly NO correctAnswer field exposed)
export const getMyQuizReview = async (req, res) => {
    try {
        const studentId = req.user.id || req.user._id;
        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        const { quizId } = req.params;
        if (!quizId) {
            return res.status(400).json({ success: false, message: 'Quiz ID is required' });
        }

        const quiz = await Quiz.findById(quizId).populate('course');
        if (!quiz) {
            return res.status(404).json({ success: false, message: 'Quiz not found' });
        }

        // Verify enrollment
        const assignedCourseIds = (student.assignedCourses || []).map(c => c.toString());
        const quizCourseId = (quiz.course._id || quiz.course).toString();
        if (!assignedCourseIds.includes(quizCourseId)) {
            return res.status(403).json({ success: false, message: 'Forbidden: You are not enrolled in this course' });
        }

        // Match Grade (exact quizId first, then legacy fallback)
        let grade = await Grade.findOne({
            studentId: student.regNo,
            quizId: quiz._id
        });

        if (!grade) {
            const legacyGrades = await Grade.find({
                studentId: student.regNo,
                course: quiz.course._id,
                type: 'Online Quiz',
                quizId: null
            });
            const allQuizzesForCourse = await Quiz.find({ course: quiz.course._id });
            grade = findGradeForQuiz(quiz, legacyGrades, allQuizzesForCourse);
        }

        if (!grade) {
            return res.status(404).json({ success: false, message: 'No attempt found for this quiz' });
        }

        const allowedAttempts = quiz.allowedAttempts || 1;
        const attemptsMade = grade.attemptsCount || (grade.attempts ? grade.attempts.length : 1);

        // If legacy grade has no attempts array
        if (!grade.attempts || grade.attempts.length === 0) {
            return res.status(200).json({
                success: true,
                quizTitle: quiz.title,
                allowedAttempts,
                attemptsMade,
                bestAttemptNo: 1,
                attempts: [],
                legacyReview: {
                    score: grade.marksObtained,
                    totalMarks: grade.totalMarks,
                    submittedAt: grade.submittedAt || grade.createdAt,
                    message: "Detailed review is not available for this attempt."
                }
            });
        }

        // Find best attempt
        let bestScore = -1;
        let bestAttemptNo = 1;
        grade.attempts.forEach(att => {
            if (att.score > bestScore) {
                bestScore = att.score;
                bestAttemptNo = att.attemptNo;
            }
        });

        const questionMap = {};
        quiz.questions.forEach((q, idx) => {
            questionMap[idx] = {
                questionText: q.questionText,
                options: q.options || []
            };
        });

        const formattedAttempts = grade.attempts.map(att => {
            const questionsList = (att.answers || []).map(ans => {
                const qData = questionMap[ans.questionIndex] || { 
                    questionText: `Question ${ans.questionIndex + 1}`, 
                    options: [] 
                };
                return {
                    questionIndex: ans.questionIndex,
                    questionText: qData.questionText,
                    options: qData.options,
                    selected: ans.selected ?? null,
                    isCorrect: Boolean(ans.isCorrect),
                    marks: ans.marks || 0
                };
            });

            return {
                attemptNo: att.attemptNo,
                score: att.score,
                totalMarks: att.totalMarks || quiz.questions.length,
                counts: {
                    correct: att.correctCount ?? 0,
                    wrong: att.wrongCount ?? 0,
                    unanswered: att.unansweredCount ?? 0
                },
                submittedAt: att.submittedAt,
                questions: questionsList
            };
        });

        res.status(200).json({
            success: true,
            quizTitle: quiz.title,
            allowedAttempts,
            attemptsMade,
            bestAttemptNo,
            attempts: formattedAttempts
        });
    } catch (error) {
        console.error('Error fetching quiz review:', error);
        res.status(500).json({ success: false, message: 'Server error while fetching review' });
    }
};

// Submit student review/testimonial
export const submitReview = async (req, res) => {
    try {
        const studentId = req.user.id || req.user._id;
        const student = await Student.findById(studentId);
        
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        const { quote, rating } = req.body;
        if (!quote) {
            return res.status(400).json({ success: false, message: 'Please provide review content (quote)' });
        }

        // We save student's name and programName/role directly in the Review document
        // so that if the Student document is deleted, the review continues to exist
        // on the landing page/website with their name and rating.
        const newReview = new Review({
            name: student.name,
            role: student.programName || 'Student',
            quote: quote,
            rating: rating || 5
        });

        await newReview.save();
        res.status(201).json({ success: true, message: 'Review submitted successfully!', review: newReview });
    } catch (error) {
        console.error('Submit Review Error:', error);
        res.status(500).json({ success: false, message: 'Server error while submitting review.' });
    }
};

// [LIVE_QUESTIONS_DISABLED] getActiveLiveQuestions
/* 
export const getActiveLiveQuestions = async (req, res) => {
    try {
        const studentId = req.user.id || req.user._id;
        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        const now = new Date();

        // Self-healing / Lazy activation & ending:
        // 1. Activate any scheduled questions that have reached their scheduledTime but are still in draft state
        await LiveQuestion.updateMany(
            {
                status: 'draft',
                publishType: 'scheduled',
                scheduledTime: { $lte: now },
                endAt: { $gt: now }
            },
            { $set: { status: 'active' } }
        );

        // 2. End any active/scheduled questions whose endAt time has passed
        await LiveQuestion.updateMany(
            {
                status: { $in: ['draft', 'active'] },
                endAt: { $lte: now }
            },
            { $set: { status: 'ended' } }
        );

        // 3. Find active live questions for the courses this student is enrolled in
        const activeQuestions = await LiveQuestion.find({
            course: { $in: student.assignedCourses },
            status: 'active',
            endAt: { $gt: now }
        })
        .populate('course', 'title courseCode')
        .populate('teacher', 'name')
        .lean();

        // 4. Check if student has already submitted an answer to each question, and append details
        const questions = activeQuestions.map(q => {
            const studentSubmission = q.answers.find(ans => ans.student.toString() === studentId.toString());
            // Omit answers of other students for security and privacy
            const { answers, ...safeQuestion } = q;
            
            const finalQuestions = (safeQuestion.questions && safeQuestion.questions.length > 0)
                ? safeQuestion.questions
                : [safeQuestion.questionText || ''];

            return {
                ...safeQuestion,
                questions: finalQuestions,
                hasSubmitted: !!studentSubmission,
                submittedAnswerText: studentSubmission ? studentSubmission.answerText : null,
                submittedAnswerTexts: studentSubmission ? (studentSubmission.answerTexts && studentSubmission.answerTexts.length > 0 ? studentSubmission.answerTexts : [studentSubmission.answerText || '']) : []
            };
        });

        res.status(200).json({ success: true, questions });
    } catch (error) {
        console.error('Error fetching active live questions:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
*/

// [LIVE_QUESTIONS_DISABLED] submitLiveQuestionAnswer
/* 
export const submitLiveQuestionAnswer = async (req, res) => {
    try {
        const studentId = req.user.id || req.user._id;
        const { questionId, answerText, answerTexts } = req.body;

        if (!questionId) {
            return res.status(400).json({ success: false, message: 'Question ID is required' });
        }

        const finalAnswerTexts = Array.isArray(answerTexts) ? answerTexts : [];
        if (finalAnswerTexts.length === 0 && answerText) {
            finalAnswerTexts.push(answerText);
        }

        if (finalAnswerTexts.length === 0) {
            return res.status(400).json({ success: false, message: 'Answer texts are required' });
        }

        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        const liveQuestion = await LiveQuestion.findById(questionId);
        if (!liveQuestion) {
            return res.status(404).json({ success: false, message: 'Live question not found' });
        }

        // Lazy status check
        const now = new Date();
        if (liveQuestion.endAt <= now || liveQuestion.status === 'ended') {
            return res.status(400).json({ success: false, message: 'Time is up! This live question has ended.' });
        }

        // Verify enrollment
        const assignedCourseIds = (student.assignedCourses || []).map(c => (c._id || c).toString());
        if (!assignedCourseIds.includes(liveQuestion.course.toString())) {
            return res.status(403).json({ success: false, message: 'Forbidden: You are not enrolled in this course.' });
        }

        // Look for existing answer
        const existingAnswerIndex = liveQuestion.answers.findIndex(ans => ans.student.toString() === studentId.toString());

        if (existingAnswerIndex > -1) {
            // Update existing answer
            liveQuestion.answers[existingAnswerIndex].answerText = finalAnswerTexts[0];
            liveQuestion.answers[existingAnswerIndex].answerTexts = finalAnswerTexts;
            liveQuestion.answers[existingAnswerIndex].submittedAt = now;
        } else {
            // Add new answer
            liveQuestion.answers.push({
                student: studentId,
                answerText: finalAnswerTexts[0],
                answerTexts: finalAnswerTexts,
                submittedAt: now
            });
        }

        await liveQuestion.save();

        res.status(200).json({ 
            success: true, 
            message: 'Answer submitted successfully!',
            hasSubmitted: true,
            submittedAnswerText: finalAnswerTexts[0],
            submittedAnswerTexts: finalAnswerTexts
        });
    } catch (error) {
        console.error('Error submitting answer:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
*/

export const getStudentComplaints = async (req, res) => {
    try {
        const studentId = req.user.id;
        const complaints = await Complaint.find({ studentId }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, complaints });
    } catch (error) {
        console.error('Get Student Complaints Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
