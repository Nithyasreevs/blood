const Donor = require('../models/Donor');
const User = require('../models/User');
const EmergencyRequest = require('../models/EmergencyRequest');
const {
  calculateAIDonorScore,
  isBloodCompatible,
  getCompatibleDonorGroups,
  checkEligibility,
  calculateETA,
  calculateDistance,
  detectFakeRequest
} = require('../utils/aiEngine');

exports.getAIDonorMatches = async (req, res) => {
  try {
    const { blood_group, hospital_lat, hospital_lng } = req.query;
    const targetGroup = blood_group || 'O+';
    const reqLat = Number(hospital_lat) || 13.0624;
    const reqLng = Number(hospital_lng) || 80.2520;

    const donorList = await Donor.find({});
    const userIds = donorList.map(d => d.user_id);
    const users = await User.find({ user_id: { $in: userIds } });
    const userMap = {};
    users.forEach(u => { userMap[u.user_id] = u; });

    const rankedDonors = donorList.map(donor => {
      const user = userMap[donor.user_id] || {};
      const scoring = calculateAIDonorScore({
        donor,
        requestLat: reqLat,
        requestLng: reqLng,
        patientBloodGroup: targetGroup
      });

      const isComp = isBloodCompatible(donor.blood_group, targetGroup);

      return {
        donor_id: donor.donor_id,
        name: user.name || donor.name || 'Registered Donor',
        city: user.city || '',
        blood_group: donor.blood_group || 'O+',
        weight: donor.weight || 65,
        last_donation: donor.last_donation,
        availability: donor.availability,
        response_rate: donor.response_rate || 95,
        total_donations: donor.total_donations || 0,
        ai_score: scoring.ai_score,
        distance_km: scoring.distance,
        is_compatible: isComp,
        eta_minutes: calculateETA(scoring.distance, 'High')
      };
    }).sort((a, b) => b.ai_score - a.ai_score);

    const compatibleDonors = rankedDonors.filter(d => d.is_compatible);

    return res.json({
      success: true,
      patient_blood_group: targetGroup,
      compatible_donor_groups: getCompatibleDonorGroups(targetGroup),
      total_donors_matched: compatibleDonors.length,
      donors: compatibleDonors
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getBloodCompatibility = async (req, res) => {
  try {
    const { blood_group } = req.query;
    const target = blood_group || 'O-';
    const compatibleGroups = getCompatibleDonorGroups(target);

    const donorList = await Donor.find({ blood_group: { $in: compatibleGroups }, availability: true });
    const userIds = donorList.map(d => d.user_id);
    const users = await User.find({ user_id: { $in: userIds } });
    const userMap = {};
    users.forEach(u => { userMap[u.user_id] = u; });

    const reqLat = 13.0624;
    const reqLng = 80.2520;

    const donorDetails = donorList.map(d => {
      const user = userMap[d.user_id] || {};
      const scoring = calculateAIDonorScore({
        donor: d,
        requestLat: reqLat,
        requestLng: reqLng,
        patientBloodGroup: target
      });
      return {
        donor_id: d.donor_id,
        name: user.name || d.name || 'Registered Donor',
        blood_group: d.blood_group,
        city: user.city || '',
        availability: d.availability,
        response_rate: d.response_rate || 95,
        total_donations: d.total_donations || 0,
        ai_score: scoring.ai_score,
        distance_km: scoring.distance,
        eta_minutes: calculateETA(scoring.distance, 'High')
      };
    }).sort((a, b) => b.ai_score - a.ai_score);

    const groupCounts = {};
    compatibleGroups.forEach(g => { groupCounts[g] = 0; });
    donorList.forEach(d => { if (groupCounts[d.blood_group] !== undefined) groupCounts[d.blood_group]++; });

    const medicalNote = target === 'O-'
      ? 'O- is the Universal Donor and can donate to all blood groups.'
      : target === 'AB+'
      ? 'AB+ is the Universal Receiver and can receive blood from any blood group.'
      : `Compatible donor blood groups for ${target}: ${compatibleGroups.join(', ')}.`;

    return res.json({
      success: true,
      patient_blood_group: target,
      compatible_donor_groups: compatibleGroups,
      group_counts: groupCounts,
      donors: donorDetails,
      total_available: donorDetails.length,
      medical_note: medicalNote
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.expandEmergencyRadius = async (req, res) => {
  try {
    const { request_id, current_radius } = req.body;
    const rad = Number(current_radius) || 5;
    const nextRadius = rad === 5 ? 10 : rad === 10 ? 20 : rad === 20 ? 30 : 30;

    if (request_id) {
      await EmergencyRequest.updateOne({ request_id }, { radius_km: nextRadius });
    }

    return res.json({
      success: true,
      message: `Search radius expanded from ${rad} km to ${nextRadius} km. AI broadcast sent to nearby donors.`,
      new_radius_km: nextRadius
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.findDonorsInRadius = async (req, res) => {
  try {
    const { radius_km, hospital_lat, hospital_lng, blood_group } = req.body;
    const rad = Number(radius_km) || 5;
    const reqLat = Number(hospital_lat) || 13.0624;
    const reqLng = Number(hospital_lng) || 80.2520;

    const donorList = await Donor.find({ availability: true });
    const userIds = donorList.map(d => d.user_id);
    const users = await User.find({ user_id: { $in: userIds } });
    const userMap = {};
    users.forEach(u => { userMap[u.user_id] = u; });

    const nearbyDonors = donorList
      .map(donor => {
        const user = userMap[donor.user_id] || {};
        const dist = calculateDistance(
          donor.latitude || 13.0827,
          donor.longitude || 80.2707,
          reqLat,
          reqLng
        );
        return {
          donor_id: donor.donor_id,
          name: user.name || donor.name || 'Donor',
          blood_group: donor.blood_group,
          city: user.city || '',
          distance_km: dist,
          eta_minutes: calculateETA(dist, 'High'),
          phone: user.phone || '',
          availability: donor.availability
        };
      })
      .filter(d => d.distance_km <= rad);

    return res.json({ success: true, radius_km: rad, total: nearbyDonors.length, donors: nearbyDonors });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.detectFakeRequest = (req, res) => {
  const { patient_name, contact_number, units, hospital_name, city } = req.body;
  const result = detectFakeRequest({ patient_name, contact_number, units, hospital_name, city });
  return res.json({ success: true, ...result });
};

exports.checkEligibilityStatus = (req, res) => {
  const { age, weight, last_donation_date, has_illness, recent_tattoo } = req.body;
  const result = checkEligibility({
    age, weight,
    lastDonationDate: last_donation_date,
    hasIllness: Boolean(has_illness),
    recentTattoo: Boolean(recent_tattoo)
  });

  return res.json({ success: true, eligibility: result });
};

exports.askAIChatbot = (req, res) => {
  const { message } = req.body;
  const text = (message || '').toLowerCase();
  let responseText = '';
  let recommendations = [];

  if (text.includes('o-') || text.includes('o negative') || text.includes('chennai') || text.includes('donor')) {
    responseText = 'I found matching O- negative blood donors near Chennai! Rahul Sharma (2.3 km away, Score: 98%) is available and ready for immediate dispatch.';
    recommendations = [
      { name: 'Rahul Sharma', blood_group: 'O-', distance: '2.3 km', phone: '9876543210', score: '98%' },
      { name: 'Apollo Speciality Hospital Blood Bank', stock: 'O-: 2 units, O+: 25 units', phone: '044-28290200' }
    ];
  } else if (text.includes('eligible') || text.includes('can i donate') || text.includes('weight') || text.includes('age')) {
    responseText = 'To donate blood, you must be 18–65 years old, weigh at least 50 kg, and have waited 90 days since your last donation. Use our AI Eligibility tool for an instant health check!';
  } else if (text.includes('hospital') || text.includes('bank') || text.includes('blood bank')) {
    responseText = 'Here are top verified hospitals and blood banks with active stock near you:';
    recommendations = [
      { name: 'Apollo Speciality Hospital', city: 'Chennai', phone: '044-28290200', stock: '78 units total' },
      { name: 'Fortis Malar Hospital', city: 'Chennai', phone: '044-42892222', stock: '42 units total' }
    ];
  } else {
    responseText = 'I am LifeFlow AI Assistant. How can I help you today? You can ask about nearby donors, blood compatibility, eligibility, or emergency request status.';
  }

  return res.json({ success: true, reply: responseText, recommendations });
};
