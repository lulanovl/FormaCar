const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/ordersController');

router.post('/', ctrl.create);                      // Public — форма записи
router.post('/admin', auth, ctrl.createAdmin);      // Admin — создать вручную
router.get('/', auth, ctrl.getAll);
router.get('/:id', auth, ctrl.getOne);
router.patch('/:id/status', auth, ctrl.updateStatus);
router.patch('/:id/price',  auth, ctrl.updatePrice);
router.patch('/:id/plate',  auth, ctrl.updatePlate);

module.exports = router;
