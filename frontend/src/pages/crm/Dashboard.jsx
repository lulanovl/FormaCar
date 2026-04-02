import { useState, useEffect } from 'react';
import { getDashboard, updateStaff, updateOrderStatus } from '../../api/index.js';
import { formatDate, STATUS_LABEL, STATUS_BADGE, STAFF_STATUS_LABEL, STAFF_STATUS_COLOR } from '../../utils/format.js';
import { toastSuccess, toastError } from '../../components/toast.js';

export default function Dashboard({ isActive, refreshKey, onNewOrder, onOpenChecklist, onNavigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    load();
  }, [refreshKey]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const d = await getDashboard();
      setData(d);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleStaffStatusClick(s) {
    const statuses = ['working', 'break', 'off'];
    const next = statuses[(statuses.indexOf(s.status) + 1) % statuses.length];
    try {
      await updateStaff(s.id, { status: next });
      setData(prev => ({
        ...prev,
        staff: prev.staff.map(m => m.id === s.id ? { ...m, status: next } : m),
      }));
    } catch {
      toastError('Не удалось обновить статус');
    }
  }

  async function handleOrderAction(orderId, action) {
    if (action === 'checklist') {
      onOpenChecklist(orderId);
      return;
    }
    try {
      await updateOrderStatus(orderId, action);
      toastSuccess('Статус обновлён');
      load();
    } catch (err) {
      toastError(err.message);
    }
  }

  if (loading) return <div className="loading" />;
  if (error) return <div style={{ padding: '2rem', color: 'var(--gray)' }}>Ошибка загрузки: {error}</div>;
  if (!data) return null;

  const maxCount = Math.max(...data.week_chart.map(d => d.count), 1);
  const todayDate = new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: '2rem', letterSpacing: '0.06em' }}>ДАШБОРД</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--gray)', textTransform: 'capitalize' }}>{todayDate}</div>
        </div>
        <button className="btn-primary" onClick={onNewOrder} style={{ clipPath: 'none', fontFamily: "'Rajdhani',sans-serif", fontSize: '0.75rem', padding: '0.6rem 1.2rem' }}>
          + Новый заказ
        </button>
      </div>

      <div className="kpi-row">
        <div className="kpi kpi-link" onClick={() => onNavigate?.('orders', 'all')} title="Перейти к заказам">
          <div className="kpi-label">Заказов сегодня</div>
          <div className="kpi-val">{data.today_orders_count}</div>
          <div className="kpi-delta">Смотреть все →</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Выручка сегодня</div>
          <div className="kpi-val" style={{ fontSize: '1.6rem' }}>
            {data.today_revenue ? data.today_revenue.toLocaleString('ru-RU') + ' сом' : '—'}
          </div>
        </div>
        <div className="kpi kpi-link" onClick={() => onNavigate?.('orders', 'new')} title="Перейти к новым заказам">
          <div className="kpi-label">В ожидании</div>
          <div className="kpi-val">{data.pending_count}</div>
          {data.pending_count > 0
            ? <div className="kpi-delta neg">Принять →</div>
            : <div className="kpi-delta">Смотреть →</div>
          }
        </div>
        <div className="kpi kpi-link" onClick={() => onNavigate?.('clients')} title="Перейти к клиентам">
          <div className="kpi-label">Клиентов всего</div>
          <div className="kpi-val">{data.total_clients}</div>
          <div className="kpi-delta">База клиентов →</div>
        </div>
      </div>

      <div className="chart-row">
        <div className="crm-box">
          <div className="crm-box-title">Заказы · эта неделя</div>
          <div className="bars">
            {data.week_chart.map((d, i) => {
              const pct = Math.round((d.count / maxCount) * 100);
              return (
                <div key={i} className="bar-col">
                  <div
                    className={`bar-fill ${d.isToday ? 'today' : ''}`}
                    style={{ height: `${Math.max(pct, 3)}%` }}
                    title={`${d.count} заказов`}
                  />
                  <div className="bar-lbl" style={d.isToday ? { color: 'var(--red)' } : {}}>
                    {d.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="crm-box">
          <div className="crm-box-title">Персонал сейчас</div>
          <div className="staff-widget">
            {data.staff.map(s => (
              <div key={s.id} className="staff-row">
                <div className={`staff-avatar ${s.status === 'off' ? 'off' : ''}`}>{s.initials}</div>
                <div>
                  <div className="staff-name">{s.name}</div>
                  <div className="staff-role">{s.role}</div>
                </div>
                <div
                  className="staff-status"
                  style={{ color: STAFF_STATUS_COLOR[s.status] || 'var(--gray)', cursor: 'pointer' }}
                  onClick={() => handleStaffStatusClick(s)}
                >
                  ● {STAFF_STATUS_LABEL[s.status] || s.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="crm-table-wrap">
        <div className="crm-table-header">
          <div className="crm-table-title">Заказы сегодня</div>
        </div>
        <table>
          <thead>
            <tr><th>#</th><th>Клиент</th><th>Авто</th><th>Услуга</th><th>Тип</th><th>Время</th><th>Статус</th><th>Действия</th></tr>
          </thead>
          <tbody>
            {data.today_orders.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--gray)', padding: '2rem' }}>Заказов сегодня нет</td></tr>
            ) : data.today_orders.map(o => (
              <tr key={o.id}>
                <td className="td-num">{o.order_number}</td>
                <td>{o.client_name}</td>
                <td style={{ color: 'var(--gray)' }}>{o.client_car}</td>
                <td>{o.service_name}</td>
                <td>{o.car_type_name || '—'}</td>
                <td>{o.time_slot}</td>
                <td><span className={`badge ${STATUS_BADGE[o.status] || 'badge-new'}`}>{STATUS_LABEL[o.status] || o.status}</span></td>
                <td>
                  {o.status === 'new' && (
                    <>
                      <button className="act-btn ok" onClick={() => handleOrderAction(o.id, 'confirmed')}>Принять</button>
                      <button className="act-btn danger" onClick={() => handleOrderAction(o.id, 'rejected')}>Отклонить</button>
                    </>
                  )}
                  {o.status === 'confirmed' && (
                    <button className="act-btn ok" onClick={() => handleOrderAction(o.id, 'wip')}>В работу</button>
                  )}
                  {o.status === 'wip' && (
                    <button className="act-btn checklist" onClick={() => handleOrderAction(o.id, 'checklist')}>✓ Проверка</button>
                  )}
                  {o.status === 'done' && (
                    <span style={{ color: '#4caf7d', fontSize: '0.8rem' }}>✓ Готово</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
