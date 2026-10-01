const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/auth');
const authController = require('../controller/authController');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', protect, authController.me);

module.exports = router;
