const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');
const { subscribe } = require('../events');

// GET /api/events — SSE stream for admin panel
// Token passed as ?token= because EventSource cannot set headers
router.get('/', auth, (req, res) => {
  const unsubscribe = subscribe(res);
  req.on('close', unsubscribe);
});

module.exports = router;
