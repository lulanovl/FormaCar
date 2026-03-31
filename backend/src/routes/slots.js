const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/slotsController');

router.get('/', ctrl.getAvailable); // Public — ?date=YYYY-MM-DD

module.exports = router;
