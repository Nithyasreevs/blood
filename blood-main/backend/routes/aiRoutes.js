const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

router.get('/matches', aiController.getAIDonorMatches);
router.get('/compatibility', aiController.getBloodCompatibility);
router.post('/expand-radius', aiController.expandEmergencyRadius);
router.post('/find-donors-radius', aiController.findDonorsInRadius);
router.post('/detect-fake', aiController.detectFakeRequest);
router.post('/check-eligibility', aiController.checkEligibilityStatus);
router.post('/chatbot', aiController.askAIChatbot);

module.exports = router;
