// src/routes/analytics.js
const express = require('express');
const router = express.Router();
const { getVelocity, getDistribution, getMemberPerformance, getActivity, getBurndown } = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/velocity', getVelocity);
router.get('/distribution', getDistribution);
router.get('/members', getMemberPerformance);
router.get('/activity', getActivity);
router.get('/burndown/:projectId', getBurndown);

module.exports = router;
