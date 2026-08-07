const User = require('../models/User');
const EmergencyRequest = require('../models/EmergencyRequest');
const BloodInventory = require('../models/BloodInventory');
const BloodCamp = require('../models/BloodCamp');
const Donation = require('../models/Donation');
const Donor = require('../models/Donor');

exports.getDashboard = async (req, res) => {
  try {
    const activeReqs = await EmergencyRequest.find({ status: { $nin: ['Completed', 'Cancelled'] } });
    const activeReqsCount = activeReqs.length;
    const criticalAlertsCount = activeReqs.filter(r => r.priority === 'Critical').length;

    const donations = await Donation.find({});
    const todayDonationsCount = donations.length;

    const inventories = await BloodInventory.find({});
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

exports.getInventory = async (req, res) => {
  try {
    const inventory = await BloodInventory.find({});
    return res.json({ success: true, inventory });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateInventory = async (req, res) => {
  try {
    const { inventory_id, blood_group, available_units, hospital_id, hospital_name } = req.body;
    const units = Math.max(Number(available_units) || 0, 0);
    const hospId = hospital_id || 'hosp_1';
    const hospName = hospital_name || 'Hospital Desk';

    await BloodInventory.updateOne(
      { blood_group },
      {
        $set: { available_units: units, hospital_id: hospId, hospital_name: hospName, updated_time: new Date() },
        $setOnInsert: { inventory_id: `inv_${blood_group}_${Date.now()}` }
      },
      { upsert: true }
    );

    const updatedInventory = await BloodInventory.find({});
    return res.json({ success: true, message: `Updated ${blood_group} stock to ${units} units in MongoDB`, inventory: updatedInventory });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.createRequest = async (req, res) => {
  try {
    const { patient_name, blood_group, units, priority, contact_number, hospital_id, hospital_name, city } = req.body;

    const newReq = {
      request_id: `req_${Date.now()}`,
      hospital_id: hospital_id || 'hosp_1',
      hospital_name: hospital_name || 'Hospital Speciality Desk',
      patient_name: patient_name || 'Emergency Patient',
      blood_group: blood_group || 'O+',
      units: Number(units) || 1,
      priority: priority || 'High',
      contact_number: contact_number || '044-28290200',
      city: city || 'Chennai',
      latitude: 13.0624,
      longitude: 80.2520,
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
    const { qr_code, hospital_id, hospital_name } = req.body;
    const code = (qr_code || '').trim();

    if (!code) {
      return res.json({ success: false, message: 'Please enter a verification code.' });
    }

    const request = await EmergencyRequest.findOne({ verification_code: code });

    if (!request) {
      return res.json({ success: false, message: 'Invalid verification code. No matching request found.' });
    }

    if (request.status === 'Completed') {
      return res.json({ success: false, message: 'This donation has already been verified and completed.' });
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
      hospital_id: hospital_id || 'hosp_unknown',
      hospital_name: hospital_name || 'Hospital Desk',
      verified: true,
      date: new Date(),
      units: request.units || 1,
      blood_group: request.blood_group,
      qr_code: code
    };

    await Donation.create(newDonation);
    await EmergencyRequest.updateOne({ request_id: request.request_id }, { status: 'Completed' });
    if (request.accepted_donor_id) {
      await Donor.updateOne({ user_id: request.accepted_donor_id }, { $inc: { total_donations: 1 }, last_donation: new Date() });
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
    const camps = await BloodCamp.find({});
    return res.json({ success: true, camps, registrations: [] });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.createCamp = async (req, res) => {
  try {
    const { hospital, date, venue, organizer, city } = req.body;
    const newCamp = {
      camp_id: `camp_${Date.now()}`,
      hospital: hospital || 'Hospital Speciality Desk',
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
    const totalDonations = await Donation.countDocuments();
    return res.json({
      success: true,
      reports: {
        total_verified_donations: totalDonations,
        emergency_fulfillment_rate: 98,
        avg_donor_response_mins: 14.2,
        total_donations_this_month: totalDonations,
        blood_units_collected: totalDonations * 2,
        lives_impacted: totalDonations * 3,
        monthly_trend: [
          { month: 'Jan', donations: 32 }, { month: 'Feb', donations: 28 }, { month: 'Mar', donations: 45 },
          { month: 'Apr', donations: 50 }, { month: 'May', donations: 42 }, { month: 'Jun', donations: 55 },
          { month: 'Jul', donations: totalDonations }
        ],
        usage_by_group: [
          { group: 'O+', units: 25 }, { group: 'A+', units: 18 }, { group: 'B+', units: 15 },
          { group: 'AB+', units: 8 }, { group: 'O-', units: 6 }, { group: 'A-', units: 4 }
        ]
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
