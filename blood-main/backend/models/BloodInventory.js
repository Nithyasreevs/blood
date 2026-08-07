const mongoose = require('mongoose');

const bloodInventorySchema = new mongoose.Schema({
  inventory_id: { type: String, required: true, unique: true },
  hospital_id: { type: String, required: true, ref: 'Hospital' },
  hospital_name: { type: String },
  blood_group: { type: String, required: true },
  available_units: { type: Number, default: 0 },
  updated_time: { type: Date, default: Date.now }
});

module.exports = mongoose.model('BloodInventory', bloodInventorySchema);
