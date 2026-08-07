// Real-time dynamic seed store & fallback database
const users = [
  { user_id: 'usr_donor_1', name: 'Rahul Sharma', email: 'rahul@lifeflow.org', phone: '9876543210', password: 'password123', role: 'donor', city: 'Chennai', latitude: 13.0827, longitude: 80.2707 },
  { user_id: 'usr_hosp_apollo', name: 'Apollo Speciality Hospital', email: 'bloodbank@apollo.com', phone: '044-28290200', password: 'password123', role: 'hospital', city: 'Chennai', latitude: 13.0604, longitude: 80.2496 },
  { user_id: 'usr_admin_root', name: 'System Administrator', email: 'admin@lifeflow.org', phone: '9999999999', password: 'password123', role: 'admin', city: 'Chennai', latitude: 13.0827, longitude: 80.2707 }
];

const donors = [
  { donor_id: 'dnr_1', user_id: 'usr_donor_1', name: 'Rahul Sharma', blood_group: 'O-', weight: 68, availability: true, verified: true, total_donations: 8, response_rate: 98, status: 'active' },
  { donor_id: 'dnr_2', user_id: 'usr_donor_2', name: 'Kavitha Ram', blood_group: 'A+', weight: 62, availability: true, verified: true, total_donations: 5, response_rate: 95, status: 'active' },
  { donor_id: 'dnr_3', user_id: 'usr_donor_3', name: 'Siddharth V', blood_group: 'B+', weight: 72, availability: true, verified: true, total_donations: 3, response_rate: 90, status: 'active' }
];

const hospitals = [
  { hospital_id: 'hosp_apollo_1', user_id: 'usr_hosp_apollo', name: 'Apollo Speciality Hospital', address: 'Greams Road, Thousand Lights', city: 'Chennai', latitude: 13.0604, longitude: 80.2496, phone: '044-28290200' },
  { hospital_id: 'hosp_fortis_2', user_id: 'usr_hosp_fortis', name: 'Fortis Malar Hospital', address: 'Adyar, Gandhi Nagar', city: 'Chennai', latitude: 13.0067, longitude: 80.2570, phone: '044-42892222' }
];

const emergencyRequests = [
  { request_id: 'req_101', hospital_id: 'hosp_apollo_1', hospital_name: 'Apollo Speciality Hospital', patient_name: 'Anand Kumar', blood_group: 'O-', units: 2, priority: 'Critical', contact_number: '9876543210', city: 'Chennai', latitude: 13.0604, longitude: 80.2496, status: 'Waiting', created_time: new Date(), ai_risk_score: 12, radius_km: 5 },
  { request_id: 'req_102', hospital_id: 'hosp_fortis_2', hospital_name: 'Fortis Malar Hospital', patient_name: 'Priya Sharma', blood_group: 'A+', units: 1, priority: 'High', contact_number: '9840123456', city: 'Chennai', latitude: 13.0067, longitude: 80.2570, status: 'Donor Accepted', created_time: new Date(), ai_risk_score: 5, radius_km: 5 }
];

const bloodInventories = [
  { inventory_id: 'inv_1', hospital_id: 'hosp_apollo_1', hospital_name: 'Apollo Speciality Hospital', blood_group: 'O+', available_units: 25, updated_time: new Date() },
  { inventory_id: 'inv_2', hospital_id: 'hosp_apollo_1', hospital_name: 'Apollo Speciality Hospital', blood_group: 'O-', available_units: 2, updated_time: new Date() },
  { inventory_id: 'inv_3', hospital_id: 'hosp_apollo_1', hospital_name: 'Apollo Speciality Hospital', blood_group: 'A+', available_units: 18, updated_time: new Date() },
  { inventory_id: 'inv_4', hospital_id: 'hosp_apollo_1', hospital_name: 'Apollo Speciality Hospital', blood_group: 'A-', available_units: 4, updated_time: new Date() },
  { inventory_id: 'inv_5', hospital_id: 'hosp_apollo_1', hospital_name: 'Apollo Speciality Hospital', blood_group: 'B+', available_units: 15, updated_time: new Date() },
  { inventory_id: 'inv_6', hospital_id: 'hosp_apollo_1', hospital_name: 'Apollo Speciality Hospital', blood_group: 'B-', available_units: 3, updated_time: new Date() },
  { inventory_id: 'inv_7', hospital_id: 'hosp_apollo_1', hospital_name: 'Apollo Speciality Hospital', blood_group: 'AB+', available_units: 8, updated_time: new Date() },
  { inventory_id: 'inv_8', hospital_id: 'hosp_apollo_1', hospital_name: 'Apollo Speciality Hospital', blood_group: 'AB-', available_units: 3, updated_time: new Date() }
];

const donations = [
  { donation_id: 'don_101', user_id: 'usr_donor_1', donor_id: 'dnr_1', donor_name: 'Rahul Sharma', hospital_name: 'Apollo Speciality Hospital', date: '2026-06-15', units: 1, qr_code: 'LF-2026-DONOR-101', verified: true },
  { donation_id: 'don_102', user_id: 'usr_donor_1', donor_id: 'dnr_1', donor_name: 'Rahul Sharma', hospital_name: 'Fortis Malar Hospital', date: '2026-02-10', units: 1, qr_code: 'LF-2026-DONOR-102', verified: true }
];

const bloodCamps = [
  { camp_id: 'camp_1', hospital: 'Apollo Speciality Hospital', date: '2026-08-15', venue: 'City Community Center, Anna Nagar', organizer: 'Rotary Club & Apollo Desk', city: 'Chennai', registered_count: 42 },
  { camp_id: 'camp_2', hospital: 'Apollo Speciality Hospital', date: '2026-09-01', venue: 'Marina Beach Promenade Campus', organizer: 'LifeFlow Youth Drive', city: 'Chennai', registered_count: 85 }
];

const notifications = [
  { notification_id: 'notif_1', user_id: 'usr_donor_1', title: '🚨 Critical O- Request Broadcast', message: 'Urgent demand at Apollo Speciality Hospital. You match 98% AI donor score.', status: 'unread', sent_time: new Date() },
  { notification_id: 'notif_2', user_id: 'usr_donor_1', title: '🏆 50 Reward Points Added', message: 'Your last verified donation was credited to your profile leaderboard.', status: 'read', sent_time: new Date() }
];

const feedback = [
  { feedback_id: 'fb_1', request_id: 'req_101', rating: 5, comments: 'LifeFlow AI dispatched donor Rahul Sharma in under 12 minutes! Incredible service.', created_at: new Date() }
];

const requestDonorMap = [];
const rewards = [];

module.exports = {
  users,
  donors,
  hospitals,
  emergencyRequests,
  bloodInventory: bloodInventories,
  bloodInventories,
  donations,
  bloodCamps,
  notifications,
  feedback,
  requestDonorMap,
  rewards
};
