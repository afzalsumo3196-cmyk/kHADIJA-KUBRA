import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true,
  },
  quote: {
    type: String,
    required: true,
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: 5,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  adminReply: {
    type: String,
    default: '',
  },
  repliedAt: {
    type: Date,
  }
});

const Review = mongoose.model('Review', reviewSchema);

export default Review;
