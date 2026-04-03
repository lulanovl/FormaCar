const db     = require('../db/knex');
const events = require('../events');

const MAX_CARS_PER_SLOT = 6; // 6 wash bays

function generateOrderNumber(count) {
  return `#${1000 + count + 1}`;
}

async function upsertClient(trx, { client_name, client_phone, client_car, plate_number, date }) {
  const existing = await trx('clients').where({ phone: client_phone }).first();
  if (existing) {
    const upd = {
      name:         client_name,
      car:          client_car,
      total_visits: existing.total_visits + 1,
      last_visit:   date,
      updated_at:   new Date().toISOString(),
    };
    // Only overwrite plate_number if a new one is provided
    if (plate_number) upd.plate_number = plate_number;
    await trx('clients').where({ phone: client_phone }).update(upd);
  } else {
    await trx('clients').insert({
      name: client_name, phone: client_phone, car: client_car,
      plate_number: plate_number || null,
      total_visits: 1, last_visit: date,
    });
  }
}

async function resolvePrice(service_id, car_type_id) {
  const pricing = await db('service_pricing').where({ service_id, car_type_id }).first();
  return pricing ? pricing.price : 0;
}

async function resolveExtrasPrice(additionalIds) {
  if (!additionalIds || !additionalIds.length) return 0;
  const extras = await db('additional_services').whereIn('id', additionalIds);
  return extras.reduce((sum, e) => sum + e.price, 0);
}

