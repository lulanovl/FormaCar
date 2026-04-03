import { useState, useEffect } from 'react';
import { getDashboard, updateStaff, updateOrderStatus, getOrders } from '../../api/index.js';
import { formatDate, STATUS_LABEL, STATUS_BADGE, STAFF_STATUS_LABEL, STAFF_STATUS_COLOR } from '../../utils/format.js';
import { toastSuccess, toastError } from '../../components/toast.js';

export default function Dashboard({ isActive, refreshKey, onNewOrder, onOpenChecklist, onNavigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Selected day in the week chart (null = today)
  const [selectedChartDate, setSelectedChartDate] = useState(null);
  const [chartDayOrders, setChartDayOrders] = useState(null);
  const [chartDayLoading, setChartDayLoading] = useState(false);

  useEffect(() => {
    load();
  }, [refreshKey]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const d = await getDashboard();
      setData(d);
      setSelectedChartDate(null);
      setChartDayOrders(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleBarClick(d) {
    if (d.isToday) {
      setSelectedChartDate(null);
      setChartDayOrders(null);
      return;
    }
    setSelectedChartDate(d.date);
    setChartDayLoading(true);
    try {
      const all = await getOrders({});
      setChartDayOrders(all.filter(o => o.date === d.date));
    } catch {
      setChartDayOrders([]);
    } finally {
      setChartDayLoading(false);
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
  const displayOrders = chartDayOrders ?? data.today_orders;
  const selectedDayLabel = selectedChartDate
    ? new Date(selectedChartDate + 'T00:00:00').toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })
    : 'сегодня';

  // KPI values: if a past day is selected, compute from fetched orders
  const kpi = chartDayOrders ? {
    today_orders_count: chartDayOrders.length,
    today_revenue: chartDayOrders
      .filter(o => o.status === 'done')
      .reduce((s, o) => s + (o.price_snapshot || 0) + (o.extras_price || 0), 0),
    pending_count: chartDayOrders.filter(o => o.status === 'new').length,
    total_clients: data.total_clients,
  } : data;
  const kpiDayLabel = selectedChartDate ? 'Заказов за день' : 'Заказов сегодня';
  const kpiRevLabel = selectedChartDate ? 'Выручка за день' : 'Выручка сегодня';

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
          <div className="kpi-label">{kpiDayLabel}</div>
          <div className="kpi-val">{kpi.today_orders_count}</div>
          <div className="kpi-delta">Смотреть все →</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">{kpiRevLabel}</div>
          <div className="kpi-val" style={{ fontSize: '1.6rem' }}>
            {kpi.today_revenue ? kpi.today_revenue.toLocaleString('ru-RU') + ' сом' : '—'}
          </div>
        </div>
        <div className="kpi kpi-link" onClick={() => onNavigate?.('orders', 'new')} title="Перейти к новым заказам">
          <div className="kpi-label">В ожидании</div>
          <div className="kpi-val">{kpi.pending_count}</div>
          {kpi.pending_count > 0
            ? <div className="kpi-delta neg">Принять →</div>
            : <div className="kpi-delta">Смотреть →</div>
          }
        </div>
        <div className="kpi kpi-link" onClick={() => onNavigate?.('clients')} title="Перейти к клиентам">
          <div className="kpi-label">Клиентов всего</div>
          <div className="kpi-val">{kpi.total_clients}</div>
          <div className="kpi-delta">База клиентов →</div>
        </div>
      </div>

      <div className="chart-row">
        <div className="crm-box">
          <div className="crm-box-title">Заказы · эта неделя · <span style={{ color: 'var(--silver)' }}>нажмите на день</span></div>
          <div className="bars">
            {data.week_chart.map((d, i) => {
              const pct = Math.round((d.count / maxCount) * 100);
              const isSelected = selectedChartDate === d.date || (!selectedChartDate && d.isToday);
              return (
                <div key={i} className="bar-col" onClick={() => handleBarClick(d)} style={{ cursor: 'pointer' }}>
                  <div
                    className={`bar-fill ${d.isToday ? 'today' : ''} ${isSelected ? 'bar-selected' : ''}`}
                    style={{ height: `${Math.max(pct, 3)}%` }}
                    title={`${d.label}: ${d.count} заказ${d.count === 1 ? '' : d.count >= 2 && d.count <= 4 ? 'а' : 'ов'}`}
                  />
                  <div className="bar-lbl" style={isSelected ? { color: 'var(--red)' } : {}}>
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
          <div className="crm-table-title">
            Заказы · {selectedDayLabel}
            {chartDayLoading && <span style={{ fontSize: '0.7rem', color: 'var(--gray)', marginLeft: '0.5rem' }}>загрузка...</span>}
          </div>
          {selectedChartDate && (
            <button
              className="f-btn"
              onClick={() => { setSelectedChartDate(null); setChartDayOrders(null); }}
            >
              ✕ Сброс
            </button>
          )}
        </div>

        {/* Desktop table */}
        <div className="dash-table-desktop">
          <table>
            <thead>
              <tr><th>#</th><th>Клиент</th><th>Авто</th><th>Услуга</th><th>Тип</th><th>Время</th><th>Статус</th><th>Действия</th></tr>
            </thead>
            <tbody>
              {chartDayLoading ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--gray)', padding: '2rem' }}>Загрузка...</td></tr>
              ) : displayOrders.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--gray)', padding: '2rem' }}>Заказов нет</td></tr>
              ) : displayOrders.map(o => (
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

        {/* Mobile cards */}
        <div className="dash-cards-mobile">
          {chartDayLoading ? (
            <div className="loading" style={{ margin: '1.5rem 0' }} />
          ) : displayOrders.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--gray)', padding: '2rem 0' }}>Заказов нет</div>
          ) : displayOrders.map(o => (
            <div key={o.id} className={`ocard ocard-${o.status}`}>
              <div className="ocard-header">
                <div className="ocard-header-left">
                  <span className="ocard-num">{o.order_number}</span>
                  <span className={`badge ${STATUS_BADGE[o.status] || 'badge-new'}`}>{STATUS_LABEL[o.status] || o.status}</span>
                </div>
                <span className="ocard-time">{o.time_slot}</span>
              </div>
              <div className="ocard-client">
                <div className="ocard-client-info">
                  <span className="ocard-client-name">{o.client_name}</span>
                  <span className="ocard-client-car">{o.client_car}{o.service_name ? ' · ' + o.service_name : ''}</span>
                </div>
              </div>
              <div className="ocard-actions">
                {o.status === 'new' && (
                  <>
                    <button className="ocard-btn ocard-btn-ok" onClick={() => handleOrderAction(o.id, 'confirmed')}>✓ Принять</button>
                    <button className="ocard-btn ocard-btn-danger" onClick={() => handleOrderAction(o.id, 'rejected')}>✕ Отклонить</button>
                  </>
                )}
                {o.status === 'confirmed' && (
                  <button className="ocard-btn ocard-btn-ok" onClick={() => handleOrderAction(o.id, 'wip')}>▶ В работу</button>
                )}
                {o.status === 'wip' && (
                  <button className="ocard-btn ocard-btn-check" onClick={() => handleOrderAction(o.id, 'checklist')}>✓ Проверка</button>
                )}
                {o.status === 'done' && (
                  <span className="ocard-done">✓ Выполнен</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
