const express = require('express');
const router = express.Router();

router.use('/auth',                require('./auth'));
router.use('/services',            require('./services'));
router.use('/car-types',           require('./car-types'));
router.use('/additional-services', require('./additional-services'));
router.use('/orders',              require('./orders'));
router.use('/clients',             require('./clients'));
router.use('/staff',               require('./staff'));
router.use('/checklist',           require('./checklist'));
router.use('/slots',               require('./slots'));
router.use('/dashboard',           require('./dashboard'));
router.use('/analytics',           require('./analytics'));
router.use('/events',              require('./events'));

module.exports = router;
