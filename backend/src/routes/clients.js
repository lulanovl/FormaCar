const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/clientsController');

router.get('/', auth, ctrl.getAll);
router.get('/:id', auth, ctrl.getOne);

module.exports = router;
