const db = require('../db/knex');

const MAX_CARS_PER_SLOT = 6; // 6 wash bays

exports.getAvailable = async (req, res, next) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: 'Параметр date обязателен (YYYY-MM-DD)' });

    const slots = await db('time_slots').where({ is_active: true }).orderBy('time');

    const orders = await db('orders')
      .where({ date })
      .whereNotIn('status', ['rejected', 'no_show'])
      .select('time_slot');

    // Count bookings per time slot
    const countByTime = {};
    for (const o of orders) {
      countByTime[o.time_slot] = (countByTime[o.time_slot] || 0) + 1;
    }

    const result = slots.map((slot) => {
      const booked = countByTime[slot.time] || 0;
      const spots_left = MAX_CARS_PER_SLOT - booked;
      return {
        time:       slot.time,
        available:  spots_left > 0,
        spots_left,
        spots_total: MAX_CARS_PER_SLOT,
      };
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
};
