const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/checklistController');

router.get('/items', auth, ctrl.getItems);
router.post('/items', auth, ctrl.createItem);
router.patch('/items/:id', auth, ctrl.updateItem);
router.delete('/items/:id', auth, ctrl.deleteItem);

router.post('/order/:orderId/init', auth, ctrl.initOrderChecklist);
router.get('/order/:orderId', auth, ctrl.getOrderChecklist);
router.patch('/order/:orderId', auth, ctrl.updateOrderChecklist);

module.exports = router;
