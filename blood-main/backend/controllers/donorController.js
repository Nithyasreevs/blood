const User = require('../models/User');
const Donor = require('../models/Donor');
const EmergencyRequest = require('../models/EmergencyRequest');
const Donation = require('../models/Donation');
const Notification = require('../models/Notification');
const { calculateAIDonorScore, calculateETA, calculateDistance, isBloodCompatible } = require('../utils/aiEngine');

const hasValidCoordinates = (latitude, longitude) =>
  latitude !== null && latitude !== undefined && latitude !== '' &&
  longitude !== null && longitude !== undefined && longitude !== '' &&
  Number.isFinite(Number(latitude)) && Number.isFinite(Number(longitude)) &&
  Number(latitude) >= -90 && Number(latitude) <= 90 &&
  Number(longitude) >= -180 && Number(longitude) <= 180;

exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.user_id;
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
        latitude: user?.latitude ?? donor?.latitude ?? null,
        longitude: user?.longitude ?? donor?.longitude ?? null,
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
    const user_id = req.user.user_id;
    const { availability, weight, city, latitude, longitude, name, phone, email, blood_group } = req.body;
    if (user_id) {
      if (availability !== undefined) await Donor.updateOne({ user_id }, { availability: Boolean(availability) });
      const userUpdates = {};
      if (city) userUpdates.city = city;
      if (name) userUpdates.name = name;
      if (phone) userUpdates.phone = phone;
      if (email) userUpdates.email = String(email).toLowerCase();
      if (Object.keys(userUpdates).length) await User.updateOne({ user_id }, userUpdates);
      if (weight !== undefined) await Donor.updateOne({ user_id }, { weight: Number(weight) });
      if (blood_group) await Donor.updateOne({ user_id }, { blood_group });
      if (latitude !== undefined && longitude !== undefined) {
        if (latitude === null || latitude === '' || longitude === null || longitude === '' || !Number.isFinite(Number(latitude)) || !Number.isFinite(Number(longitude)) || Number(latitude) < -90 || Number(latitude) > 90 || Number(longitude) < -180 || Number(longitude) > 180) {
          return res.status(400).json({ success: false, message: 'Invalid GPS coordinates.' });
        }
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
    const userId = req.user.user_id;
    const donor = await Donor.findOne({ user_id: userId });
    const donorBloodGroup = donor?.blood_group;
    if (!donorBloodGroup || !donor.availability || !hasValidCoordinates(donor.latitude, donor.longitude)) {
      return res.json({ success: true, requests: [] });
    }

    // A broadcast is visible only while it is waiting. Once accepted, it is
    // private to the accepting donor so another donor cannot take it over.
    const requestsList = await EmergencyRequest.find({
      $or: [
        { status: 'Waiting' },
        { status: 'Needs Verification' },
        { status: 'Donor Accepted', accepted_donor_id: userId },
        { status: 'Donor Arriving', accepted_donor_id: userId }
      ]
    });

    const rankedRequests = requestsList
      .filter(r => {
        if (!r.blood_group) return false;
        return isBloodCompatible(donorBloodGroup, r.blood_group);
      })
      .map(r => {
        const scoring = calculateAIDonorScore({
          donor,
          requestLat: r.latitude,
          requestLng: r.longitude,
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
          eta_minutes: calculateETA(scoring.distance, r.priority),
          verification_code: r.accepted_donor_id === userId && r.status !== 'Completed' ? r.verification_code : undefined
        };
      }).filter(r => r.distance_km !== null && r.distance_km <= 50)
        .sort((a, b) => a.distance_km - b.distance_km || b.ai_score - a.ai_score);

    return res.json({ success: true, requests: rankedRequests });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

exports.acceptRequest = async (req, res) => {
  try {
    const { request_id } = req.body;
    const user_id = req.user.user_id;
    if (!request_id || !user_id) {
      return res.status(400).json({ success: false, message: 'Request ID and donor ID are required.' });
    }
    const donor = await Donor.findOne({ user_id });
    if (!donor || !donor.availability || !hasValidCoordinates(donor.latitude, donor.longitude)) {
      return res.status(400).json({ success: false, message: 'Update and save your current GPS location before accepting a request.' });
    }
    const request = await EmergencyRequest.findOne({ request_id, status: { $in: ['Waiting', 'Needs Verification'] } });
    if (!request) {
      return res.status(409).json({ success: false, message: 'This request has already been accepted or is no longer available.' });
    }
    if (!isBloodCompatible(donor.blood_group, request.blood_group)) {
      return res.status(400).json({ success: false, message: 'This blood group is not compatible with the request.' });
    }
    const distanceKm = calculateDistance(donor.latitude, donor.longitude, request.latitude, request.longitude);
    if (distanceKm === null || distanceKm > 50) {
      return res.status(400).json({ success: false, message: 'This request is outside the 50 km emergency matching range.' });
    }
    let code;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const candidate = generateCode();
      const existingCode = await EmergencyRequest.exists({ verification_code: candidate, status: { $ne: 'Completed' } });
      if (!existingCode) {
        code = candidate;
        break;
      }
    }
    if (!code) return res.status(503).json({ success: false, message: 'Unable to create a secure verification code. Please try again.' });
    const update = await EmergencyRequest.updateOne(
      { request_id, status: { $in: ['Waiting', 'Needs Verification'] } },
      { status: 'Donor Accepted', verification_code: code, accepted_donor_id: user_id, accepted_time: new Date() }
    );
    if (!update.modifiedCount) {
      return res.status(409).json({ success: false, message: 'This request has already been accepted or is no longer available.' });
    }
    return res.json({
      success: true,
      message: 'Emergency request accepted. Navigation started.',
      verification_code: code,
      distance_km: distanceKm,
      eta_minutes: calculateETA(distanceKm, request.priority)
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
    const userId = req.user.user_id;
    const userDonations = userId ? await Donation.find({ donor_id: userId }) : [];
    return res.json({ success: true, total_donations: userDonations.length, donations: userDonations });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getRewards = async (req, res) => {
  try {
    const userId = req.user.user_id;
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
    const userId = req.user.user_id;
    const userNotifs = await Notification.find({ $or: [{ user_id: userId }, { user_id: 'broadcast_all' }] }).sort({ sent_time: -1 });
    return res.json({ success: true, notifications: userNotifs });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
