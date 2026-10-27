import mongoose from 'mongoose';

const gradeSchema = new mongoose.Schema({
    studentId: {
        type: String,
        required: true,
        ref: 'Student' // References RegNo
    },
    title: {
        type: String,
        required: true
    },
    marksObtained: {
        type: Number,
        required: true,
        min: 0
    },
    totalMarks: {
        type: Number,
        required: true,
        min: 1
    },
    type: {
        type: String,
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
    attemptsCount: {
        type: Number,
        default: 1
    },
    quizId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quiz',
        default: null
    },
    answers: [{
        questionIndex: { type: Number },
        selected: { type: String },
        correctAnswer: { type: String },
        isCorrect: { type: Boolean },
        marks: { type: Number }
    }],
    submittedAt: {
        type: Date
    },
    attempts: [{
        attemptNo: { type: Number },
        submittedAt: { type: Date },
        score: { type: Number },
        totalMarks: { type: Number },
        correctCount: { type: Number },
        wrongCount: { type: Number },
        unansweredCount: { type: Number },
        answers: [{
            questionIndex: { type: Number },
            selected: { type: String, default: null },
            isCorrect: { type: Boolean },
            marks: { type: Number }
        }]
    }]
}, { timestamps: true });

const Grade = mongoose.model('Grade', gradeSchema);
export default Grade;
