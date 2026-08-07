const User = require('../models/User');
const Donor = require('../models/Donor');
const Hospital = require('../models/Hospital');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'lifeflow_hackathon_secret_key_2026';

exports.register = async (req, res) => {
  try {
    const { name, phone, email, password, role, city, blood_group, weight, latitude, longitude, address } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email address and password are required' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'User with this email already exists. Please Sign In.' });
    }

    const userName = name || email.split('@')[0];
    const userId = `usr_${Date.now()}`;

    const userLat = latitude || 13.0827;
    const userLng = longitude || 80.2707;

    await User.create({
      user_id: userId,
      name: userName,
      phone: phone || '9876543210',
      email: email.toLowerCase(),
      password,
      role: role || 'donor',
      city: city || 'Chennai',
      latitude: userLat,
      longitude: userLng,
      created_at: new Date()
    });

    if (role === 'donor') {
      await Donor.create({
        donor_id: `dnr_${Date.now()}`,
        user_id: userId,
        blood_group: blood_group || 'O+',
        weight: weight || 65,
        availability: true,
        verified: true,
        status: 'active',
        latitude: userLat,
        longitude: userLng
      });
    }

    if (role === 'hospital') {
      await Hospital.create({
        hospital_id: `hosp_${Date.now()}`,
        user_id: userId,
        name: userName,
        address: address || city || 'Main Road',
        city: city || 'Chennai',
        latitude: userLat,
        longitude: userLng,
        phone: phone || '044-12345678'
      });
    }

    const token = jwt.sign({ user_id: userId, role: role || 'donor', name: userName }, JWT_SECRET, { expiresIn: '7d' });
    return res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      token,
      user: {
        user_id: userId,
        name: userName,
        email: email.toLowerCase(),
        phone: phone || '9876543210',
        role: role || 'donor',
        city: city || 'Chennai',
        blood_group: blood_group || 'O+'
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email address and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found. Please register an account first.' });
    }

    let donorDoc = null;
    if (user.role === 'donor') {
      donorDoc = await Donor.findOne({ user_id: user.user_id });
    }

    const token = jwt.sign({ user_id: user.user_id, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '7d' });

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role || role || 'donor',
        city: user.city,
        donor_id: donorDoc?.donor_id || null,
        blood_group: donorDoc?.blood_group || null,
        availability: donorDoc?.availability !== undefined ? donorDoc.availability : null
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.forgotPassword = (req, res) => {
  const { email } = req.body;
  return res.json({ success: true, message: `Password reset instructions sent to ${email || 'your email'}.` });
};
