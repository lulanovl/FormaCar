const jwt = require('jsonwebtoken');

/**
 * Middleware to verify JWT token from Authorization header.
 * Expects: Authorization: Bearer <token>
 */
function auth(req, res, next) {
  const authHeader = req.headers['authorization'];

  // EventSource (SSE) cannot send headers — accept token as query param too
  let token = req.query.token || null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7);
  }

  if (!token) {
    return res.status(401).json({ error: 'Токен не предоставлен' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'formacar_secret_change_in_production');
    req.admin = true;
    req.adminData = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Недействительный или истёкший токен' });
  }
}

module.exports = auth;
