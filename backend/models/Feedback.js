const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  feedback_id: { type: String, required: true, unique: true },
  request_id: { type: String, required: true, ref: 'EmergencyRequest' },
  donor_id: { type: String, ref: 'Donor' },
  rating: { type: Number, required: true },
  comments: { type: String, required: true },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Feedback', feedbackSchema);
