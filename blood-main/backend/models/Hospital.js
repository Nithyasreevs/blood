const mongoose = require('mongoose');

const hospitalSchema = new mongoose.Schema({
  hospital_id: { type: String, required: true, unique: true },
  user_id: { type: String, ref: 'User' },
  name: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  phone: { type: String, required: true }
});

module.exports = mongoose.model('Hospital', hospitalSchema);
