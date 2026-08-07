const mongoose = require('mongoose');

const emergencyRequestSchema = new mongoose.Schema({
  request_id: { type: String, required: true, unique: true },
  hospital_id: { type: String, ref: 'Hospital' },
  hospital_name: { type: String, default: 'General Hospital' },
  patient_name: { type: String, required: true },
  blood_group: { type: String, required: true },
  units: { type: Number, required: true },
  priority: { type: String, enum: ['Critical', 'High', 'Scheduled'], default: 'High' },
  contact_number: { type: String, required: true },
  city: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  status: { type: String, enum: ['Waiting', 'Donor Matched', 'Donor Accepted', 'Donor Arriving', 'Completed', 'Needs Verification', 'Cancelled'], default: 'Waiting' },
  created_time: { type: Date, default: Date.now },
  expiry_time: { type: Date },
  ai_risk_score: { type: Number, default: 5 },
  radius_km: { type: Number, default: 5 },
  verification_code: { type: String },
  accepted_donor_id: { type: String }
});

module.exports = mongoose.model('EmergencyRequest', emergencyRequestSchema);
