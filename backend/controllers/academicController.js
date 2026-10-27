import Note from '../models/Note.js';
import Assignment from '../models/Assignment.js';
import Student from '../models/Student.js'; // Can be student or teacher
import AssignmentSubmission from '../models/AssignmentSubmission.js';

export const uploadNote = async (req, res) => {
    try {
        const { title, description, courseId } = req.body;
        
        if (!title || !description || !courseId || !req.file) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        const teacherId = req.user.id || req.user._id;

        const newNote = new Note({
            title,
            description,
            course: courseId,
            fileUrl: req.file.path,
            uploaderId: teacherId
        });

        await newNote.save();
        res.status(201).json({ success: true, message: 'Note uploaded successfully', note: newNote });
    } catch (error) {
        console.error('Upload Note Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const getNotes = async (req, res) => {
    try {
        const { courseId } = req.query;
        let filter = {};
        
        if (courseId) {
            filter.course = courseId;
        } else {
            // If no courseId provided, return notes for all assigned courses
            const userId = req.user.id || req.user._id;
            const user = await Student.findById(userId);
            if (user && user.assignedCourses) {
                filter.course = { $in: user.assignedCourses };
            }
        }

        const notes = await Note.find(filter).populate('course', 'title courseCode').sort({ createdAt: -1 });
        res.status(200).json({ success: true, notes });
    } catch (error) {
        console.error('Get Notes Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const deleteNote = async (req, res) => {
    try {
        await Note.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: 'Note deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const uploadAssignment = async (req, res) => {
    try {
        const { title, description, deadline, courseId } = req.body;
        
        if (!title || !description || !deadline || !courseId || !req.file) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        const teacherId = req.user.id || req.user._id;

        const newAssignment = new Assignment({
            title,
            description,
            deadline,
            course: courseId,
            fileUrl: req.file.path,
            uploaderId: teacherId
        });

        await newAssignment.save();
        res.status(201).json({ success: true, message: 'Assignment uploaded successfully', assignment: newAssignment });
    } catch (error) {
        console.error('Upload Assignment Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const getAssignments = async (req, res) => {
    try {
        const { courseId } = req.query;
        let filter = {};
        
        if (courseId) {
            filter.course = courseId;
        } else {
            // If no courseId provided, return assignments for all assigned courses
            const userId = req.user.id || req.user._id;
            const user = await Student.findById(userId);
            if (user && user.assignedCourses) {
                filter.course = { $in: user.assignedCourses };
            }
        }

        const assignments = await Assignment.find(filter).populate('course', 'title courseCode').sort({ deadline: 1 });
        res.status(200).json({ success: true, assignments });
    } catch (error) {
        console.error('Get Assignments Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const deleteAssignment = async (req, res) => {
    try {
        await Assignment.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: 'Assignment deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const submitAssignment = async (req, res) => {
    try {
        const { assignmentId } = req.body;
        
        if (!assignmentId || !req.file) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        const studentId = req.user.id || req.user._id;

        // Check if already submitted
        let existingSubmission = await AssignmentSubmission.findOne({ assignment: assignmentId, student: studentId });
        if (existingSubmission) {
            existingSubmission.fileUrl = req.file.path;
            existingSubmission.submittedAt = new Date();
            await existingSubmission.save();
            return res.status(200).json({ success: true, message: 'Assignment updated successfully', submission: existingSubmission });
        }

        const newSubmission = new AssignmentSubmission({
            assignment: assignmentId,
            student: studentId,
            fileUrl: req.file.path,
            submittedAt: new Date()
        });

        await newSubmission.save();
        res.status(201).json({ success: true, message: 'Assignment submitted successfully', submission: newSubmission });
    } catch (error) {
        console.error('Submit Assignment Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const getSubmissions = async (req, res) => {
    try {
        const { assignmentId } = req.query;
        const userId = req.user.id || req.user._id;
        const user = await Student.findById(userId);

        let filter = {};
        
        if (user.role === 'teacher' || user.role === 'admin') {
            // Teachers can fetch all submissions for a given assignment
            if (!assignmentId) {
                return res.status(400).json({ success: false, message: 'Assignment ID is required for teachers' });
            }
            filter.assignment = assignmentId;
        } else {
            // Students only see their own submissions
            filter.student = userId;
            if (assignmentId) {
                filter.assignment = assignmentId;
            }
        }

        const submissions = await AssignmentSubmission.find(filter)
            .populate('student', 'name regNo')
            .populate('assignment', 'title deadline course')
            .sort({ submittedAt: -1 });

        res.status(200).json({ success: true, submissions });
    } catch (error) {
        console.error('Get Submissions Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
