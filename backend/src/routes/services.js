const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/servicesController');

router.get('/', ctrl.getPublic);            // Public — активные услуги для клиентского сайта
router.get('/all', auth, ctrl.getAll);      // Admin — все услуги
router.post('/', auth, ctrl.create);
router.patch('/:id', auth, ctrl.update);
router.delete('/:id', auth, ctrl.remove);

module.exports = router;
