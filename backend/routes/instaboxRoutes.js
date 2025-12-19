const express = require('express');
const router = express.Router();
const { checkAvailability } = require('../controllers/instaboxController');

router.post('/availability', checkAvailability);

module.exports = router;
