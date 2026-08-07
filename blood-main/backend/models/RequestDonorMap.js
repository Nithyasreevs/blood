const mongoose = require('mongoose');

const requestDonorMapSchema = new mongoose.Schema({
  map_id: { type: String, required: true, unique: true },
  request_id: { type: String, required: true, ref: 'EmergencyRequest' },
  donor_id: { type: String, required: true, ref: 'Donor' },
  compatibility_score: { type: Number, required: true },
  distance: { type: Number, required: true },
  AI_score: { type: Number, required: true },
  notification_status: { type: String, enum: ['Notified', 'Accepted', 'Rejected', 'Arrived'], default: 'Notified' },
  accepted_time: { type: Date, default: null },
  arrival_time: { type: Date, default: null },
  donor_lat: { type: Number },
  donor_lng: { type: Number }
});

module.exports = mongoose.model('RequestDonorMap', requestDonorMapSchema);
