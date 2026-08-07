const express = require('express');
const router = express.Router();
const hospitalController = require('../controllers/hospitalController');
const donorController = require('../controllers/donorController');

router.get('/dashboard', hospitalController.getDashboard);
router.get('/inventory', hospitalController.getInventory);
router.post('/inventory/update', hospitalController.updateInventory);
router.get('/notifications', donorController.getNotifications);
router.post('/request/create', hospitalController.createRequest);
router.post('/request/close', hospitalController.closeRequest);
router.post('/donor/verify', hospitalController.verifyDonor);
router.get('/camps', hospitalController.getCamps);
router.post('/camps/create', hospitalController.createCamp);
router.get('/reports', hospitalController.getReports);

module.exports = router;
