const db = require('../db/knex');

function getWeekDates() {
  const today = new Date();
  const day = today.getDay(); // 0=Sun, 1=Mon...
  const diffToMon = (day === 0 ? -6 : 1 - day);
  const mon = new Date(today);
  mon.setDate(today.getDate() + diffToMon);

  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

const DAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

exports.getData = async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const weekDates = getWeekDates();

    // KPI
    const [todayOrdersRow] = await db('orders').where({ date: today }).count('id as cnt');
    const [pendingRow] = await db('orders').where({ status: 'new' }).count('id as cnt');
    const [totalClientsRow] = await db('clients').count('id as cnt');
    const [revenueRow] = await db('orders')
      .where({ date: today, status: 'done' })
      .select(db.raw('SUM(CASE WHEN final_price IS NOT NULL THEN final_price ELSE COALESCE(price_snapshot, 0) + COALESCE(extras_price, 0) END) as total'));

    // График недели
    const weekOrdersRaw = await db('orders')
      .whereIn('date', weekDates)
      .select('date')
      .count('id as cnt')
      .groupBy('date');

    const weekCountMap = {};
    weekOrdersRaw.forEach((r) => { weekCountMap[r.date] = Number(r.cnt); });

    const weekChart = weekDates.map((date, i) => ({
      date,
      label: DAY_LABELS[i],
      count: weekCountMap[date] || 0,
      isToday: date === today,
    }));

    // Заказы сегодня
    const todayOrders = await db('orders')
      .where({ date: today })
      .orderBy('time_slot')
      .select('*');

    // Персонал
    const staff = await db('staff').orderBy('id');

    res.json({
      today_orders_count: Number(todayOrdersRow.cnt),
      pending_count: Number(pendingRow.cnt),
      total_clients: Number(totalClientsRow.cnt),
      today_revenue: revenueRow.total || 0,
      week_chart: weekChart,
      today_orders: todayOrders,
      staff,
    });
  } catch (err) {
    next(err);
  }
};
