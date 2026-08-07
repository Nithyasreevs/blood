// AI Engine Utility for LifeFlow System

// Location helpers. Coordinates must be real decimal degrees; never replace a
// missing location with a city default, because that produces misleading matches.
function isValidCoordinate(latitude, longitude) {
  return latitude !== null && latitude !== undefined && latitude !== '' &&
    longitude !== null && longitude !== undefined && longitude !== '' &&
    Number.isFinite(Number(latitude)) && Number.isFinite(Number(longitude)) &&
    Number(latitude) >= -90 && Number(latitude) <= 90 &&
    Number(longitude) >= -180 && Number(longitude) <= 180;
}

// Haversine distance in kilometres (straight-line GPS distance).
function calculateDistance(lat1, lon1, lat2, lon2) {
  if (!isValidCoordinate(lat1, lon1) || !isValidCoordinate(lat2, lon2)) return null;
  lat1 = Number(lat1);
  lon1 = Number(lon1);
  lat2 = Number(lat2);
  lon2 = Number(lon2);
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return parseFloat(d.toFixed(2));
}

// Medical Blood Compatibility Chart
const COMPATIBILITY_MAP = {
  'O-': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
  'O+': ['O+', 'A+', 'B+', 'AB+'],
  'A-': ['A-', 'A+', 'AB-', 'AB+'],
  'A+': ['A+', 'AB+'],
  'B-': ['B-', 'B+', 'AB-', 'AB+'],
  'B+': ['B+', 'AB+'],
  'AB-': ['AB-', 'AB+'],
  'AB+': ['AB+']
};

// Check if donor blood group can donate to patient blood group
function isBloodCompatible(donorGroup, patientGroup) {
  if (!donorGroup || !patientGroup) return false;
  const target = patientGroup.toUpperCase();
  const donor = donorGroup.toUpperCase();
  if (donor === target) return true;
  const compatibleRecipients = COMPATIBILITY_MAP[donor] || [];
  return compatibleRecipients.includes(target);
}

// Get all donor blood groups compatible for a given patient blood group
function getCompatibleDonorGroups(patientGroup) {
  const target = (patientGroup || '').toUpperCase();
  const compatibleDonors = [];
  for (const [donorGroup, recipients] of Object.entries(COMPATIBILITY_MAP)) {
    if (recipients.includes(target)) {
      compatibleDonors.push(donorGroup);
    }
  }
  return compatibleDonors.length > 0 ? compatibleDonors : [target];
}

// Calculate AI Priority Score (0 to 100%)
function calculateAIDonorScore({ donor, requestLat, requestLng, patientBloodGroup }) {
  let score = 0;

  // 1. Blood Compatibility (35 pts max)
  const isExact = donor.blood_group === patientBloodGroup;
  const isComp = isBloodCompatible(donor.blood_group, patientBloodGroup);
  let compatScore = 0;
  if (isExact) compatScore = 35;
  else if (isComp) compatScore = 28;
  else compatScore = 0;

  // 2. Distance Score (25 pts max)
  const distanceKm = calculateDistance(donor.latitude, donor.longitude, requestLat, requestLng);
  let distanceScore = 0;
  if (distanceKm === null) distanceScore = 0;
  else if (distanceKm <= 2) distanceScore = 25;
  else if (distanceKm <= 5) distanceScore = 20;
  else if (distanceKm <= 10) distanceScore = 15;
  else if (distanceKm <= 20) distanceScore = 10;
  else distanceScore = 5;

  // 3. Recency / Days since last donation (20 pts max)
  let recencyScore = 20;
  if (donor.last_donation) {
    const days = Math.floor((new Date() - new Date(donor.last_donation)) / (1000 * 60 * 60 * 24));
    if (days < 56) recencyScore = 0; // Not eligible
    else if (days >= 90) recencyScore = 20;
    else recencyScore = Math.floor(((days - 56) / 34) * 20);
  }

  // 4. Response Rate (10 pts max)
  const responseScore = Math.floor(((donor.response_rate || 90) / 100) * 10);

  // 5. Availability (10 pts max)
  const availScore = donor.availability ? 10 : 0;

  score = compatScore + distanceScore + recencyScore + responseScore + availScore;
  return {
    ai_score: Math.min(Math.max(score, 10), 99),
    distance: distanceKm,
    compatibility_score: compatScore > 0 ? (isExact ? 100 : 80) : 0
  };
}

// AI Fake Request Detection
function detectFakeRequest({ patient_name, contact_number, units, hospital_name, city }) {
  let riskScore = 10; // base low risk
  const reasons = [];

  // Check phone pattern
  const phone = (contact_number || '').trim();
  if (!phone || phone.length < 10) {
    riskScore += 40;
    reasons.push('Invalid phone number format');
  }
  if (/^(\d)\1{9}$/.test(phone) || phone === '1234567890') {
    riskScore += 60;
    reasons.push('Suspected dummy or spam phone number');
  }

  // Check units required
  const numUnits = Number(units) || 1;
  if (numUnits > 10) {
    riskScore += 30;
    reasons.push('Unusually high quantity of blood units requested (>10 units)');
  }

  // Name check
  if (!patient_name || patient_name.trim().length < 3 || /test|fake|spam|asdf/i.test(patient_name)) {
    riskScore += 35;
    reasons.push('Suspicious patient name string pattern');
  }

  const finalRisk = Math.min(riskScore, 99);
  return {
    riskScore: finalRisk,
    needsVerification: finalRisk >= 60,
    reasons
  };
}

// AI Eligibility Checker
function checkEligibility({ age, weight, lastDonationDate, hasIllness, recentTattoo }) {
  const reasons = [];
  let eligible = true;

  const numAge = Number(age) || 25;
  if (numAge < 18 || numAge > 65) {
    eligible = false;
    reasons.push('Age must be between 18 and 65 years');
  }

  const numWeight = Number(weight) || 60;
  if (numWeight < 50) {
    eligible = false;
    reasons.push('Weight must be at least 50 kg for safe blood donation');
  }

  if (lastDonationDate) {
    const days = Math.floor((new Date() - new Date(lastDonationDate)) / (1000 * 60 * 60 * 24));
    if (days < 90) {
      eligible = false;
      const daysLeft = 90 - days;
      reasons.push(`Must wait 90 days between donations. You can donate again in ${daysLeft} days.`);
    }
  }

  if (hasIllness) {
    eligible = false;
    reasons.push('Must be free from active viral infection, cold, or fever');
  }

  if (recentTattoo) {
    eligible = false;
    reasons.push('Must wait at least 6 months after getting a tattoo or body piercing');
  }

  return {
    eligible,
    reasons: reasons.length > 0 ? reasons : ['All criteria met! You are fully eligible to donate blood today.']
  };
}

// AI ETA Calculator
function calculateETA(distanceKm, priority = 'High') {
  if (!Number.isFinite(Number(distanceKm)) || Number(distanceKm) < 0) return null;
  let avgSpeedKmH = 25; // City traffic default speed
  if (priority === 'Critical') avgSpeedKmH = 35; // Priority emergency routing
  const timeHours = distanceKm / avgSpeedKmH;
  const totalMinutes = Math.max(Math.round(timeHours * 60) + 3, 5); // minimum 5 mins
  return totalMinutes;
}

module.exports = {
  calculateDistance,
  isBloodCompatible,
  getCompatibleDonorGroups,
  calculateAIDonorScore,
  detectFakeRequest,
  checkEligibility,
  calculateETA
};
