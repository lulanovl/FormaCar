const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'formacar_secret_change_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

exports.login = (req, res) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: 'Пароль не указан' });
  }

  const adminPassword = process.env.ADMIN_PASSWORD || 'formacar2025';

  if (password !== adminPassword) {
    return res.status(401).json({ error: 'Неверный пароль' });
  }

  const token = jwt.sign({ admin: true }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

  return res.json({ token });
};
