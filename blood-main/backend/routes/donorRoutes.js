const express = require('express');
const router = express.Router();
const donorController = require('../controllers/donorController');
const { requireAuth, allowRoles } = require('../middleware/auth');
router.use(requireAuth, allowRoles('donor'));

router.get('/profile', donorController.getProfile);
router.post('/profile/update', donorController.updateProfile);
router.get('/requests/nearby', donorController.getNearbyRequests);
router.post('/request/accept', donorController.acceptRequest);
router.post('/request/reject', donorController.rejectRequest);
router.get('/history', donorController.getDonationHistory);
router.get('/rewards', donorController.getRewards);
router.get('/notifications', donorController.getNotifications);

module.exports = router;
