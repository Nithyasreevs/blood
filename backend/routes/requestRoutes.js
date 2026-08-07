const express = require('express');
const router = express.Router();
const requestController = require('../controllers/requestController');

router.post('/emergency', requestController.createEmergencyRequest);
router.get('/status', requestController.getRequestStatus);
router.get('/status/:id', requestController.getRequestStatus);
router.get('/tracking', requestController.getLiveDonorTracking);
router.get('/tracking/:id', requestController.getLiveDonorTracking);
router.get('/history', requestController.getRequestHistory);
router.post('/feedback', requestController.submitFeedback);

module.exports = router;
