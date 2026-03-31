const db = require('../db/knex');

// GET /api/checklist/items — шаблон чек-листа
exports.getItems = async (req, res, next) => {
  try {
    const items = await db('checklist_items')
      .where({ is_active: true })
      .orderBy('order_num');
    res.json(items);
  } catch (err) {
    next(err);
  }
};

// POST /api/checklist/items
exports.createItem = async (req, res, next) => {
  try {
    const { title, category, order_num } = req.body;
    if (!title || !category) {
      return res.status(400).json({ error: 'title и category обязательны' });
    }

    const maxOrder = await db('checklist_items').max('order_num as m').first();
    const [id] = await db('checklist_items').insert({
      title,
      category,
      order_num: order_num || (maxOrder.m || 0) + 1,
      is_active: true,
    });

    const item = await db('checklist_items').where({ id }).first();
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/checklist/items/:id
exports.updateItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, category, order_num, is_active } = req.body;

    const updates = {};
    if (title !== undefined) updates.title = title;
    if (category !== undefined) updates.category = category;
    if (order_num !== undefined) updates.order_num = order_num;
    if (is_active !== undefined) updates.is_active = is_active;

    await db('checklist_items').where({ id }).update(updates);
    const item = await db('checklist_items').where({ id }).first();
    if (!item) return res.status(404).json({ error: 'Пункт не найден' });
    res.json(item);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/checklist/items/:id — soft delete
exports.deleteItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    await db('checklist_items').where({ id }).update({ is_active: false });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

// Внутренняя функция: инициализировать чек-лист для заказа
async function ensureOrderChecklist(orderId, trx = db) {
  const existing = await trx('order_checklist').where({ order_id: orderId }).first();
  if (existing) return; // уже инициализирован

  const items = await trx('checklist_items').where({ is_active: true }).orderBy('order_num');
  if (!items.length) return;

  const rows = items.map((item) => ({
    order_id: orderId,
    checklist_item_id: item.id,
    is_checked: false,
  }));

  await trx('order_checklist').insert(rows);
}

// POST /api/checklist/order/:orderId/init
exports.initOrderChecklist = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    const order = await db('orders').where({ id: orderId }).first();
    if (!order) return res.status(404).json({ error: 'Заказ не найден' });

    await ensureOrderChecklist(orderId);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

// GET /api/checklist/order/:orderId — чек-лист заказа, сгруппированный по категориям
exports.getOrderChecklist = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    const order = await db('orders').where({ id: orderId }).first();
    if (!order) return res.status(404).json({ error: 'Заказ не найден' });

    await ensureOrderChecklist(orderId);

    const rows = await db('order_checklist')
      .join('checklist_items', 'order_checklist.checklist_item_id', 'checklist_items.id')
      .where('order_checklist.order_id', orderId)
      .where('checklist_items.is_active', true)
      .orderBy('checklist_items.order_num')
      .select(
        'order_checklist.id',
        'order_checklist.is_checked',
        'order_checklist.checked_at',
        'order_checklist.checked_by',
        'order_checklist.note',
        'checklist_items.id as item_id',
        'checklist_items.title',
        'checklist_items.category',
        'checklist_items.order_num'
      );

    // Группировка по категориям
    const grouped = {};
    for (const row of rows) {
      if (!grouped[row.category]) grouped[row.category] = [];
      grouped[row.category].push(row);
    }

    const total = rows.length;
    const checked = rows.filter((r) => r.is_checked).length;

    res.json({
      order_id: orderId,
      progress: { checked, total, percent: total ? Math.round((checked / total) * 100) : 0 },
      categories: grouped,
    });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/checklist/order/:orderId — массовое обновление отмеченных пунктов
exports.updateOrderChecklist = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { items, checked_by } = req.body;
    // items: [{ checklist_item_id, is_checked, note }]

    if (!Array.isArray(items) || !items.length) {
      return res.status(400).json({ error: 'items должен быть непустым массивом' });
    }

    const order = await db('orders').where({ id: orderId }).first();
    if (!order) return res.status(404).json({ error: 'Заказ не найден' });

    await db.transaction(async (trx) => {
      for (const item of items) {
        await trx('order_checklist')
          .where({ order_id: orderId, checklist_item_id: item.checklist_item_id })
          .update({
            is_checked: item.is_checked,
            checked_at: item.is_checked ? new Date().toISOString() : null,
            checked_by: item.is_checked ? (checked_by || null) : null,
            note: item.note !== undefined ? item.note : trx.raw('note'),
          });
      }
    });

    // Считаем прогресс после обновления
    const allRows = await db('order_checklist')
      .join('checklist_items', 'order_checklist.checklist_item_id', 'checklist_items.id')
      .where('order_checklist.order_id', orderId)
      .where('checklist_items.is_active', true)
      .select('order_checklist.is_checked');

    const total = allRows.length;
    const checked = allRows.filter((r) => r.is_checked).length;
    const allDone = total > 0 && checked === total;

    res.json({
      success: true,
      progress: { checked, total, percent: total ? Math.round((checked / total) * 100) : 0 },
      all_done: allDone,
    });
  } catch (err) {
    next(err);
  }
};
