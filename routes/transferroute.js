const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/auth');
const transferController = require('../controller/transferController');

router.use(protect);

router.post('/', transferController.transfer);
router.get('/history', transferController.history);
router.get('/:reference/status', transferController.transactionStatus);

module.exports = router;
