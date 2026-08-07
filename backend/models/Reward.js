const mongoose = require('mongoose');

const rewardSchema = new mongoose.Schema({
  reward_id: { type: String, required: true, unique: true },
  donor_id: { type: String, required: true, ref: 'Donor' },
  badge: { type: String, required: true },
  points: { type: Number, default: 0 },
  level: { type: String, default: 'Bronze' }
});

module.exports = mongoose.model('Reward', rewardSchema);
