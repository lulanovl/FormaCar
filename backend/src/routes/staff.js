const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/staffController');

router.get('/', auth, ctrl.getAll);
router.post('/', auth, ctrl.create);
router.patch('/:id', auth, ctrl.update);
router.delete('/:id', auth, ctrl.remove);

module.exports = router;
