const mongoose = require('mongoose');

const bloodCampSchema = new mongoose.Schema({
  camp_id: { type: String, required: true, unique: true },
  hospital: { type: String, required: true },
  date: { type: String, required: true },
  venue: { type: String, required: true },
  organizer: { type: String, required: true },
  city: { type: String, required: true },
  registered_count: { type: Number, default: 0 }
});

module.exports = mongoose.model('BloodCamp', bloodCampSchema);
