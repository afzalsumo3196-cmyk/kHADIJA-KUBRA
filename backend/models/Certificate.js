import mongoose from 'mongoose';

const certificateSchema = new mongoose.Schema(
    {
        studentId: {
            type: String, // String regNo reference as requested by user
            required: true,
        },
        studentName: {
            type: String,
            required: true,
        },
        courseTitle: {
            type: String,
            required: true,
        },
        issueDate: {
            type: Date,
            default: Date.now,
        },
        fileUrl: {
            type: String,
        },
        certificateType: {
            type: String,
        },
        faculty: {
            type: String,
        },
        semester: {
            type: Number,
        },
        status: {
            type: String,
            enum: ['Issued', 'Revoked'],
            default: 'Issued',
        },
    },
    {
        timestamps: true,
    }
);

const Certificate = mongoose.model('Certificate', certificateSchema);

export default Certificate;
