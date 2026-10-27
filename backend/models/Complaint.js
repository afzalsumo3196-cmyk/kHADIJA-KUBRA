import mongoose from 'mongoose';

const complaintSchema = new mongoose.Schema(
    {
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Student',
            required: true,
        },
        category: {
            type: String,
            required: true,
            enum: ['Academic Issue', 'Portal/Technical Issue', 'Administration', 'Other'],
        },
        urgency: {
            type: String,
            required: true,
            enum: ['Low', 'Medium', 'High', 'Critical'],
            default: 'Medium',
        },
        subject: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ['Pending', 'In Progress', 'Resolved', 'Rejected'],
            default: 'Pending',
        },
        adminReply: {
            type: String,
            default: '',
        },
        repliedAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

const Complaint = mongoose.model('Complaint', complaintSchema);

export default Complaint;
