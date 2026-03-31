const db = require('../db/knex');

function autoInitials(name) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return parts[0].slice(0, 2).toUpperCase();
}

exports.getAll = async (req, res, next) => {
  try {
    const staff = await db('staff').orderBy('id');
    res.json(staff);
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { name, role, initials, status } = req.body;
    if (!name) return res.status(400).json({ error: 'Имя обязательно' });

    const [id] = await db('staff').insert({
      name,
      role: role || 'Мастер',
      initials: initials || autoInitials(name),
      status: status || 'working',
    });

    const member = await db('staff').where({ id }).first();
    res.status(201).json(member);
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, role, initials, status } = req.body;

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (role !== undefined) updates.role = role;
    if (initials !== undefined) updates.initials = initials;
    if (status !== undefined) updates.status = status;
    updates.updated_at = new Date().toISOString();

    await db('staff').where({ id }).update(updates);
    const member = await db('staff').where({ id }).first();
    if (!member) return res.status(404).json({ error: 'Сотрудник не найден' });

    res.json(member);
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await db('staff').where({ id }).delete();
    if (!deleted) return res.status(404).json({ error: 'Сотрудник не найден' });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};
