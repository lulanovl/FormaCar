const db = require('../db/knex');

// GET /api/car-types — все типы кузова (публичный)
exports.getAll = async (req, res, next) => {
  try {
    const carTypes = await db('car_types').orderBy('order_num');
    res.json(carTypes);
  } catch (err) {
    next(err);
  }
};

// GET /api/car-types/:id
exports.getOne = async (req, res, next) => {
  try {
    const ct = await db('car_types').where({ id: req.params.id }).first();
    if (!ct) return res.status(404).json({ error: 'Тип не найден' });
    res.json(ct);
  } catch (err) {
    next(err);
  }
};

// POST /api/car-types (admin)
exports.create = async (req, res, next) => {
  try {
    const { name, icon, order_num } = req.body;
    if (!name) return res.status(400).json({ error: 'name обязателен' });
    const [id] = await db('car_types').insert({ name, icon: icon || '', order_num: order_num || 0 });
    res.status(201).json(await db('car_types').where({ id }).first());
  } catch (err) {
    next(err);
  }
};

// PATCH /api/car-types/:id (admin)
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, icon, order_num } = req.body;
    const upd = {};
    if (name !== undefined) upd.name = name;
    if (icon !== undefined) upd.icon = icon;
    if (order_num !== undefined) upd.order_num = order_num;
    await db('car_types').where({ id }).update(upd);
    res.json(await db('car_types').where({ id }).first());
  } catch (err) {
    next(err);
  }
};

// DELETE /api/car-types/:id (admin)
exports.remove = async (req, res, next) => {
  try {
    await db('car_types').where({ id: req.params.id }).delete();
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};
