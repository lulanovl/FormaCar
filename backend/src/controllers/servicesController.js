const db = require('../db/knex');

// Загружает матрицу цен и встраивает в услуги
async function attachPricing(services) {
  const serviceIds = services.map((s) => s.id);
  const pricing = await db('service_pricing')
    .join('car_types', 'service_pricing.car_type_id', 'car_types.id')
    .whereIn('service_pricing.service_id', serviceIds)
    .orderBy('car_types.order_num')
    .select(
      'service_pricing.service_id',
      'service_pricing.car_type_id',
      'service_pricing.price',
      'service_pricing.is_from_price',
      'car_types.name as car_type_name',
      'car_types.icon as car_type_icon'
    );

  return services.map((svc) => ({
    ...svc,
    pricing: pricing
      .filter((p) => p.service_id === svc.id)
      .map((p) => ({
        car_type_id: p.car_type_id,
        car_type_name: p.car_type_name,
        car_type_icon: p.car_type_icon,
        price: p.price,
        is_from_price: Boolean(p.is_from_price),
      })),
  }));
}

// GET /api/services — публичный, только активные + цены
exports.getPublic = async (req, res, next) => {
  try {
    const services = await db('services').where({ is_active: true }).orderBy('id');
    res.json(await attachPricing(services));
  } catch (err) {
    next(err);
  }
};

// GET /api/services/all — admin, все + цены
exports.getAll = async (req, res, next) => {
  try {
    const services = await db('services').orderBy('id');
    res.json(await attachPricing(services));
  } catch (err) {
    next(err);
  }
};

// POST /api/services (admin)
exports.create = async (req, res, next) => {
  try {
    const { name, description, duration_min, is_active } = req.body;
    if (!name) return res.status(400).json({ error: 'Название обязательно' });
    const [id] = await db('services').insert({
      name, description: description || '',
      duration_min: duration_min || 60,
      price_som: 0,
      is_active: is_active !== undefined ? is_active : true,
    });
    const svc = await db('services').where({ id }).first();
    res.status(201).json({ ...svc, pricing: [] });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/services/:id (admin)
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, duration_min, is_active, pricing } = req.body;

    const upd = { updated_at: new Date().toISOString() };
    if (name !== undefined) upd.name = name;
    if (description !== undefined) upd.description = description;
    if (duration_min !== undefined) upd.duration_min = duration_min;
    if (is_active !== undefined) upd.is_active = is_active;

    await db('services').where({ id }).update(upd);

    // Обновление цен (если переданы)
    if (Array.isArray(pricing)) {
      for (const p of pricing) {
        await db('service_pricing')
          .where({ service_id: id, car_type_id: p.car_type_id })
          .update({ price: p.price, is_from_price: p.is_from_price || false });
      }
    }

    const services = await db('services').where({ id });
    const result = await attachPricing(services);
    res.json(result[0] || null);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/services/:id (admin)
exports.remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    await db('service_pricing').where({ service_id: id }).delete();
    const deleted = await db('services').where({ id }).delete();
    if (!deleted) return res.status(404).json({ error: 'Услуга не найдена' });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};
