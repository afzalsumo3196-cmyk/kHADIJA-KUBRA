// [LIVE_QUESTIONS_DISABLED]
/* 
import mongoose from 'mongoose';

const liveQuestionSchema = new mongoose.Schema({
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    questionText: {
        type: String,
        required: false
    },
    questions: {
        type: [String],
        default: []
    },
    duration: {
        type: Number, // in minutes
        required: true
    },
    publishType: {
        type: String,
        enum: ['now', 'scheduled'],
        default: 'now'
    },
    scheduledTime: {
        type: Date
    },
    status: {
        type: String,
        enum: ['draft', 'active', 'ended'],
        default: 'draft'
    },
    publishedAt: {
        type: Date
    },
    endAt: {
        type: Date
    },
    answers: [{
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Student'
        },
        answerText: {
            type: String,
            required: false
        },
        answerTexts: {
            type: [String],
            default: []
        },
        obtainedMarks: {
            type: Number,
            required: false
        },
        totalMarks: {
            type: Number,
            required: false
        },
        gradedAt: {
            type: Date
        },
        submittedAt: {
            type: Date,
            default: Date.now
        }
    }]
}, { timestamps: true });

const LiveQuestion = mongoose.model('LiveQuestion', liveQuestionSchema);
export default LiveQuestion;

*/