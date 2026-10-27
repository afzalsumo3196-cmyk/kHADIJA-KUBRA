import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Student'  // both students and teachers are stored in Student collection
    },
    targetType: {
        type: String,
        enum: ['Student', 'Teacher'],
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    timeSlot: {
        type: String,
        default: 'Morning', // e.g. "Morning", "Afternoon", "08:00 AM - 09:30 AM"
        trim: true
    },
    status: {
        type: String,
        enum: ['Present', 'Absent', 'Late'],
        required: true
    },
    faculty: {
        type: String,
        required: true
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    markedBy: {
        type: String,
        enum: ['Teacher', 'Admin'],
        default: 'Admin'
    },
    markedById: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student', // teacher's _id
        default: null
    },
    remarks: {
        type: String,
        default: '',
        trim: true
    }
}, { timestamps: true });

// Unique per user per date per course per timeSlot
attendanceSchema.index({ userId: 1, date: 1, course: 1, timeSlot: 1 }, { unique: true });

const Attendance = mongoose.model('Attendance', attendanceSchema);
export default Attendance;
