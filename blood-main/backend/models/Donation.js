const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
  donation_id: { type: String, required: true, unique: true },
  request_id: { type: String, ref: 'EmergencyRequest' },
  donor_id: { type: String, required: true, ref: 'Donor' },
  donor_name: { type: String },
  hospital_id: { type: String, ref: 'Hospital' },
  hospital_name: { type: String, default: 'Apollo Hospital' },
  verified: { type: Boolean, default: true },
  date: { type: Date, default: Date.now },
  units: { type: Number, default: 1 },
  blood_group: { type: String },
  qr_code: { type: String }
});

module.exports = mongoose.model('Donation', donationSchema);
