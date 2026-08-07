const mongoose = require('mongoose');
const donorSchema = new mongoose.Schema({
  donor_id: {type: String, required: true, unique: true },
  user_id: {type: String, required: true, ref: 'User' },
  blood_group: {type: String, required: true },
  weight: {type: Number, default: 65 },
  last_donation: {type: Date, default: null },
  availability: {type: Boolean, default: true },
  verified: {type: Boolean, default: true },
  response_rate: {type: Number, default: 95 },
  total_donations: {type: Number, default: 0 },
  status: {type: String, default: 'active' },
  // Missing GPS must remain missing; matching excludes it rather than guessing.
  latitude: {type: Number, default: null},
  longitude: {type: Number, default: null}
});
module.exports = mongoose.model('Donor', donorSchema);
