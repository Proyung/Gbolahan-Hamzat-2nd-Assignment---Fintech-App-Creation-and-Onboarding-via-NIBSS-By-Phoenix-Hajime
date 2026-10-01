const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/auth');
const accountController = require('../controller/accountController');

router.use(protect);

router.post('/', accountController.createAccount);
router.get('/me', accountController.getMyAccount);
router.get('/me/balance', accountController.getMyBalance);
router.get('/name-enquiry/:accountNumber', accountController.nameEnquiry);

module.exports = router;