// Public — клиентская форма записи
exports.create = async (req, res, next) => {
  try {
    const {
      client_name, client_phone, client_car,
      service_id, car_type_id,
      date, time_slot, note,
      plate_number = '',
      additional_service_ids = [],
    } = req.body;

    if (!client_name || !client_phone || !client_car || !service_id || !car_type_id || !date || !time_slot) {
      return res.status(400).json({ error: 'Заполните все обязательные поля' });
    }

    const service = await db('services').where({ id: service_id, is_active: true }).first();
    if (!service) return res.status(404).json({ error: 'Услуга не найдена' });

    const carType = await db('car_types').where({ id: car_type_id }).first();
    if (!carType) return res.status(404).json({ error: 'Тип кузова не найден' });

    const price_snapshot = await resolvePrice(service_id, car_type_id);
    const extras_price   = await resolveExtrasPrice(additional_service_ids);

    let order;
    try {
      order = await db.transaction(async (trx) => {
        // Check conflict INSIDE the transaction — SQLite serialises all writes,
        // so this check + insert is atomic and prevents double-booking races.
        const { cnt } = await trx('orders')
          .where({ date, time_slot })
          .whereNotIn('status', ['rejected', 'no_show'])
          .count('id as cnt')
          .first();

        if (Number(cnt) >= MAX_CARS_PER_SLOT) {
          const err = new Error('Все места на это время заняты');
          err.statusCode = 409;
          throw err;
        }

        const { cnt: total } = await trx('orders').count('id as cnt').first();
        const order_number = generateOrderNumber(Number(total));

        const [id] = await trx('orders').insert({
          order_number,
          client_name, client_phone, client_car,
          service_id,  service_name: service.name,
          car_type_id, car_type_name: carType.name,
          date, time_slot,
          status: 'new',
          price_snapshot,
          extras_price,
          additional_service_ids: JSON.stringify(additional_service_ids),
          note: note || '',
          plate_number: plate_number || null,
        });

        await upsertClient(trx, { client_name, client_phone, client_car, plate_number, date });
        return trx('orders').where({ id }).first();
      });
    } catch (err) {
      if (err.statusCode === 409) {
        return res.status(409).json({ error: err.message });
      }
      throw err;
    }

    // Notify all connected admins
    events.broadcast('new_order', {
      id:           order.id,
      order_number: order.order_number,
      client_name:  order.client_name,
      service_name: order.service_name,
      date:         order.date,
      time_slot:    order.time_slot,
    });

    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
};

// Admin — ручное создание заказа из CRM
exports.createAdmin = async (req, res, next) => {
  try {
    const {
      client_name, client_phone, client_car,
      service_id, car_type_id,
      date, time_slot, note, staff_id,
      plate_number = '',
      additional_service_ids = [],
    } = req.body;

    if (!client_name || !client_phone || !client_car || !service_id || !car_type_id || !date || !time_slot) {
      return res.status(400).json({ error: 'Заполните все обязательные поля' });
    }

    const service = await db('services').where({ id: service_id }).first();
    if (!service) return res.status(404).json({ error: 'Услуга не найдена' });

    const carType = await db('car_types').where({ id: car_type_id }).first();
    if (!carType) return res.status(404).json({ error: 'Тип кузова не найден' });

    const price_snapshot = await resolvePrice(service_id, car_type_id);
    const extras_price   = await resolveExtrasPrice(additional_service_ids);

    let order;
    try {
      order = await db.transaction(async (trx) => {
        const { cnt } = await trx('orders')
          .where({ date, time_slot })
          .whereNotIn('status', ['rejected', 'no_show'])
          .count('id as cnt')
          .first();

        if (Number(cnt) >= MAX_CARS_PER_SLOT) {
          const err = new Error('Все места на это время заняты');
          err.statusCode = 409;
          throw err;
        }

        const { cnt: total } = await trx('orders').count('id as cnt').first();
        const order_number = generateOrderNumber(Number(total));

        const [id] = await trx('orders').insert({
          order_number,
          client_name, client_phone, client_car,
          service_id,  service_name: service.name,
          car_type_id, car_type_name: carType.name,
          date, time_slot,
          status: 'confirmed',
          price_snapshot,
          extras_price,
          additional_service_ids: JSON.stringify(additional_service_ids),
          note: note || '',
          staff_id: staff_id || null,
          plate_number: plate_number || null,
        });

        await upsertClient(trx, { client_name, client_phone, client_car, plate_number, date });
        return trx('orders').where({ id }).first();
      });
    } catch (err) {
      if (err.statusCode === 409) {
        return res.status(409).json({ error: err.message });
      }
      throw err;
    }

    events.broadcast('new_order', {
      id:           order.id,
      order_number: order.order_number,
      client_name:  order.client_name,
      service_name: order.service_name,
      date:         order.date,
      time_slot:    order.time_slot,
    });

    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
};

// Admin — список заказов с фильтрами
exports.getAll = async (req, res, next) => {
  try {
    const { status, date, search } = req.query;

    let query = db('orders')
      .leftJoin('services',  'orders.service_id',  'services.id')
      .leftJoin('car_types', 'orders.car_type_id', 'car_types.id')
      .select('orders.*', 'services.duration_min', 'car_types.icon as car_type_icon')
      .orderBy('orders.created_at', 'desc');

    if (status && status !== 'all') query = query.where('orders.status', status);
    if (date)   query = query.where('orders.date', date);
    if (search) {
      query = query.where((b) => {
        b.where('orders.client_name',  'like', `%${search}%`)
          .orWhere('orders.client_phone', 'like', `%${search}%`)
          .orWhere('orders.order_number', 'like', `%${search}%`);
      });
    }

    res.json(await query);
  } catch (err) {
    next(err);
  }
};

// Admin — один заказ
exports.getOne = async (req, res, next) => {
  try {
    const order = await db('orders')
      .leftJoin('services',  'orders.service_id',  'services.id')
      .leftJoin('car_types', 'orders.car_type_id', 'car_types.id')
      .select('orders.*', 'services.duration_min', 'car_types.icon as car_type_icon')
      .where('orders.id', req.params.id)
      .first();

    if (!order) return res.status(404).json({ error: 'Заказ не найден' });
    res.json(order);
  } catch (err) {
    next(err);
  }
};

const VALID_STATUSES = ['new', 'confirmed', 'wip', 'done', 'rejected', 'no_show'];

// Admin — изменить итоговую сумму (скидка / корректировка)
exports.updatePrice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { final_price } = req.body;

    const order = await db('orders').where({ id }).first();
    if (!order) return res.status(404).json({ error: 'Заказ не найден' });

    // null means reset to calculated price; otherwise must be a non-negative integer
    if (final_price !== null && final_price !== undefined) {
      const val = parseInt(final_price);
      if (isNaN(val) || val < 0) {
        return res.status(400).json({ error: 'Некорректная сумма' });
      }
      await db('orders').where({ id }).update({ final_price: val, updated_at: new Date().toISOString() });
    } else {
      await db('orders').where({ id }).update({ final_price: null, updated_at: new Date().toISOString() });
    }

    const updated = await db('orders').where({ id }).first();
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

// Admin — добавить/обновить номер машины
exports.updatePlate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { plate_number } = req.body;

    const order = await db('orders').where({ id }).first();
    if (!order) return res.status(404).json({ error: 'Заказ не найден' });

    const plate = plate_number ? plate_number.trim().toUpperCase() : null;
    await db('orders').where({ id }).update({ plate_number: plate, updated_at: new Date().toISOString() });

    // Sync to client record
    if (plate) {
      await db('clients')
        .where({ phone: order.client_phone })
        .update({ plate_number: plate, updated_at: new Date().toISOString() });
    }

    const updated = await db('orders').where({ id }).first();
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

// Admin — смена статуса
exports.updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: `Допустимые статусы: ${VALID_STATUSES.join(', ')}` });
    }

    const order = await db('orders').where({ id }).first();
    if (!order) return res.status(404).json({ error: 'Заказ не найден' });

    await db('orders').where({ id }).update({ status, updated_at: new Date().toISOString() });
    const updated = await db('orders').where({ id }).first();

    events.broadcast('order_updated', { id: updated.id, order_number: updated.order_number, status });

    res.json(updated);
  } catch (err) {
    next(err);
  }
};
