const mongoose = require('mongoose');

const campRegistrationSchema = new mongoose.Schema({
  registration_id: { type: String, required: true, unique: true },
  camp_id: { type: String, required: true, ref: 'BloodCamp' },
  donor_id: { type: String, required: true, ref: 'Donor' },
  status: { type: String, enum: ['Registered', 'Attended', 'Cancelled'], default: 'Registered' },
  registered_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CampRegistration', campRegistrationSchema);
