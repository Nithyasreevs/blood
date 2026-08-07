const User = require('../models/User');
const Hospital = require('../models/Hospital');
const EmergencyRequest = require('../models/EmergencyRequest');
const Feedback = require('../models/Feedback');
const { detectFakeRequest, calculateETA } = require('../utils/aiEngine');

exports.createEmergencyRequest = async (req, res) => {
  try {
    const { patient_name, blood_group, units, hospital_name, contact_number, priority, city, latitude, longitude } = req.body;

    if (!patient_name || !blood_group || !contact_number) {
      return res.status(400).json({ success: false, message: 'Please provide Patient Name, Blood Group, and Contact Number.' });
    }

    const hospital = await Hospital.findOne({
      name: { $regex: `^${String(hospital_name || '').trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
      city: { $regex: `^${String(city || '').trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' }
    });
    if (!hospital) {
      return res.status(400).json({ success: false, message: 'Choose a registered hospital in the selected city so the hospital can verify the donor.' });
    }

    const riskAnalysis = detectFakeRequest({
      patient_name, contact_number, units,
      hospital_name: hospital_name || 'Hospital Desk',
      city: city || 'Chennai'
    });

    const requestId = `req_${Date.now()}`;
    const newRequest = {
      request_id: requestId,
      hospital_id: hospital.hospital_id,
      hospital_name: hospital.name,
      patient_name,
      blood_group,
      units: Number(units) || 1,
      priority: priority || 'Critical',
      contact_number,
      city: hospital.city,
      // Match donors to the actual destination hospital, not the requester's phone GPS.
      latitude: hospital.latitude,
      longitude: hospital.longitude,
      status: riskAnalysis.needsVerification ? 'Needs Verification' : 'Waiting',
      created_time: new Date(),
      expiry_time: new Date(Date.now() + 6 * 60 * 60 * 1000),
      ai_risk_score: riskAnalysis.riskScore,
      radius_km: 5
    };

    await EmergencyRequest.create(newRequest);

    return res.status(201).json({
      success: true,
      message: riskAnalysis.needsVerification
        ? 'Request submitted. Flagged for AI Risk Audit.'
        : 'Emergency Blood Request Broadcasted to nearby compatible donors!',
      request: newRequest,
      request_id: requestId,
      ai_risk_analysis: riskAnalysis
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getRegisteredHospitals = async (req, res) => {
  try {
    const city = String(req.query.city || '').trim();
    const filter = city ? { city: { $regex: `^${city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } } : {};
    const hospitals = await Hospital.find(filter).select('name city address');
    return res.json({ success: true, hospitals });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getRequestStatus = async (req, res) => {
  try {
    const requestId = req.params.id || req.query.request_id;
    if (!requestId) return res.status(400).json({ success: false, message: 'Request ID required' });

    const request = await EmergencyRequest.findOne({ request_id: requestId });
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    let donorInfo = { name: 'Finding Donor...' };
    if (request.accepted_donor_id) {
      const donorUser = await User.findOne({ user_id: request.accepted_donor_id });
      if (donorUser) {
        donorInfo = { name: donorUser.name, phone: donorUser.phone, blood_group: donorUser.blood_group || 'Unknown' };
      }
    }

    const eta_minutes = calculateETA(5, request.priority);
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

    const request = await EmergencyRequest.findOne({ request_id: requestId });
    if (!request) return res.status(404).json({ success: false, message: 'Tracking data not found' });

    let donorCity = '';
    let donorName = '';
    let donorLat = null;
    let donorLng = null;
    if (request.accepted_donor_id) {
      const donorUser = await User.findOne({ user_id: request.accepted_donor_id });
      if (donorUser) {
        donorCity = donorUser.city || '';
        donorName = donorUser.name || '';
        donorLat = donorUser.latitude;
        donorLng = donorUser.longitude;
      }
    }

    const reqLat = request.latitude;
    const reqLng = request.longitude;
    let distanceKm = 0;
    if (donorLat != null && donorLng != null && reqLat != null && reqLng != null) {
      const toRad = (deg) => (deg * Math.PI) / 180;
      const R = 6371;
      const dLat = toRad(reqLat - donorLat);
      const dLng = toRad(reqLng - donorLng);
      const a = Math.sin(dLat / 2) ** 2 +
                Math.cos(toRad(donorLat)) * Math.cos(toRad(reqLat)) *
                Math.sin(dLng / 2) ** 2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      distanceKm = Math.round(R * c * 10) / 10;
    }
    const avgSpeedKmph = 30;
    const etaMinutes = distanceKm > 0 ? Math.max(Math.round((distanceKm / avgSpeedKmph) * 60), 1) : 14;

    return res.json({
      success: true,
      tracking: {
        request_id: request.request_id,
        patient_name: request.patient_name,
        hospital_name: request.hospital_name,
        donor_location: donorCity,
        accepted_donor_name: donorName,
        donor_lat: donorLat,
        donor_lng: donorLng,
        hospital_lat: reqLat,
        hospital_lng: reqLng,
        eta_minutes: etaMinutes,
        distance_km: distanceKm,
        status: request.status
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getRequestHistory = async (req, res) => {
  try {
    const requestsList = await EmergencyRequest.find({}).sort({ created_time: -1 });
    return res.json({ success: true, history: requestsList });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.submitFeedback = async (req, res) => {
  try {
    const { request_id, rating, comments } = req.body;
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
