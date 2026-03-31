const db = require('../db/knex');

// GET /api/additional-services — публичный
exports.getAll = async (req, res, next) => {
  try {
    const services = await db('additional_services')
      .where({ is_active: true })
      .orderBy('order_num');
    res.json(services);
  } catch (err) {
    next(err);
  }
};

// GET /api/additional-services/all — admin (включая неактивные)
exports.getAllAdmin = async (req, res, next) => {
  try {
    res.json(await db('additional_services').orderBy('order_num'));
  } catch (err) {
    next(err);
  }
};

// POST /api/additional-services (admin)
exports.create = async (req, res, next) => {
  try {
    const { name, price, is_from_price, duration_min, order_num } = req.body;
    if (!name || price === undefined) return res.status(400).json({ error: 'name и price обязательны' });
    const maxOrder = await db('additional_services').max('order_num as m').first();
    const [id] = await db('additional_services').insert({
      name, price, is_from_price: is_from_price || false,
      duration_min: duration_min || 0,
      is_active: true,
      order_num: order_num || (maxOrder.m || 0) + 1,
    });
    res.status(201).json(await db('additional_services').where({ id }).first());
  } catch (err) {
    next(err);
  }
};

// PATCH /api/additional-services/:id (admin)
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, price, is_from_price, duration_min, is_active, order_num } = req.body;
    const upd = {};
    if (name !== undefined) upd.name = name;
    if (price !== undefined) upd.price = price;
    if (is_from_price !== undefined) upd.is_from_price = is_from_price;
    if (duration_min !== undefined) upd.duration_min = duration_min;
    if (is_active !== undefined) upd.is_active = is_active;
    if (order_num !== undefined) upd.order_num = order_num;
    await db('additional_services').where({ id }).update(upd);
    res.json(await db('additional_services').where({ id }).first());
  } catch (err) {
    next(err);
  }
};

// DELETE /api/additional-services/:id (admin)
exports.remove = async (req, res, next) => {
  try {
    await db('additional_services').where({ id: req.params.id }).update({ is_active: false });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};
