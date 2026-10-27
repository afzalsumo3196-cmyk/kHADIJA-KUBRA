import Student from '../models/Student.js';
import Complaint from '../models/Complaint.js';
import Certificate from '../models/Certificate.js';
import Transcript from '../models/Transcript.js';
import Quiz from '../models/Quiz.js'; // Needed for active quizzes count
import Course from '../models/Course.js';
import Attendance from '../models/Attendance.js';
import Notice from '../models/Notice.js';
import bcryptjs from 'bcryptjs';
import { buildVoucherData } from '../utils/voucherBuilder.js';

export const getDashboardStats = async (req, res) => {
    try {
        const totalStudents = await Student.countDocuments({ role: 'student' });
        const activeQuizzes = await Quiz.countDocuments({ status: 'Active' });
        const pendingComplaints = await Complaint.countDocuments({ status: 'Pending' });

        const stats = {
            totalStudents,
            activeQuizzes,
            pendingComplaints
        };
        res.status(200).json({ success: true, stats });
    } catch (error) {
        console.error('Stats Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const getAllStudents = async (req, res) => {
    try {
        const students = await Student.find({ role: 'student', isDeleted: { $ne: true } }).select('-password').populate('assignedCourses').sort({ createdAt: -1 });
        res.status(200).json({ success: true, students });
    } catch (error) {
        console.error('Get All Students Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const getAllTeachers = async (req, res) => {
    try {
        const teachers = await Student.find({ role: 'teacher', isDeleted: { $ne: true } }).select('-password').sort({ createdAt: -1 });
        res.status(200).json({ success: true, teachers });
    } catch (error) {
        console.error('Get All Teachers Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const getAllComplaints = async (req, res) => {
    try {
        const complaints = await Complaint.find().populate('studentId', 'name regNo').sort({ createdAt: -1 });
        res.status(200).json({ success: true, complaints });
    } catch (error) {
        console.error('Get All Complaints Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const addStudent = async (req, res) => {
    try {
        const { name, regNo, email, password, faculty, programName, currentSemester, totalSemesters } = req.body;

        if (!name || !regNo || !email || !password || !faculty || !programName) {
            return res.status(400).json({ success: false, message: 'Please provide all required fields' });
        }

        const existingStudent = await Student.findOne({ $or: [{ email }, { regNo }] });
        if (existingStudent) {
            return res.status(400).json({ success: false, message: 'User with this email or regNo already exists' });
        }

        const salt = await bcryptjs.genSalt(10);
        const hashedPassword = await bcryptjs.hash(password, salt);

        const newStudent = new Student({
            name,
            regNo,
            studentId: regNo,
            email,
            password: hashedPassword,
            faculty,
            programName,
            currentSemester: currentSemester || 1,
            totalSemesters: totalSemesters || 8,
            role: 'student'
        });

        await newStudent.save();
        res.status(201).json({ success: true, message: 'Student added successfully' });
    } catch (error) {
        console.error('Add Student Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const addTeacher = async (req, res) => {
    try {
        const { name, regNo, email, password, faculty } = req.body;

        if (!name || !regNo || !email || !password || !faculty) {
            return res.status(400).json({ success: false, message: 'Please provide all required fields' });
        }

        const existingTeacher = await Student.findOne({ $or: [{ email }, { regNo }] });
        if (existingTeacher) {
            return res.status(400).json({ success: false, message: 'User with this email or regNo already exists' });
        }

        const salt = await bcryptjs.genSalt(10);
        const hashedPassword = await bcryptjs.hash(password, salt);

        const newTeacher = new Student({
            name,
            regNo,
            studentId: regNo,
            email,
            password: hashedPassword,
            faculty,
            role: 'teacher'
        });

        await newTeacher.save();
        res.status(201).json({ success: true, message: 'Teacher added successfully' });
    } catch (error) {
        console.error('Add Teacher Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const updateTeacher = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, regNo, email, faculty, password } = req.body;

        const teacher = await Student.findById(id);
        if (!teacher) {
            return res.status(404).json({ success: false, message: 'Teacher not found' });
        }

        // Check if email or regNo is being changed to another existing user's
        if (email && email !== teacher.email) {
            const existing = await Student.findOne({ email });
            if (existing) {
                return res.status(400).json({ success: false, message: 'Email already in use by another user' });
            }
            teacher.email = email;
        }

        if (regNo && regNo !== teacher.regNo) {
            const existing = await Student.findOne({ regNo });
            if (existing) {
                return res.status(400).json({ success: false, message: 'Registration number already in use by another user' });
            }
            teacher.regNo = regNo;
            teacher.studentId = regNo; // sync studentId
        }

        if (name) teacher.name = name;
        if (faculty) teacher.faculty = faculty;

        if (password) {
            const salt = await bcryptjs.genSalt(10);
            teacher.password = await bcryptjs.hash(password, salt);
        }

        await teacher.save();
        res.status(200).json({ success: true, message: 'Teacher updated successfully', teacher });
    } catch (error) {
        console.error('Update Teacher Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const uploadTranscript = async (req, res) => {
    try {
        const { regNo, semester } = req.body;

        if (!regNo || !semester || !req.file) {
            return res.status(400).json({ success: false, message: 'Missing required fields or file' });
        }

        const fileUrl = req.file.path;

        const newTranscript = new Transcript({
            regNo,
            semester,
            fileUrl
        });

        await newTranscript.save();
        res.status(201).json({ success: true, message: 'Transcript uploaded successfully', transcript: newTranscript });
    } catch (error) {
        console.error('Upload Transcript Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const getAllCertificates = async (req, res) => {
    try {
        const certificates = await Certificate.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, certificates });
    } catch (error) {
        console.error('Get All Certificates Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const issueCertificate = async (req, res) => {
    try {
        const { studentId, certificateType } = req.body;
        
        if (!studentId || !certificateType) {
            return res.status(400).json({ success: false, message: 'Missing required fields for certificate' });
        }

        const student = await Student.findOne({ regNo: studentId });
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        let fileUrl = '';
        if (req.file && req.file.path) {
            fileUrl = req.file.path;
        }

        const newCert = new Certificate({
            studentId,
            studentName: student.name,
            courseTitle: student.programName || student.faculty || 'N/A',
            certificateType,
            faculty: student.faculty,
            semester: student.currentSemester,
            fileUrl
        });

        await newCert.save();
        res.status(201).json({ success: true, message: 'Certificate issued successfully', certificate: newCert });
    } catch (error) {
        console.error('Issue Certificate Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const updateCertificate = async (req, res) => {
    try {
        const { id } = req.params;
        const { certificateType } = req.body;
        const updateData = { certificateType };
        
        if (req.file && req.file.path) {
            updateData.fileUrl = req.file.path;
        }

        const cert = await Certificate.findByIdAndUpdate(id, updateData, { new: true });
        if (!cert) return res.status(404).json({ success: false, message: 'Certificate not found' });
        
        res.status(200).json({ success: true, message: 'Certificate updated', certificate: cert });
    } catch (error) {
        console.error('Update Certificate Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const deleteCertificate = async (req, res) => {
    try {
        const { id } = req.params;
        const cert = await Certificate.findByIdAndDelete(id);
        if (!cert) return res.status(404).json({ success: false, message: 'Certificate not found' });
        
        res.status(200).json({ success: true, message: 'Certificate deleted' });
    } catch (error) {
        console.error('Delete Certificate Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const createCourse = async (req, res) => {
    try {
        const { title, courseCode, faculty, description, classDays, classTime, fees } = req.body;
        
        if (!title || !courseCode || !faculty || !description || !classDays || !classTime) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        const existingCourse = await Course.findOne({ courseCode });
        if (existingCourse) {
            return res.status(400).json({ success: false, message: 'Course with this code already exists' });
        }

        const newCourse = new Course({ title, courseCode, faculty, description, classDays, classTime, fees: (fees === undefined || fees === null || fees === '') ? 0 : Number(fees) });
        await newCourse.save();
        
        res.status(201).json({ success: true, message: 'Course created successfully', course: newCourse });
    } catch (error) {
        console.error('Create Course Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const getAllCourses = async (req, res) => {
    try {
        const courses = await Course.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, courses });
    } catch (error) {
        console.error('Get All Courses Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const updateCourse = async (req, res) => {
    try {
        const { id } = req.params;
        console.log("updateCourse ID:", id);
        console.log("updateCourse body:", req.body);
        const { title, courseCode, faculty, description, classDays, classTime, fees } = req.body;

        if (!title || !courseCode || !faculty || !description || !classDays || !classTime) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        const updatedCourse = await Course.findByIdAndUpdate(
            id,
            { title, courseCode, faculty, description, classDays, classTime, fees: (fees === undefined || fees === null || fees === '') ? 0 : Number(fees) },
            { new: true, runValidators: true }
        );

        if (!updatedCourse) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        res.status(200).json({ success: true, message: 'Course updated successfully', course: updatedCourse });
    } catch (error) {
        console.error('Update Course Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const deleteCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedCourse = await Course.findByIdAndDelete(id);

        if (!deletedCourse) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        // Optional: Remove this course from users' assignedCourses array
        await Student.updateMany({ assignedCourses: id }, { $pull: { assignedCourses: id } });

        res.status(200).json({ success: true, message: 'Course deleted successfully' });
    } catch (error) {
        console.error('Delete Course Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const assignCoursesToUser = async (req, res) => {
    try {
        const { userId, courseIds } = req.body;

        if (!userId || !Array.isArray(courseIds)) {
            return res.status(400).json({ success: false, message: 'Invalid data provided' });
        }

        const user = await Student.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        user.assignedCourses = courseIds;

        if (user.role === 'student') {
            const courses = await Course.find({ _id: { $in: courseIds } });
            const totalCourseFees = courses.reduce((sum, course) => sum + (course.fees || 0), 0);
            user.feeTotal = totalCourseFees;
            
            // Adjust fee status based on payments
            if (user.feePaid >= user.feeTotal && user.feeTotal > 0) {
                user.feeStatus = 'Paid';
            } else if (user.feePaid > 0) {
                user.feeStatus = 'Unpaid'; // Or partially paid if you have that status
            } else {
                user.feeStatus = 'Unpaid';
            }
        }

        await user.save();

        res.status(200).json({ success: true, message: 'Courses assigned successfully' });
    } catch (error) {
        console.error('Assign Courses Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const getAttendance = async (req, res) => {
    try {
        const { date, targetType, courseId, timeSlot } = req.query;
        if (!date || !targetType) {
            return res.status(400).json({ success: false, message: 'Date and targetType are required' });
        }
        
        let query = { targetType };
        
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        query.date = { $gte: startOfDay, $lte: endOfDay };
        
        if (courseId) query.course = courseId;
        if (timeSlot) query.timeSlot = timeSlot;
        
        const records = await Attendance.find(query)
            .populate('userId', 'name regNo')
            .populate('course', 'title courseCode')
            .populate('markedById', 'name regNo')
            .sort({ timeSlot: 1 });
        res.status(200).json({ success: true, records });
    } catch (error) {
        console.error('Get Attendance Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Returns all STUDENT attendance for a date, grouped by course for the admin card view
export const getAttendanceCards = async (req, res) => {
    try {
        const { date } = req.query;
        if (!date) {
            return res.status(400).json({ success: false, message: 'Date is required' });
        }

        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        // Fetch all courses in the system
        const allCourses = await Course.find({}).sort({ title: 1 });

        // Debug: Log all teachers and their assigned courses to terminal
        const debugTeachers = await Student.find({ role: 'teacher' });
        console.log("\n=== DEBUG TEACHERS IN DB ===");
        debugTeachers.forEach(t => {
            console.log(`Teacher Name: "${t.name}"`);
            console.log(`Assigned Course IDs: ${JSON.stringify(t.assignedCourses)}`);
        });
        console.log("============================\n");

        // Fetch all student student attendance records for that day
        const records = await Attendance.find({
            targetType: 'Student',
            date: { $gte: startOfDay, $lte: endOfDay }
        })
            .populate('course', 'title courseCode')
            .populate('markedById', 'name regNo role')
            .sort({ timeSlot: 1 });

        // Initialize cards for all existing courses
        const cardMap = {};
        for (const course of allCourses) {
            const courseId = course._id.toString();
            const assignedTeacher = await Student.findOne({
                role: 'teacher',
                assignedCourses: course._id
            });
            cardMap[courseId] = {
                course: course,
                date: startOfDay,
                assignedTeacherName: assignedTeacher ? assignedTeacher.name : 'Not Assigned',
                timeSlots: {} // mapping timeSlot -> summary
            };
        }

        // Group attendance records under the course cards
        for (const r of records) {
            const courseId  = r.course?._id?.toString();
            if (!courseId) continue;
            
            if (!cardMap[courseId]) {
                cardMap[courseId] = {
                    course:  r.course || { _id: courseId, title: r.faculty || 'Unknown Course', courseCode: '—' },
                    date: r.date,
                    assignedTeacherName: 'Not Assigned',
                    timeSlots: {}
                };
            }
            
            if (!cardMap[courseId].timeSlots[r.timeSlot]) {
                let teacherName = cardMap[courseId].assignedTeacherName;
                if (teacherName === 'Not Assigned') {
                    if (r.markedById && r.markedById.role === 'teacher') {
                        teacherName = r.markedById.name;
                    }
                }
                cardMap[courseId].timeSlots[r.timeSlot] = {
                    present: 0,
                    absent: 0,
                    late: 0,
                    total: 0,
                    teacherName: teacherName
                };
            }
            
            const slotStat = cardMap[courseId].timeSlots[r.timeSlot];
            slotStat.total++;
            if (r.status === 'Present') slotStat.present++;
            if (r.status === 'Absent') slotStat.absent++;
            if (r.status === 'Late') slotStat.late++;
        }

        const cards = Object.values(cardMap).map(card => ({
            ...card,
            // Convert timeSlots object to array for easier frontend parsing
            timeSlots: Object.entries(card.timeSlots).map(([slot, stats]) => ({
                slot,
                ...stats
            }))
        }));

        res.status(200).json({ success: true, cards });
    } catch (error) {
        console.error('Get Attendance Cards Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Returns a matrix of students and their time slots for a specific date, teacher, and course
export const getDetailedAttendance = async (req, res) => {
    try {
        const { date, teacherId, courseId } = req.query;
        if (!date || !courseId) {
            return res.status(400).json({ success: false, message: 'Date and Course are required' });
        }

        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        let query = {
            targetType: 'Student',
            date: { $gte: startOfDay, $lte: endOfDay },
            course: courseId
        };
        if (teacherId && teacherId !== 'admin') {
            query.markedById = teacherId;
        }

        const records = await Attendance.find(query)
            .populate('userId', 'name regNo')
            .sort({ 'userId.name': 1, timeSlot: 1 });

        // Build a matrix: rows = students, cols = timeSlots
        const studentMap = {};
        const availableSlots = new Set();

        for (const r of records) {
            if (!r.userId) continue;
            availableSlots.add(r.timeSlot);
            
            const studentId = r.userId._id.toString();
            if (!studentMap[studentId]) {
                studentMap[studentId] = {
                    _id: studentId,
                    name: r.userId.name,
                    regNo: r.userId.regNo,
                    slots: {},
                    remarks: r.remarks || '' // Keep the latest remark or aggregate them
                };
            }
            
            studentMap[studentId].slots[r.timeSlot] = r.status;
            // Append remarks if there's a new one in this slot
            if (r.remarks && !studentMap[studentId].remarks.includes(r.remarks)) {
                 studentMap[studentId].remarks += (studentMap[studentId].remarks ? ' | ' : '') + r.remarks;
            }
        }

        res.status(200).json({ 
            success: true, 
            students: Object.values(studentMap),
            timeSlots: Array.from(availableSlots).sort()
        });
    } catch (error) {
        console.error('Get Detailed Attendance Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};


export const getStudentAttendanceSummary = async (req, res) => {
    try {
        const { courseId } = req.query;
        let matchQuery = { targetType: 'Student' };
        if (courseId) matchQuery.course = new (await import('mongoose')).default.Types.ObjectId(courseId);

        const summary = await Attendance.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: '$userId',
                    total: { $sum: 1 },
                    presents: { $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] } },
                    absents: { $sum: { $cond: [{ $eq: ['$status', 'Absent'] }, 1, 0] } },
                    lates: { $sum: { $cond: [{ $eq: ['$status', 'Late'] }, 1, 0] } }
                }
            },
            {
                $lookup: {
                    from: 'students',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'student'
                }
            },
            { $unwind: { path: '$student', preserveNullAndEmpty: true } },
            { $sort: { 'student.name': 1 } }
        ]);

        res.status(200).json({ success: true, summary });
    } catch (error) {
        console.error('Get Student Attendance Summary Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const markAttendance = async (req, res) => {
    try {
        const { records } = req.body; // Array of { userId, date, status, faculty, course, targetType, timeSlot }
        
        if (!records || !Array.isArray(records)) {
            return res.status(400).json({ success: false, message: 'Invalid data format' });
        }
        
        // Use bulk operations to update or insert records
        const bulkOps = records.map(record => ({
            updateOne: {
                filter: { 
                    userId: record.userId, 
                    date: new Date(new Date(record.date).setHours(0, 0, 0, 0)), 
                    course: record.course,
                    timeSlot: record.timeSlot || 'Morning'
                },
                update: { 
                    $set: { 
                        status: record.status, 
                        faculty: record.faculty, 
                        targetType: record.targetType,
                        timeSlot: record.timeSlot || 'Morning',
                        markedBy: 'Admin'
                    } 
                },
                upsert: true
            }
        }));
        
        if (bulkOps.length > 0) {
            await Attendance.bulkWrite(bulkOps, { ordered: false });
        }
        
        res.status(200).json({ success: true, message: 'Attendance marked successfully' });
    } catch (error) {
        console.error('Mark Attendance Error:', error);
        return res.status(400).json({ success: false, message: error.message });
    }
};

export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await Student.findByIdAndDelete(id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.status(200).json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete User Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const cleanupDummyData = async (req, res) => {
    try {
        const result = await Student.deleteMany({ email: { $regex: /dummy|test/i } });
        res.status(200).json({ success: true, message: `Deleted ${result.deletedCount} dummy users successfully` });
    } catch (error) {
        console.error('Cleanup Dummy Data Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const getAllNotices = async (req, res) => {
    try {
        const notices = await Notice.find().sort({ date: -1 });
        res.status(200).json({ success: true, notices });
    } catch (error) {
        console.error('Get All Notices Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const createNotice = async (req, res) => {
    try {
        const { title, type, description, date } = req.body;
        if (!title || !type || !description) {
            return res.status(400).json({ success: false, message: 'Please fill all required fields' });
        }
        
        const newNotice = new Notice({
            title,
            type,
            description,
            date: date || Date.now()
        });

        await newNotice.save();
        res.status(201).json({ success: true, message: 'Notice created successfully', notice: newNotice });
    } catch (error) {
        console.error('Create Notice Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const deleteNotice = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedNotice = await Notice.findByIdAndDelete(id);

        if (!deletedNotice) {
            return res.status(404).json({ success: false, message: 'Notice not found' });
        }

        res.status(200).json({ success: true, message: 'Notice deleted successfully' });
    } catch (error) {
        console.error('Delete Notice Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const updateStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, regNo, email, faculty, programName, currentSemester, totalSemesters, cgpa, attendanceRate, password } = req.body;

        const student = await Student.findById(id);
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        // Check if email or regNo is being changed to another existing user's
        if (email && email !== student.email) {
            const existing = await Student.findOne({ email });
            if (existing) {
                return res.status(400).json({ success: false, message: 'Email already in use by another user' });
            }
            student.email = email;
        }

        if (regNo && regNo !== student.regNo) {
            const existing = await Student.findOne({ regNo });
            if (existing) {
                return res.status(400).json({ success: false, message: 'Registration number already in use by another user' });
            }
            student.regNo = regNo;
            student.studentId = regNo; // sync studentId
        }

        if (name) student.name = name;
        if (faculty) student.faculty = faculty;
        if (programName !== undefined) student.programName = programName;
        if (currentSemester !== undefined) student.currentSemester = parseInt(currentSemester);
        if (totalSemesters !== undefined) student.totalSemesters = parseInt(totalSemesters);
        if (cgpa !== undefined) student.cgpa = parseFloat(cgpa);
        if (attendanceRate !== undefined) student.attendanceRate = parseFloat(attendanceRate);

        if (password) {
            const salt = await bcryptjs.genSalt(10);
            student.password = await bcryptjs.hash(password, salt);
        }

        await student.save();
        res.status(200).json({ success: true, message: 'Student updated successfully', student });
    } catch (error) {
        console.error('Update Student Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const getPendingFees = async (req, res) => {
    try {
        const students = await Student.find({ feeStatus: 'Pending' })
            .select('name regNo programName feeSlipLink feeStatus')
            .sort({ updatedAt: -1 });
        res.status(200).json({ success: true, students });
    } catch (error) {
        console.error('Get Pending Fees Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const approveFee = async (req, res) => {
    try {
        const { studentId } = req.params;
        const student = await Student.findById(studentId);
        
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        const pending = student.pendingFeeAmount > 0 
            ? student.pendingFeeAmount 
            : Math.max(0, (student.feeTotal || 15000) - (student.feePaid || 0));

        student.feePaid = (student.feePaid || 0) + pending;
        student.pendingFeeAmount = 0;
        student.feeStatus = 'Paid';

        // Update fee items if present
        if (student.feeItems && student.feeItems.length > 0) {
            student.feeItems = student.feeItems.map(item => {
                const plain = item.toObject ? item.toObject() : item;
                return { ...plain, status: 'Paid' };
            });
        }

        await student.save();

        res.status(200).json({ success: true, message: 'Deposit approved successfully!', student });
    } catch (error) {
        console.error('Approve Fee Error:', error);
        res.status(500).json({ success: false, message: 'Server error while approving fee' });
    }
};

export const resetFee = async (req, res) => {
    try {
        const { studentId } = req.params;
        const student = await Student.findById(studentId);
        
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        student.pendingFeeAmount = 0;
        student.feeSlipLink = '';
        student.feeStatus = 'Re-upload';

        await student.save();

        res.status(200).json({ success: true, message: 'Fee slip rejected successfully.', student });
    } catch (error) {
        console.error('Reset Fee Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

import Setting from '../models/Setting.js';

export const getSetting = async (req, res) => {
    try {
        const { key } = req.params;
        const setting = await Setting.findOne({ key });
        res.status(200).json({ success: true, value: setting ? setting.value : null });
    } catch (error) {
        console.error('Get Setting Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const updateSetting = async (req, res) => {
    try {
        const { key } = req.params;
        const { value } = req.body;

        const setting = await Setting.findOneAndUpdate(
            { key },
            { value },
            { new: true, upsert: true }
        );

        res.status(200).json({ success: true, setting, message: 'Setting updated successfully' });
    } catch (error) {
        console.error('Update Setting Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const updateCourseOutline = async (req, res) => {
    try {
        const { id } = req.params;
        const { outlineTitle, outlineDescription } = req.body;
        let outlineFile = req.file ? req.file.path : undefined;

        const course = await Course.findById(id);
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        course.outlineTitle = outlineTitle || '';
        course.outlineDescription = outlineDescription || '';
        if (outlineFile) {
            course.outlineFile = outlineFile;
        }

        await course.save();
        res.status(200).json({ success: true, message: 'Course outline updated successfully', course });
    } catch (error) {
        console.error('Update Course Outline Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const deleteCourseOutline = async (req, res) => {
    try {
        const { id } = req.params;

        const course = await Course.findById(id);
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        course.outlineTitle = '';
        course.outlineDescription = '';
        course.outlineFile = '';

        await course.save();
        res.status(200).json({ success: true, message: 'Course outline deleted successfully', course });
    } catch (error) {
        console.error('Delete Course Outline Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};



// --- RECYCLE BIN ---
export const getRecycleBin = async (req, res) => {
    try {
        const deletedUsers = await Student.find({ isDeleted: true }).select('-password').sort({ deletedAt: -1 });
        res.status(200).json({ success: true, users: deletedUsers });
    } catch (error) {
        console.error('Get Recycle Bin Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const restoreUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await Student.findByIdAndUpdate(id, { isDeleted: false, deletedAt: null }, { new: true });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.status(200).json({ success: true, message: 'User restored successfully' });
    } catch (error) {
        console.error('Restore User Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const hardDeleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await Student.findByIdAndDelete(id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.status(200).json({ success: true, message: 'User permanently deleted' });
    } catch (error) {
        console.error('Hard Delete User Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// --- CENTRAL FILE HUB ---
export const getFileHubData = async (req, res) => {
    try {
        const users = await Student.find({ isDeleted: { $ne: true } }).select('name role photoUrl cnicDocumentUrl marksheetDocumentUrl cvUrl degreeUrl coverLetterUrl');
        
        let files = [];
        
        users.forEach(user => {
            if (user.photoUrl) files.push({ userId: user._id, name: user.name, role: user.role, type: 'Profile Photo', url: user.photoUrl });
            if (user.cnicDocumentUrl) files.push({ userId: user._id, name: user.name, role: user.role, type: 'CNIC', url: user.cnicDocumentUrl });
            if (user.marksheetDocumentUrl) files.push({ userId: user._id, name: user.name, role: user.role, type: 'Marksheet', url: user.marksheetDocumentUrl });
            if (user.cvUrl) files.push({ userId: user._id, name: user.name, role: user.role, type: 'CV / Resume', url: user.cvUrl });
            if (user.degreeUrl) files.push({ userId: user._id, name: user.name, role: user.role, type: 'Degree', url: user.degreeUrl });
            if (user.coverLetterUrl) files.push({ userId: user._id, name: user.name, role: user.role, type: 'Cover Letter', url: user.coverLetterUrl });
        });
        
        res.status(200).json({ success: true, files });
    } catch (error) {
        console.error('Get File Hub Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const getAllTranscripts = async (req, res) => {
    try {
        const transcripts = await Transcript.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, transcripts });
    } catch (error) {
        console.error('Get All Transcripts Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const getTranscriptsByStudent = async (req, res) => {
    try {
        const { regNo } = req.params;
        const student = await Student.findOne({ regNo });
        if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
        const transcripts = await Transcript.find({ regNo: student.regNo }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, transcripts });
    } catch (error) {
        console.error('Get Transcripts by Student Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const deleteTranscript = async (req, res) => {
    try {
        const { id } = req.params;
        const transcript = await Transcript.findByIdAndDelete(id);
        if (!transcript) return res.status(404).json({ success: false, message: 'Transcript not found' });
        res.status(200).json({ success: true, message: 'Transcript deleted' });
    } catch (error) {
        console.error('Delete Transcript Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const replyToComplaint = async (req, res) => {
    try {
        const { id } = req.params;
        const { replyText } = req.body;
        const complaint = await Complaint.findById(id);
        if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });

        complaint.adminReply = replyText;
        complaint.repliedAt = new Date();
        complaint.status = 'Resolved';
        await complaint.save();

        res.status(200).json({ success: true, message: 'Reply submitted', complaint });
    } catch (error) {
        console.error('Reply to Complaint Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const deleteComplaint = async (req, res) => {
    try {
        const { id } = req.params;
        const complaint = await Complaint.findByIdAndDelete(id);
        if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });
        res.status(200).json({ success: true, message: 'Complaint deleted' });
    } catch (error) {
        console.error('Delete Complaint Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const generateFeeSchedule = async (req, res) => {
    try {
        const {
            programName = 'all',
            totalFee = 15000,
            splitType = 'even', // 'even' | 'voucher'
            monthsCount = 3,
            startMonth = '',
        } = req.body;

        const numTotal = Number(totalFee) || 15000;
        const numMonths = Math.max(1, Math.min(24, Number(monthsCount) || 3));

        // Month formatting helper
        let startDate = new Date();
        if (startMonth) {
            const parts = startMonth.split('-');
            if (parts.length >= 2) {
                startDate = new Date(Number(parts[0]), Number(parts[1]) - 1, 1);
            }
        }

        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];

        let baseItems = [];

        if (splitType === 'voucher') {
            // Predefined Voucher Template with structured breakdowns
            const startM = monthNames[startDate.getMonth()];
            const startY = startDate.getFullYear();

            const p1 = Math.round(numTotal * 0.20);
            const p2 = Math.round(numTotal * 0.40);
            const p3 = Math.round(numTotal * 0.30);
            const p4 = Math.max(0, numTotal - (p1 + p2 + p3));

            baseItems = [
                { title: "Enrollment Date + Fee", term: `${startM} ${startY} (Enrollment)`, amount: p1, status: "Unpaid" },
                { title: "Per Semester Fee", term: "Month 1 - 2", amount: p2, status: "Upcoming" },
                { title: "Remaining / Next Semester Fee", term: "Month 3 - 4", amount: p3, status: "Upcoming" },
                { title: "Certificate Fee (CNS/CPET)", term: "End of Course", amount: p4, status: "Upcoming" }
            ];
        } else {
            // Even Monthly Split
            const perMonth = Math.floor(numTotal / numMonths);
            const remainder = numTotal - (perMonth * numMonths);

            for (let i = 0; i < numMonths; i++) {
                const targetDate = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
                const mName = monthNames[targetDate.getMonth()];
                const yName = targetDate.getFullYear();
                const amt = (i === numMonths - 1) ? (perMonth + remainder) : perMonth;

                baseItems.push({
                    title: `Month ${i + 1} Tuition Fee`,
                    term: `${mName} ${yName}`,
                    amount: amt,
                    status: i === 0 ? "Unpaid" : "Upcoming"
                });
            }
        }

        // Query matching students
        const filter = { isDeleted: { $ne: true } };
        if (programName && programName !== 'all') {
            filter.programName = programName;
        }

        const students = await Student.find(filter);

        if (students.length === 0) {
            return res.status(404).json({
                success: false,
                message: `No active students found for ${programName === 'all' ? 'the selected filter' : programName}`
            });
        }

        // Iterate students and apply schedule
        for (const student of students) {
            const paidSoFar = student.feePaid || 0;
            let runningPaid = paidSoFar;

            // Generate items tailored with this student's paid status
            const studentItems = baseItems.map(item => {
                const itemAmt = Number(item.amount) || 0;
                if (runningPaid >= itemAmt && itemAmt > 0) {
                    runningPaid -= itemAmt;
                    return { ...item, status: 'Paid' };
                } else if (runningPaid > 0) {
                    runningPaid = 0;
                    return { ...item, status: 'Unpaid' };
                } else {
                    return { ...item };
                }
            });

            student.feeItems = studentItems;
            student.feeTotal = numTotal;

            if (student.feePaid >= numTotal) {
                student.feeStatus = 'Paid';
            } else if (student.feeStatus === 'Paid') {
                student.feeStatus = 'Unpaid';
            }

            await student.save();
        }

        res.status(200).json({
            success: true,
            message: `Monthly fee schedule successfully generated for ${students.length} student(s)!`,
            count: students.length,
            generatedItems: baseItems
        });
    } catch (error) {
        console.error('Generate Fee Schedule Error:', error);
        res.status(500).json({ success: false, message: 'Server error while generating fee schedule' });
    }
};

export const getStudentVoucher = async (req, res) => {
    try {
        const { id } = req.params;
        const student = await Student.findById(id).populate('assignedCourses');
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }
        
        const voucherData = buildVoucherData(student);
        res.status(200).json({ success: true, voucher: voucherData, student });
    } catch (error) {
        console.error('Error fetching student voucher:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const updateStudentVoucher = async (req, res) => {
    try {
        const { id } = req.params;
        const { voucher, amountPaid } = req.body;
        
        const student = await Student.findById(id).populate('assignedCourses');
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        // Update voucher object
        if (voucher) {
            const currentVoucher = student.voucher ? student.voucher.toObject() : {};
            student.voucher = {
                ...currentVoucher,
                ...voucher,
                fees: { ...(currentVoucher.fees || {}), ...(voucher.fees || {}) },
                lineStatus: { ...(currentVoucher.lineStatus || {}), ...(voucher.lineStatus || {}) }
            };
        }

        // Compute total fee from lines
        if (voucher && voucher.fees) {
            const f = voucher.fees;
            const newTotalFee = (Number(f.enrollmentFee) || 0) +
                                (Number(f.perSemesterFee) || 0) +
                                (Number(f.secondSemesterFee) || 0) +
                                (Number(f.secondCertificateFee) || 0) +
                                (Number(f.currentFee) || 0) +
                                (Number(f.remainingSemestersFee) || 0) +
                                (Number(f.certificateFeeCNS) || 0) +
                                (Number(f.certificateFeeCPET) || 0);
                                
            student.feeTotal = newTotalFee;
            
            // Rebuild feeItems for backward compatibility
            const ls = voucher.lineStatus || {};
            const items = [];
            
            if (f.enrollmentFee) items.push({ title: 'Enrollment Fee', term: 'Initial', amount: f.enrollmentFee, status: ls.enrollmentFee || 'Unpaid' });
            if (f.perSemesterFee) items.push({ title: 'Per Semester Fee', term: 'Current', amount: f.perSemesterFee, status: ls.perSemesterFee || 'Unpaid' });
            if (f.secondSemesterFee) items.push({ title: 'Second Semester Fee', term: 'Next', amount: f.secondSemesterFee, status: ls.secondSemesterFee || 'Unpaid' });
            if (f.secondCertificateFee) items.push({ title: 'Second Certificate Fee', term: 'Next', amount: f.secondCertificateFee, status: ls.secondCertificateFee || 'Unpaid' });
            if (f.currentFee) items.push({ title: 'Current Fee', term: 'Current', amount: f.currentFee, status: ls.currentFee || 'Unpaid' });
            if (f.remainingSemestersFee) items.push({ title: 'Remaining Semesters Fee', term: 'Future', amount: f.remainingSemestersFee, status: ls.remainingSemestersFee || 'Unpaid' });
            if (f.certificateFeeCNS) items.push({ title: 'Certificate Fee (CNS)', term: 'End', amount: f.certificateFeeCNS, status: ls.certificateFeeCNS || 'Unpaid' });
            if (f.certificateFeeCPET) items.push({ title: 'Certificate Fee (CPET)', term: 'End', amount: f.certificateFeeCPET, status: ls.certificateFeeCPET || 'Unpaid' });
            
            student.feeItems = items;
        }

        if (amountPaid !== undefined) {
            const amount = Number(amountPaid);
            if (!isNaN(amount) && amount >= 0 && amount <= 10000000) {
                 student.feePaid = amount;
            } else {
                 return res.status(400).json({ success: false, message: 'Invalid amountPaid value' });
            }
        }

        // Update feeStatus consistently
        const currentPaid = student.feePaid || 0;
        const currentTotal = student.feeTotal || 0;
        if (currentTotal > 0 && currentPaid >= currentTotal) {
            student.feeStatus = 'Paid';
        } else if (student.feeStatus === 'Paid' && currentPaid < currentTotal) {
            student.feeStatus = 'Unpaid';
        }

        const updatedStudent = await student.save();
        
        // Return updated voucher view
        const populatedStudent = await Student.findById(updatedStudent._id).populate('assignedCourses');
        const voucherData = buildVoucherData(populatedStudent);

        res.status(200).json({ success: true, message: 'Fee voucher updated successfully', voucher: voucherData, student: populatedStudent });
    } catch (error) {
        console.error('Error updating student voucher:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
