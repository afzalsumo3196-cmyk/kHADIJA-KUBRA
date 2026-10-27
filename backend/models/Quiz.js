import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswer: { type: String, required: true }
});

const quizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  faculty: { type: String, required: true },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  questions: [questionSchema],
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  timeLimit: { type: Number, default: 15 }, // total quiz duration in minutes
  allowedAttempts: { type: Number, default: 1 },
  startDate: { type: Date },
  endDate: { type: Date }
}, { timestamps: true });

export default mongoose.model('Quiz', quizSchema);
