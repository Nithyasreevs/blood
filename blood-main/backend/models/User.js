const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  user_id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['donor', 'hospital', 'admin', 'patient'], default: 'donor' },
  city: { type: String, required: true },
  // GPS is captured explicitly during donor/hospital registration.
  // Do not use a city default: it would make distance matches incorrect.
  latitude: { type: Number, default: null },
  longitude: { type: Number, default: null },
  status: { type: String, enum: ['active', 'suspended'], default: 'active' },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
