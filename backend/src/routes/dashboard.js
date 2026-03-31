const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/dashboardController');

router.get('/', auth, ctrl.getData);

module.exports = router;
