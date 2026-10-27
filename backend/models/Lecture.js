import mongoose from 'mongoose';

const lectureSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  fileUrl: { type: String, required: true },
  fileType: { type: String, default: 'link' },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  duration: { type: String, default: "00:00" },
  faculty: { type: String, required: true } // e.g., Aalima
}, { timestamps: true });

export default mongoose.model('Lecture', lectureSchema);