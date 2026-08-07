const User = require('../models/User');
const EmergencyRequest = require('../models/EmergencyRequest');
const Feedback = require('../models/Feedback');
const { detectFakeRequest, calculateETA, calculateDistance } = require('../utils/aiEngine');
const crypto = require('crypto');

const validCoordinates = (latitude, longitude) =>
  latitude !== null && latitude !== undefined && latitude !== '' &&
  longitude !== null && longitude !== undefined && longitude !== '' &&
  Number.isFinite(Number(latitude)) && Number.isFinite(Number(longitude)) &&
  Number(latitude) >= -90 && Number(latitude) <= 90 &&
  Number(longitude) >= -180 && Number(longitude) <= 180;

exports.createEmergencyRequest = async (req, res) => {
  try {
    const { patient_name, blood_group, units, hospital_name, contact_number, priority, city, latitude, longitude } = req.body;

    if (!patient_name || !blood_group || !contact_number) {
      return res.status(400).json({ success: false, message: 'Please provide Patient Name, Blood Group, and Contact Number.' });
    }
    if (!validCoordinates(latitude, longitude)) {
      return res.status(400).json({ success: false, message: 'A valid current location is required to find nearby donors.' });
    }

    const riskAnalysis = detectFakeRequest({
      patient_name, contact_number, units,
      hospital_name: hospital_name || 'Hospital Desk',
      city: city || 'Chennai'
    });

    const requestId = `req_${Date.now()}`;
    const newRequest = {
      request_id: requestId,
      hospital_id: 'hosp_1',
      hospital_name: hospital_name || 'Hospital Desk',
      patient_name,
      blood_group,
      units: Number(units) || 1,
      priority: priority || 'Critical',
      contact_number,
      city: city || 'Chennai',
      latitude: Number(latitude),
      longitude: Number(longitude),
      status: riskAnalysis.needsVerification ? 'Needs Verification' : 'Waiting',
      created_time: new Date(),
      expiry_time: new Date(Date.now() + 6 * 60 * 60 * 1000),
      ai_risk_score: riskAnalysis.riskScore,
      radius_km: 5,
      requester_access_token: crypto.randomBytes(32).toString('hex')
    };

    await EmergencyRequest.create(newRequest);

    return res.status(201).json({
      success: true,
      message: riskAnalysis.needsVerification
        ? 'Request submitted. Flagged for AI Risk Audit.'
        : 'Emergency Blood Request Broadcasted to nearby compatible donors!',
      request: newRequest,
      request_id: requestId,
      requester_access_token: newRequest.requester_access_token,
      ai_risk_analysis: riskAnalysis
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getRequestStatus = async (req, res) => {
  try {
    const requestId = req.params.id || req.query.request_id;
    if (!requestId) return res.status(400).json({ success: false, message: 'Request ID required' });

    const accessToken = req.query.requester_access_token;
    const request = await EmergencyRequest.findOne({ request_id: requestId }).select('+requester_access_token');
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
    if (accessToken !== request.requester_access_token) return res.status(403).json({ success: false, message: 'This request is private.' });

    let donorInfo = { name: 'Finding Donor...' };
    if (request.accepted_donor_id) {
      const donorUser = await User.findOne({ user_id: request.accepted_donor_id });
      if (donorUser) {
        donorInfo = { name: donorUser.name, phone: donorUser.phone, blood_group: donorUser.blood_group || 'Unknown' };
      }
    }

    const donor = request.accepted_donor_id ? await User.findOne({ user_id: request.accepted_donor_id }) : null;
    const distanceKm = donor ? calculateDistance(donor.latitude, donor.longitude, request.latitude, request.longitude) : null;
    const eta_minutes = calculateETA(distanceKm, request.priority);
    const ai_score = Number.isFinite(request.ai_risk_score) ? Math.max(100 - request.ai_risk_score, 10) : 92;

    return res.json({
      success: true,
      request: {
        request_id: request.request_id,
        patient_name: request.patient_name,
        blood_group: request.blood_group,
        units: request.units,
        hospital_name: request.hospital_name || request.hospital,
        priority: request.priority,
        status: request.status,
        currentStep: request.status === 'Completed' ? 5 : request.status === 'Donor Accepted' ? 3 : 2,
        eta_minutes,
        distance_km: distanceKm,
        ai_score,
        matched_donor: donorInfo
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getLiveDonorTracking = async (req, res) => {
  try {
    const requestId = req.params.id;
    if (!requestId) return res.status(400).json({ success: false, message: 'Request ID required' });

    const accessToken = req.query.requester_access_token;
    const request = await EmergencyRequest.findOne({ request_id: requestId }).select('+requester_access_token');
    if (!request) return res.status(404).json({ success: false, message: 'Tracking data not found' });
    const donorAccess = req.user?.role === 'donor' && req.user.user_id === request.accepted_donor_id;
    if (!donorAccess && accessToken !== request.requester_access_token) return res.status(403).json({ success: false, message: 'This tracking link is private.' });

    let donorCity = '';
    let donorName = '';
    let donorPhone = '';
    let donorBloodGroup = '';
    let donorLat = null;
    let donorLng = null;
    if (request.accepted_donor_id) {
      const donorUser = await User.findOne({ user_id: request.accepted_donor_id });
      if (donorUser) {
        donorCity = donorUser.city || '';
        donorName = donorUser.name || '';
        donorPhone = donorUser.phone || '';
        const donor = await require('../models/Donor').findOne({ user_id: donorUser.user_id });
        donorBloodGroup = donor?.blood_group || '';
        donorLat = donorUser.latitude;
        donorLng = donorUser.longitude;
      }
    }

    const reqLat = request.latitude;
    const reqLng = request.longitude;
    const distanceKm = calculateDistance(donorLat, donorLng, reqLat, reqLng);
    const etaMinutes = calculateETA(distanceKm, request.priority);

    return res.json({
      success: true,
      tracking: {
        request_id: request.request_id,
        patient_name: request.patient_name,
        hospital_name: request.hospital_name,
        donor_location: donorCity,
        accepted_donor_name: donorName,
        matched_donor: donorName ? { name: donorName, phone: donorPhone, blood_group: donorBloodGroup } : null,
        donor_lat: donorLat,
        donor_lng: donorLng,
        hospital_lat: reqLat,
        hospital_lng: reqLng,
        eta_minutes: etaMinutes,
        distance_km: distanceKm,
        verification_code: donorAccess && request.status !== 'Completed'
          ? request.verification_code
          : undefined,
        status: request.status
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getRequestHistory = async (req, res) => {
  try {
    const accessToken = req.query.requester_access_token;
    if (!accessToken) return res.status(403).json({ success: false, message: 'Request history is private.' });
    const requestsList = await EmergencyRequest.find({ requester_access_token: accessToken }).sort({ created_time: -1 });
    return res.json({ success: true, history: requestsList });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.submitFeedback = async (req, res) => {
  try {
    const { request_id, rating, comments, requester_access_token } = req.body;
    const request = await EmergencyRequest.findOne({ request_id }).select('+requester_access_token');
    if (!request || request.requester_access_token !== requester_access_token) return res.status(403).json({ success: false, message: 'You cannot rate this request.' });
    const newFeedback = {
      feedback_id: `fb_${Date.now()}`,
      request_id: request_id || `req_${Date.now()}`,
      rating: Number(rating) || 5,
      comments: comments || 'Service completed',
      created_at: new Date()
    };
    await Feedback.create(newFeedback);
    return res.json({ success: true, message: 'Thank you for your feedback!', feedback: newFeedback });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
