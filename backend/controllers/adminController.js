const User = require('../models/User');
const Donor = require('../models/Donor');
const Hospital = require('../models/Hospital');
const EmergencyRequest = require('../models/EmergencyRequest');
const BloodInventory = require('../models/BloodInventory');
const Notification = require('../models/Notification');
const Donation = require('../models/Donation');

exports.getDashboard = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: { $ne: 'admin' } });
    const totalDonors = await User.countDocuments({ role: 'donor' });
    const activeRequests = await EmergencyRequest.countDocuments({ status: { $nin: ['Completed', 'Cancelled'] } });
    const totalDonations = await Donation.countDocuments();
    const totalHospitals = await User.countDocuments({ role: 'hospital' });
    const fakeRequestsCount = await EmergencyRequest.countDocuments({ $or: [{ ai_risk_score: { $gte: 60 } }, { status: 'Needs Verification' }] });

    return res.json({
      success: true,
      dashboard: {
        total_users: totalUsers,
        total_donors: totalDonors,
        active_requests: activeRequests,
        total_donations: totalDonations,
        total_hospitals: totalHospitals,
        lives_saved: totalDonations * 3,
        avg_response_time_mins: 14.2,
        fake_requests_flagged: fakeRequestsCount
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({});
    return res.json({ success: true, users });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateUserStatus = async (req, res) => {
  try {
    const { user_id, action } = req.body;
    const newStatus = action === 'suspend' ? 'suspended' : 'active';
    await User.updateOne({ user_id }, { status: newStatus });
    return res.json({ success: true, message: `User status updated to ${newStatus} in MongoDB database` });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getDonors = async (req, res) => {
  try {
    const donors = await Donor.find({});
    return res.json({ success: true, donors });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.verifyDonorStatus = async (req, res) => {
  try {
    const { donor_id, verified } = req.body;
    await Donor.updateOne({ donor_id }, { verified: Boolean(verified) });
    return res.json({ success: true, message: 'Donor verification status updated in MongoDB database' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getHospitals = async (req, res) => {
  try {
    const hospitals = await User.find({ role: 'hospital' }, { password: 0 });
    return res.json({ success: true, hospitals });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.addHospital = async (req, res) => {
  try {
    const { name, address, city, latitude, longitude, phone } = req.body;
    const newHosp = {
      hospital_id: `hosp_${Date.now()}`,
      user_id: `usr_hosp_${Date.now()}`,
      name: name || 'New City Hospital',
      address: address || 'Main Road',
      city: city || 'Chennai',
      latitude: Number(latitude) || 13.0827,
      longitude: Number(longitude) || 80.2707,
      phone: phone || '044-12345678'
    };
    await Hospital.create(newHosp);
    return res.status(201).json({ success: true, message: `Hospital ${newHosp.name} added to MongoDB database!`, hospital: newHosp });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.removeHospital = async (req, res) => {
  try {
    const { hospital_id } = req.body;
    await Hospital.deleteOne({ hospital_id });
    return res.json({ success: true, message: 'Hospital removed from MongoDB database' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAllRequests = async (req, res) => {
  try {
    const requests = await EmergencyRequest.find({});
    return res.json({ success: true, requests });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.verifyRequest = async (req, res) => {
  try {
    const { request_id } = req.body;
    await EmergencyRequest.updateOne({ request_id }, { status: 'Waiting', ai_risk_score: 10 });
    return res.json({ success: true, message: 'Request verified in MongoDB database!' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.blockRequest = async (req, res) => {
  try {
    const { request_id } = req.body;
    await EmergencyRequest.deleteOne({ request_id });
    return res.json({ success: true, message: 'Request blocked and removed from MongoDB database.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getInventoryMonitor = async (req, res) => {
  try {
    const allInventories = await BloodInventory.find({});
    const shortages = allInventories.filter(i => i.available_units < 5);
    return res.json({ success: true, all_inventories: allInventories, shortages });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAnalytics = async (req, res) => {
  try {
    const topDonors = await Donor.find({}).limit(5);
    return res.json({
      success: true,
      analytics: {
        response_success_rate: 98,
        avg_response_time_minutes: 14.2,
        fulfillment_speed_pct: 96,
        top_donors: topDonors,
        blood_demand_by_group: [
          { group: 'O+', percentage: 38 },
          { group: 'A+', percentage: 26 },
          { group: 'B+', percentage: 20 },
          { group: 'AB+', percentage: 8 },
          { group: 'O-', percentage: 5 },
          { group: 'Other', percentage: 3 }
        ]
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.broadcastNotification = async (req, res) => {
  try {
    const { title, message } = req.body;
    const newNotif = {
      notification_id: `notif_${Date.now()}`,
      user_id: 'broadcast_all',
      title: title || 'System Broadcast',
      message: message || 'Urgent blood donation drive announced for this weekend.',
      status: 'unread',
      sent_time: new Date()
    };
    await Notification.create(newNotif);
    return res.json({ success: true, message: 'Broadcast message saved to MongoDB and dispatched to all users!' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
