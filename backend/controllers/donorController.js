const User = require('../models/User');
const Donor = require('../models/Donor');
const EmergencyRequest = require('../models/EmergencyRequest');
const Donation = require('../models/Donation');
const Notification = require('../models/Notification');
const { calculateAIDonorScore, calculateETA, isBloodCompatible } = require('../utils/aiEngine');

exports.getProfile = async (req, res) => {
  try {
    const userId = req.query.user_id;
    if (!userId) return res.json({ success: false, message: 'User ID required' });

    const user = await User.findOne({ user_id: userId });
    const donor = await Donor.findOne({ user_id: userId });

    if (!user && !donor) return res.json({ success: false, message: 'User not found' });

    return res.json({
      success: true,
      donor: {
        user_id: user?.user_id || userId,
        name: user?.name || 'Registered Donor',
        email: user?.email || '',
        phone: user?.phone || '',
        city: user?.city || 'Chennai',
        blood_group: donor?.blood_group || 'Unknown',
        weight: donor?.weight || 65,
        total_donations: donor?.total_donations || 0,
        availability: donor?.availability !== undefined ? donor.availability : true,
        verified: donor?.verified !== undefined ? donor.verified : true,
        points: (donor?.total_donations || 0) * 50,
        badge: (donor?.total_donations || 0) >= 5 ? 'Gold Savior' : 'Active Donor'
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { user_id, availability, weight, city, latitude, longitude } = req.body;
    if (user_id) {
      if (availability !== undefined) await Donor.updateOne({ user_id }, { availability: Boolean(availability) });
      if (city) await User.updateOne({ user_id }, { city });
      if (latitude !== undefined && longitude !== undefined) {
        await User.updateOne({ user_id }, { latitude: Number(latitude), longitude: Number(longitude) });
        await Donor.updateOne({ user_id }, { latitude: Number(latitude), longitude: Number(longitude) });
      }
    }
    return res.json({ success: true, message: 'Profile updated' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getNearbyRequests = async (req, res) => {
  try {
    const userId = req.query.user_id;
    const donor = await Donor.findOne({ user_id: userId });
    const donorBloodGroup = donor?.blood_group;
    if (!donorBloodGroup) {
      return res.json({ success: true, requests: [] });
    }

    const requestsList = await EmergencyRequest.find({ status: { $ne: 'Completed' } });

    const rankedRequests = requestsList
      .filter(r => {
        if (!r.blood_group) return false;
        return isBloodCompatible(donorBloodGroup, r.blood_group);
      })
      .map(r => {
        const scoring = calculateAIDonorScore({
          donor,
          requestLat: r.latitude || 13.0827,
          requestLng: r.longitude || 80.2707,
          patientBloodGroup: r.blood_group
        });

        return {
          request_id: r.request_id || r._id,
          hospital_name: r.hospital_name || 'Emergency Hospital',
          patient_name: r.patient_name,
          blood_group: r.blood_group,
          units: r.units,
          priority: r.priority,
          status: r.status,
          city: r.city,
          ai_score: scoring.ai_score,
          distance_km: scoring.distance,
          eta_minutes: calculateETA(scoring.distance, r.priority)
        };
      }).sort((a, b) => b.ai_score - a.ai_score);

    return res.json({ success: true, requests: rankedRequests });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

exports.acceptRequest = async (req, res) => {
  try {
    const { request_id, user_id } = req.body;
    const code = generateCode();
    await EmergencyRequest.updateOne(
      { request_id },
      { status: 'Donor Accepted', verification_code: code, accepted_donor_id: user_id || 'dnr_unknown' }
    );
    return res.json({
      success: true,
      message: 'Emergency request accepted. Navigation started.',
      verification_code: code,
      eta_minutes: 14
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.rejectRequest = (req, res) => {
  return res.json({ success: true, message: 'Request declined.' });
};

exports.getDonationHistory = async (req, res) => {
  try {
    const userId = req.query.user_id;
    const userDonations = userId ? await Donation.find({ donor_id: userId }) : [];
    return res.json({ success: true, total_donations: userDonations.length, donations: userDonations });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getRewards = async (req, res) => {
  try {
    const userId = req.query.user_id;
    const donorList = await Donor.find({});

    const leaderboard = donorList.map((d, idx) => ({
      donor_id: d.donor_id || `dnr_${idx}`,
      name: d.name || 'Anonymous Donor',
      blood_group: d.blood_group || 'O+',
      total_donations: d.total_donations || 0,
      points: (d.total_donations || 0) * 50,
      badge: (d.total_donations || 0) >= 5 ? 'Gold Savior' : 'Active Donor'
    }));

    const currentDonor = donorList.find(d => d.user_id === userId);
    const donorPoints = currentDonor?.total_donations || 0;

    return res.json({
      success: true,
      userReward: {
        points: donorPoints * 50,
        badge: donorPoints >= 5 ? 'Life Saver Gold' : 'Bronze Donor',
        level: 'Gold Savior'
      },
      leaderboard
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const userId = req.query.user_id;
    const userNotifs = await Notification.find({ $or: [{ user_id: userId }, { user_id: 'broadcast_all' }] }).sort({ sent_time: -1 });
    return res.json({ success: true, notifications: userNotifs });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
