const db = require('../db/knex');

const MONTH_NAMES_RU = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];

// Effective revenue for a single order: final_price overrides calculated price
function effectiveRevenue(o) {
  return o.final_price != null ? o.final_price : (o.price_snapshot || 0) + (o.extras_price || 0);
}

exports.getData = async (req, res, next) => {
  try {
    const now   = new Date();
    const year  = parseInt(req.query.year)  || now.getFullYear();
    const month = parseInt(req.query.month) || (now.getMonth() + 1);

    if (month < 1 || month > 12) return res.status(400).json({ error: 'Некорректный месяц' });

    const monthStr = String(month).padStart(2, '0');
    const prefix   = `${year}-${monthStr}-`;

    // All orders in the selected month
    const orders = await db('orders')
      .where('date', 'like', `${prefix}%`)
      .select('id', 'date', 'status', 'service_name', 'price_snapshot', 'extras_price', 'final_price');

    const doneOrders = orders.filter(o => o.status === 'done');

    const total_orders  = orders.length;
    const done_orders   = doneOrders.length;
    const total_revenue = doneOrders.reduce((s, o) => s + effectiveRevenue(o), 0);
    const avg_check     = done_orders > 0 ? Math.round(total_revenue / done_orders) : 0;
    const conversion    = total_orders > 0 ? Math.round((done_orders / total_orders) * 100) : 0;

    // Revenue + count per day
    const daysInMonth = new Date(year, month, 0).getDate();
    const dailyMap = {};
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${prefix}${String(d).padStart(2, '0')}`;
      dailyMap[dateStr] = { date: dateStr, day: d, revenue: 0, count: 0 };
    }
    orders.forEach(o => {
      if (!dailyMap[o.date]) return;
      dailyMap[o.date].count++;
      if (o.status === 'done') {
        dailyMap[o.date].revenue += effectiveRevenue(o);
      }
    });
    const daily_revenue = Object.values(dailyMap);

    // Breakdown by service
    const svcMap = {};
    orders.forEach(o => {
      const name = o.service_name || 'Без услуги';
      if (!svcMap[name]) svcMap[name] = { service_name: name, count: 0, revenue: 0 };
      svcMap[name].count++;
      if (o.status === 'done') {
        svcMap[name].revenue += effectiveRevenue(o);
      }
    });
    const by_service = Object.values(svcMap).sort((a, b) => b.revenue - a.revenue);

    // Breakdown by status
    const statusMap = {};
    orders.forEach(o => { statusMap[o.status] = (statusMap[o.status] || 0) + 1; });
    const STATUS_ORDER = ['done', 'wip', 'confirmed', 'new', 'rejected', 'no_show'];
    const by_status = STATUS_ORDER
      .filter(s => statusMap[s])
      .map(s => ({ status: s, count: statusMap[s] }));

    res.json({
      year,
      month,
      period_label: `${MONTH_NAMES_RU[month - 1]} ${year}`,
      total_orders,
      done_orders,
      total_revenue,
      avg_check,
      conversion,
      daily_revenue,
      by_service,
      by_status,
    });
  } catch (err) {
    next(err);
  }
};
