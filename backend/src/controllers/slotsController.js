const db = require('../db/knex');

exports.getAvailable = async (req, res, next) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: 'Параметр date обязателен (YYYY-MM-DD)' });

    const slots = await db('time_slots').where({ is_active: true }).orderBy('time');

    const takenOrders = await db('orders')
      .where({ date })
      .whereNotIn('status', ['rejected', 'no_show'])
      .select('time_slot');

    const takenTimes = new Set(takenOrders.map((o) => o.time_slot));

    const result = slots.map((slot) => ({
      time: slot.time,
      available: !takenTimes.has(slot.time),
    }));

    res.json(result);
  } catch (err) {
    next(err);
  }
};
