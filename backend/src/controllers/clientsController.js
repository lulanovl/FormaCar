const db = require('../db/knex');

exports.getAll = async (req, res, next) => {
  try {
    const { search } = req.query;

    let query = db('clients').orderBy('total_visits', 'desc');

    if (search) {
      query = query.where((builder) => {
        builder
          .where('name',         'like', `%${search}%`)
          .orWhere('phone',        'like', `%${search}%`)
          .orWhere('plate_number', 'like', `%${search}%`);
      });
    }

    const clients = await query;
    res.json(clients);
  } catch (err) {
    next(err);
  }
};

exports.getOne = async (req, res, next) => {
  try {
    const { id } = req.params;
    const client = await db('clients').where({ id }).first();
    if (!client) return res.status(404).json({ error: 'Клиент не найден' });

    const orders = await db('orders')
      .where({ client_phone: client.phone })
      .orderBy('created_at', 'desc');

    res.json({ ...client, orders });
  } catch (err) {
    next(err);
  }
};
