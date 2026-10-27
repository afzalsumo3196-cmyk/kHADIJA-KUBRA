import Review from '../models/Review.js';

// Public GET
export const getReviews = async (req, res) => {
  try {
    const reviews = await Review.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching reviews', error: error.message });
  }
};

// Admin POST
export const addReview = async (req, res) => {
  try {
    const { name, role, quote } = req.body;
    if (!name || !role || !quote) {
      return res.status(400).json({ success: false, message: 'Please provide all fields.' });
    }

    const newReview = new Review({ name, role, quote });
    await newReview.save();

    res.status(201).json({ success: true, review: newReview, message: 'Review added successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error adding review', error: error.message });
  }
};

// Admin DELETE
export const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    await Review.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error deleting review', error: error.message });
  }
};

// Admin PUT Reply
export const replyToReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { replyText } = req.body;
    
    const review = await Review.findById(id);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });

    review.adminReply = replyText;
    review.repliedAt = new Date();
    await review.save();

    res.status(200).json({ success: true, message: 'Reply added successfully', review });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error replying to review', error: error.message });
  }
};
