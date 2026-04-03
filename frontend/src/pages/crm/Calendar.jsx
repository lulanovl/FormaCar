import { useState, useEffect } from 'react';
import { getOrders } from '../../api/index.js';
import { STATUS_LABEL, STATUS_BADGE } from '../../utils/format.js';
import CalendarPicker from '../../components/CalendarPicker.jsx';

const SLOTS = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00','22:00','23:00'];
const MAX_BAYS = 6;

function statusColor(status) {
  return { done: '#4caf7d', wip: '#64b5f6', new: 'var(--red)', confirmed: '#64b5f6' }[status] || 'var(--gray)';
}

export default function Calendar({ isActive, refreshKey, onNavigate }) {
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const selYear  = Number(selectedDate.slice(0, 4));
  const selMonth = Number(selectedDate.slice(5, 7)) - 1;

  useEffect(() => {
    loadOrders(selYear, selMonth);
  }, [selYear, selMonth, refreshKey]);

  async function loadOrders(y, m) {
    setLoading(true);
    try {
      const pad = n => String(n).padStart(2, '0');
      const from = `${y}-${pad(m + 1)}-01`;
      const lastDay = new Date(y, m + 1, 0).getDate();
      const to = `${y}-${pad(m + 1)}-${lastDay}`;
      const all = await getOrders({});
      setOrders(all.filter(o => o.date >= from && o.date <= to));
    } finally {
      setLoading(false);
    }
  }

  const datesWithOrders = new Set(orders.map(o => o.date));

  const dayOrders = orders
    .filter(o => o.date === selectedDate && !['rejected', 'no_show'].includes(o.status))
    .sort((a, b) => a.time_slot.localeCompare(b.time_slot));

  const ordersByTime = {};
  for (const o of dayOrders) {
    if (!ordersByTime[o.time_slot]) ordersByTime[o.time_slot] = [];
    ordersByTime[o.time_slot].push(o);
  }

  const selDateLabel = new Date(selectedDate + 'T00:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });

  function handleOrderClick(orderId) {
    onNavigate?.('orders', orderId);
  }

  return (
    <>
      <div className="crm-page-title">РАСПИСАНИЕ</div>

      {/* Date selector — compact top bar */}
      <div className="crm-box" style={{ marginBottom: '1px' }}>
        <div className="cal-topbar">
          <div className="cal-topbar-label">Дата · {selDateLabel}</div>
          <CalendarPicker
            value={selectedDate}
            onChange={setSelectedDate}
            markedDates={datesWithOrders}
          />
        </div>
      </div>

      {/* Full slot list */}
      <div className="crm-box">
        <div className="crm-box-title">
          {loading ? 'Загрузка...' : `Слоты дня · ${dayOrders.length} заказ${dayOrders.length === 1 ? '' : dayOrders.length >= 2 && dayOrders.length <= 4 ? 'а' : 'ов'}`}
        </div>

        {loading ? (
          <div className="loading" />
        ) : (
          <div className="slot-list">
            {SLOTS.map(time => {
              const slotOrders = ordersByTime[time] || [];
              const count = slotOrders.length;
              const free = MAX_BAYS - count;

              if (count === 0) {
                return (
                  <div key={time} className="slot-item free">
                    <span className="slot-time" style={{ color: 'var(--gray)' }}>{time}</span>
                    <div style={{ fontSize: '0.83rem', color: 'var(--gray)' }}>Свободно · 6/6 мест</div>
                  </div>
                );
              }

              const capacityColor = free === 0 ? 'var(--red)' : free <= 2 ? '#f59e0b' : '#4caf7d';
              const capacityLabel = free === 0 ? 'Занято' : `${free} из ${MAX_BAYS} свободно`;

              return (
                <div key={time} className={`slot-item slot-item-multi ${free === 0 ? 'full' : ''}`}>
                  <div className="slot-item-header">
                    <span className="slot-time" style={{ color: statusColor(slotOrders[0].status) }}>{time}</span>
                    <span className="slot-capacity" style={{ color: capacityColor }}>{count}/{MAX_BAYS} · {capacityLabel}</span>
                  </div>
                  {slotOrders.map(o => (
                    <div
                      key={o.id}
                      className="slot-order-card slot-order-card-link"
                      onClick={() => handleOrderClick(o.id)}
                      title="Открыть заказ"
                    >
                      <div className="slot-order-row">
                        <span className="slot-order-name">{o.client_name}</span>
                        <span className={`badge ${STATUS_BADGE[o.status] || 'badge-new'}`}>{STATUS_LABEL[o.status]}</span>
                      </div>
                      <div className="slot-order-detail">
                        {o.client_car} · {o.service_name}{o.car_type_name ? ' · ' + o.car_type_name : ''}
                      </div>
                      <div className="slot-order-hint">Нажмите, чтобы открыть заказ →</div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
