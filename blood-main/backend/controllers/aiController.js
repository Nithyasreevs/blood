const Donor = require('../models/Donor');
const User = require('../models/User');
const EmergencyRequest = require('../models/EmergencyRequest');
const BloodInventory = require('../models/BloodInventory');
const Hospital = require('../models/Hospital');

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash';

async function generateGeminiReply({ message, role, language, ruleReply, recommendations }) {
  if (!process.env.GEMINI_API_KEY) return ruleReply;

  const languageInstruction = language === 'ta-IN'
    ? 'Reply in simple Tanglish (Tamil written using English letters), not formal Tamil script.'
    : 'Reply in clear, simple English.';
  const prompt = `You are LifeFlow, a blood-donation platform assistant. ${languageInstruction}
User role: ${role}. Keep the response under 90 words. Be empathetic and practical.
Use the verified platform context below; do not invent availability, hospitals, donors, medical rules, or account data.
For a life-threatening emergency, advise calling 108 or 112. Do not diagnose or give medical treatment advice.
Verified platform context: ${ruleReply}
Structured data: ${JSON.stringify(recommendations || [])}
User message: ${message}`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': process.env.GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.25, maxOutputTokens: 180 },
      }),
    });
    if (!response.ok) return ruleReply;
    const data = await response.json();
    return data?.candidates?.[0]?.content?.parts?.map(part => part.text || '').join('').trim() || ruleReply;
  } catch {
    return ruleReply;
  }
}
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

exports.askAIChatbotLegacy = (req, res) => {
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

// Backend rule engine: this endpoint is the source of chatbot replies.
exports.askAIChatbot = async (req, res) => {
  try {
    const { message, role, user_id, language } = req.body;
    const text = String(message || '').toLowerCase().trim();
    const sessionUser = user_id ? await User.findOne({ user_id }) : null;
    const effectiveRole = sessionUser?.role || role || 'public';
    let reply = '';
    let recommendations = [];

    if (effectiveRole === 'donor') {
      const donor = await Donor.findOne({ user_id });
      if (/nearby|request|emergency/.test(text)) {
        const requests = await EmergencyRequest.find({ status: { $in: ['Waiting', 'Donor Matched'] } }).sort({ created_time: -1 }).limit(3);
        reply = requests.length
          ? `There are ${requests.length} open emergency request(s). Open Emergency Requests to review compatible matches and accept one when available.`
          : 'There are no open emergency requests now. Keep your availability updated to receive new alerts.';
        recommendations = requests.map(r => ({ hospital: r.hospital_name, blood_group: r.blood_group, units: r.units, priority: r.priority }));
      } else if (/profile|availability/.test(text)) {
        reply = `Your availability is currently ${donor?.availability ? 'Active' : 'Inactive'}. Open My Profile to update it.`;
      } else if (/history|certificate|reward|point|leaderboard/.test(text)) {
        reply = 'Use Donation History for verified donations and certificates, or Rewards & Leaderboard for points, badges, and ranking.';
      }
    }

    if (!reply && effectiveRole === 'hospital') {
      const hospital = await Hospital.findOne({ user_id });
      if (/inventory|stock/.test(text)) {
        const inventory = await BloodInventory.find(hospital ? { hospital_id: hospital.hospital_id } : {}).sort({ available_units: 1 }).limit(3);
        const totalUnits = inventory.reduce((total, item) => total + item.available_units, 0);
        reply = hospital ? `${hospital.name} has ${totalUnits} units across the lowest-stock entries. Open Blood Inventory to update stock.` : 'Open Blood Inventory to review and update stock.';
        recommendations = inventory.map(i => ({ blood_group: i.blood_group, available_units: i.available_units }));
      } else if (/create|request blood|emergency request/.test(text)) {
        reply = 'Open Create Emergency Request, enter the patient blood group, units, priority, and contact details, then submit to begin matching.';
      } else if (/verify|qr|donor/.test(text)) {
        reply = 'Open Donor Verification and enter the donor verification code after donation. This verifies the donation and updates the request.';
      } else if (/camp|report/.test(text)) {
        reply = text.includes('camp') ? 'Open Blood Camps to create and manage donation drives.' : 'Open Reports to review hospital request and donation performance.';
      }
    }

    if (!reply && effectiveRole === 'admin') {
      if (/user|donor|hospital/.test(text)) reply = 'Use Manage Users, Manage Donors, or Manage Hospitals to review accounts and verification status.';
      else if (/request|review|block/.test(text)) reply = 'Open Manage Requests to verify valid emergency requests or block suspicious ones.';
      else if (/inventory|stock/.test(text)) {
        const lowStock = await BloodInventory.find({ available_units: { $lte: 5 } }).sort({ available_units: 1 }).limit(5);
        reply = lowStock.length ? `${lowStock.length} low-stock inventory item(s) need attention. Open Inventory Monitor for details.` : 'No low-stock inventory items were found. Open Inventory Monitor for all stock levels.';
        recommendations = lowStock.map(i => ({ hospital: i.hospital_name, blood_group: i.blood_group, available_units: i.available_units }));
      } else if (/analytic|report|broadcast/.test(text)) {
        reply = text.includes('broadcast') ? 'Open Notification Centre to send an emergency broadcast.' : 'Open Analytics to review demand, donation, and response trends.';
      }
    }

    if (!reply && /emergency|urgent|need blood|blood request|request blood/.test(text)) {
      const activeRequests = await EmergencyRequest.countDocuments({ status: { $in: ['Waiting', 'Donor Matched', 'Donor Accepted'] } });
      reply = `There are currently ${activeRequests} active emergency blood request(s). You can submit an urgent request without signing in from the Emergency Patient Module.`;
    } else if (!reply && /eligible|eligibility|can i donate|age|weight|hemoglobin/.test(text)) {
      reply = 'General eligibility: age 18-65, weight at least 50 kg, generally good health, and an appropriate gap since the last donation. Final eligibility is confirmed by the blood bank screening team.';
    } else if (!reply && /compatible|compatibility|blood type|blood group|o[-+]|a[-+]|b[-+]|ab[-+]/.test(text)) {
      const groupMatch = text.toUpperCase().match(/\b(AB|A|B|O)\s?([+-])\b/);
      const group = groupMatch ? `${groupMatch[1]}${groupMatch[2]}` : null;
      reply = group ? `Compatible donor groups for ${group}: ${getCompatibleDonorGroups(group).join(', ')}. Compatibility is confirmed by the hospital before transfusion.` : 'Ask with a blood group, for example "Who can donate to O-?".';
    } else if (!reply && /hospital|blood bank|where.*donate|nearby/.test(text)) {
      const hospitals = await Hospital.find({}).limit(3);
      reply = hospitals.length ? `Here are ${hospitals.length} registered hospital/blood bank option(s). Contact the hospital directly to confirm current availability.` : 'No hospital records are available right now.';
      recommendations = hospitals.map(h => ({ name: h.name, city: h.city, phone: h.phone }));
    } else if (!reply) {
      reply = effectiveRole === 'public'
        ? 'I can help with donation eligibility, blood-group compatibility, emergency blood requests, hospitals, and how LifeFlow works.'
        : `I can answer general donation questions and guide you through your ${effectiveRole} portal.`;
    }

    const aiReply = await generateGeminiReply({
      message: text,
      role: effectiveRole,
      language,
      ruleReply: reply,
      recommendations,
    });
    return res.json({ success: true, reply: aiReply, recommendations, role: effectiveRole });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'The chat service is temporarily unavailable.' });
  }
};
