const express = require('express');
const router = express.Router();
const requestController = require('../controllers/requestController');
const { optionalAuth } = require('../middleware/auth');

router.post('/emergency', requestController.createEmergencyRequest);
router.get('/status', requestController.getRequestStatus);
router.get('/status/:id', requestController.getRequestStatus);
router.get('/tracking', optionalAuth, requestController.getLiveDonorTracking);
router.get('/tracking/:id', optionalAuth, requestController.getLiveDonorTracking);
router.get('/history', requestController.getRequestHistory);
router.post('/feedback', requestController.submitFeedback);

module.exports = router;
