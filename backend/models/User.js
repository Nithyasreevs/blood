const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  user_id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['donor', 'hospital', 'admin', 'patient'], default: 'donor' },
  city: { type: String, required: true },
  latitude: { type: Number, default: 13.0827 },
  longitude: { type: Number, default: 80.2707 },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
