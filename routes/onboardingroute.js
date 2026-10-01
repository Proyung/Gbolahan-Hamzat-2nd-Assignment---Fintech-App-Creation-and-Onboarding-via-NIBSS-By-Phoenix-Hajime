const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/auth');
const onboardingController = require('../controller/onboardingController');

router.use(protect);

router.post('/bvn', onboardingController.onboardBvn);
router.post('/nin', onboardingController.onboardNin);

module.exports = router;
