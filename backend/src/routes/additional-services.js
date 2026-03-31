const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/additionalServicesController');

router.get('/', ctrl.getAll);               // Public — активные
router.get('/all', auth, ctrl.getAllAdmin);  // Admin — все
router.post('/', auth, ctrl.create);
router.patch('/:id', auth, ctrl.update);
router.delete('/:id', auth, ctrl.remove);

module.exports = router;
