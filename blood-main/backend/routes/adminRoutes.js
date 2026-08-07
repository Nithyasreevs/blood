const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireAuth, allowRoles } = require('../middleware/auth');
router.use(requireAuth, allowRoles('admin'));

router.get('/dashboard', adminController.getDashboard);
router.get('/users', adminController.getUsers);
router.post('/users/status', adminController.updateUserStatus);
router.get('/donors', adminController.getDonors);
router.post('/donors/verify', adminController.verifyDonorStatus);
router.get('/hospitals', adminController.getHospitals);
router.post('/hospitals/add', adminController.addHospital);
router.post('/hospitals/remove', adminController.removeHospital);
router.get('/requests', adminController.getAllRequests);
router.post('/requests/verify', adminController.verifyRequest);
router.post('/requests/block', adminController.blockRequest);
router.get('/inventory-monitor', adminController.getInventoryMonitor);
router.get('/analytics', adminController.getAnalytics);
router.post('/broadcast', adminController.broadcastNotification);

module.exports = router;
