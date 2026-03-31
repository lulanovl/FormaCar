const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/carTypesController');

router.get('/', ctrl.getAll);           // Public
router.get('/:id', ctrl.getOne);        // Public
router.post('/', auth, ctrl.create);
router.patch('/:id', auth, ctrl.update);
router.delete('/:id', auth, ctrl.remove);

module.exports = router;
