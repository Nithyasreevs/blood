const User = require('../models/User');
const EmergencyRequest = require('../models/EmergencyRequest');
const BloodInventory = require('../models/BloodInventory');
const BloodCamp = require('../models/BloodCamp');
const Donation = require('../models/Donation');
const Donor = require('../models/Donor');
const Hospital = require('../models/Hospital');

exports.getDashboard = async (req, res) => {
  try {
    const hospital = await Hospital.findOne({ user_id: req.user.user_id });
    if (!hospital) return res.status(404).json({ success: false, message: 'Hospital profile not found.' });
    const activeReqs = await EmergencyRequest.find({ hospital_id: hospital.hospital_id, status: { $nin: ['Completed', 'Cancelled'] } });
    const activeReqsCount = activeReqs.length;
    const criticalAlertsCount = activeReqs.filter(r => r.priority === 'Critical').length;

    const donations = await Donation.find({ hospital_id: hospital.hospital_id });
    const todayDonationsCount = donations.length;

    const inventories = await BloodInventory.find({ hospital_id: hospital.hospital_id });
    const totalStockUnits = inventories.reduce((acc, curr) => acc + (curr.available_units || 0), 0);
    const inventoryShortagesCount = inventories.filter(i => (i.available_units || 0) < 5).length;

    return res.json({
      success: true,
      dashboard: {
        active_requests: activeReqsCount,
        todays_donations: todayDonationsCount,
        total_blood_stock_units: totalStockUnits,
        critical_alerts: criticalAlertsCount,
        inventory_shortages: inventoryShortagesCount
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getRequests = async (req, res) => {
  try {
    const hospital = await Hospital.findOne({ user_id: req.user.user_id });
    if (!hospital) return res.status(404).json({ success: false, message: 'Hospital profile not found.' });
    const requests = await EmergencyRequest.find({ hospital_id: hospital.hospital_id }).sort({ created_time: -1 });
    return res.json({ success: true, requests });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getInventory = async (req, res) => {
  try {
    const hospital = await Hospital.findOne({ user_id: req.user.user_id });
    const inventory = await BloodInventory.find({ hospital_id: hospital?.hospital_id });
    return res.json({ success: true, inventory });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateInventory = async (req, res) => {
  try {
    const { blood_group, available_units } = req.body;
    const hospital = await Hospital.findOne({ user_id: req.user.user_id });
    if (!hospital) return res.status(404).json({ success: false, message: 'Hospital profile not found.' });
    const units = Math.max(Number(available_units) || 0, 0);
    const hospId = hospital.hospital_id;
    const hospName = hospital.name;

    await BloodInventory.updateOne(
      { blood_group, hospital_id: hospId },
      {
        $set: { available_units: units, hospital_id: hospId, hospital_name: hospName, updated_time: new Date() },
        $setOnInsert: { inventory_id: `inv_${blood_group}_${Date.now()}` }
      },
      { upsert: true }
    );

    const updatedInventory = await BloodInventory.find({ hospital_id: hospId });
    return res.json({ success: true, message: `Updated ${blood_group} stock to ${units} units in MongoDB`, inventory: updatedInventory });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.createRequest = async (req, res) => {
  try {
    const { patient_name, blood_group, units, priority, contact_number } = req.body;
    const hospital = await Hospital.findOne({ user_id: req.user.user_id });
    if (!hospital) return res.status(404).json({ success: false, message: 'Hospital profile not found.' });
    const { hospital_id, hospital_name, city, latitude, longitude } = hospital;
    const validCoordinates = latitude !== null && latitude !== undefined && latitude !== '' &&
      longitude !== null && longitude !== undefined && longitude !== '' &&
      Number.isFinite(Number(latitude)) && Number.isFinite(Number(longitude)) &&
      Number(latitude) >= -90 && Number(latitude) <= 90 && Number(longitude) >= -180 && Number(longitude) <= 180;
    if (!validCoordinates) {
      return res.status(400).json({ success: false, message: 'A valid hospital GPS location is required.' });
    }

    const newReq = {
      request_id: `req_${Date.now()}`,
      hospital_id,
      hospital_name,
      patient_name: patient_name || 'Emergency Patient',
      blood_group: blood_group || 'O+',
      units: Number(units) || 1,
      priority: priority || 'High',
      contact_number: contact_number || '044-28290200',
      city,
      latitude: Number(latitude),
      longitude: Number(longitude),
      status: 'Waiting',
      created_time: new Date(),
      expiry_time: new Date(Date.now() + 4 * 60 * 60 * 1000),
      ai_risk_score: 5,
      radius_km: 5
    };

    await EmergencyRequest.create(newReq);
    return res.status(201).json({ success: true, message: `Emergency blood request for ${newReq.patient_name} created!`, request: newReq });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.closeRequest = async (req, res) => {
  try {
    const { request_id } = req.body;
    await EmergencyRequest.updateOne({ request_id }, { status: 'Completed' });
    return res.json({ success: true, message: 'Request marked as Completed.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.verifyDonor = async (req, res) => {
  try {
    const { qr_code } = req.body;
    const hospital = await Hospital.findOne({ user_id: req.user.user_id });
    if (!hospital) return res.status(404).json({ success: false, message: 'Hospital profile not found.' });
    const code = (qr_code || '').trim();

    if (!code) {
      return res.json({ success: false, message: 'Please enter a verification code.' });
    }

    const request = await EmergencyRequest.findOneAndUpdate(
      { verification_code: code, hospital_id: hospital.hospital_id, status: 'Donor Accepted' },
      { status: 'Verifying' },
      { new: true }
    );

    if (!request) {
      return res.json({ success: false, message: 'Invalid verification code. No matching request found.' });
    }

    let donorName = 'Verified Donor';
    if (request.accepted_donor_id) {
      const donorUser = await User.findOne({ user_id: request.accepted_donor_id });
      if (donorUser) donorName = donorUser.name;
    }

    const newDonation = {
      donation_id: `don_${Date.now()}`,
      request_id: request.request_id,
      donor_id: request.accepted_donor_id || 'dnr_unknown',
      donor_name: donorName,
      hospital_id: hospital.hospital_id,
      hospital_name: hospital.name,
      verified: true,
      date: new Date(),
      units: request.units || 1,
      blood_group: request.blood_group,
      qr_code: code
    };

    await Donation.create(newDonation);
    await EmergencyRequest.updateOne({ request_id: request.request_id, status: 'Verifying' }, { status: 'Completed', verification_code: undefined });
    if (request.accepted_donor_id) {
      // Keep the account, but make the donor unavailable after a verified
      // donation. They can reactivate only when eligible again.
      await Donor.updateOne(
        { user_id: request.accepted_donor_id },
        { $inc: { total_donations: 1 }, $set: { last_donation: new Date(), availability: false, status: 'inactive' } }
      );
    }

    return res.json({
      success: true,
      message: `Donor verified! ${request.units || 1} units of ${request.blood_group} credited.`,
      donation: newDonation
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getCamps = async (req, res) => {
  try {
    const hospital = await Hospital.findOne({ user_id: req.user.user_id });
    const camps = await BloodCamp.find({ hospital_id: hospital?.hospital_id });
    return res.json({ success: true, camps, registrations: [] });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.createCamp = async (req, res) => {
  try {
    const { date, venue, organizer, city } = req.body;
    const hospital = await Hospital.findOne({ user_id: req.user.user_id });
    if (!hospital) return res.status(404).json({ success: false, message: 'Hospital profile not found.' });
    const newCamp = {
      camp_id: `camp_${Date.now()}`,
      hospital_id: hospital.hospital_id,
      hospital: hospital.name,
      date: date || '2026-08-15',
      venue: venue || 'City Hall Main Auditorium',
      organizer: organizer || 'LifeFlow Drive',
      city: city || 'Chennai',
      registered_count: 0
    };
    await BloodCamp.create(newCamp);
    return res.status(201).json({ success: true, message: `Blood donation drive created under ${newCamp.hospital}!`, camp: newCamp });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getReports = async (req, res) => {
  try {
    const hospital = await Hospital.findOne({ user_id: req.user.user_id });
    const totalDonations = await Donation.countDocuments({ hospital_id: hospital?.hospital_id });
    const requests = await EmergencyRequest.find({ hospital_id: hospital?.hospital_id });
    const completed = requests.filter(request => request.status === 'Completed').length;
    const accepted = requests.filter(request => request.accepted_time && request.created_time);
    const avgResponse = accepted.length
      ? Math.round(accepted.reduce((sum, request) => sum + (request.accepted_time - request.created_time) / 60000, 0) / accepted.length)
      : null;
    return res.json({
      success: true,
      reports: {
        total_verified_donations: totalDonations,
        emergency_fulfillment_rate: requests.length ? Math.round((completed / requests.length) * 100) : 0,
        avg_donor_response_mins: avgResponse,
        total_donations_this_month: totalDonations,
        blood_units_collected: totalDonations * 2,
        lives_impacted: totalDonations * 3,
        monthly_trend: [
          { month: 'Current', donations: totalDonations }
        ],
        usage_by_group: [
          ...Object.entries((await Donation.find({ hospital_id: hospital?.hospital_id })).reduce((groups, donation) => {
            groups[donation.blood_group || 'Unknown'] = (groups[donation.blood_group || 'Unknown'] || 0) + (donation.units || 0);
            return groups;
          }, {})).map(([group, units]) => ({ group, units }))
        ]
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
