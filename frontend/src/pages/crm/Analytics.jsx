import { useState, useEffect } from 'react';
import { getAnalytics } from '../../api/index.js';

const STATUS_LABEL = {
  new: 'Новые', confirmed: 'Принятые', wip: 'В работе',
  done: 'Выполнены', rejected: 'Отклонённые', no_show: 'Не пришли',
};
const STATUS_COLOR = {
  new: '#d42b2b', confirmed: '#e89f3c', wip: '#4c9be8',
  done: '#4caf7d', rejected: '#666', no_show: '#666',
};

function ending(n) {
  if (n % 100 >= 11 && n % 100 <= 14) return 'ов';
  const r = n % 10;
  if (r === 1) return '';
  if (r >= 2 && r <= 4) return 'а';
  return 'ов';
}

export default function Analytics() {
  const now = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data,  setData]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => { load(); }, [year, month]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const d = await getAnalytics({ year, month });
      setData(d);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function prevMonth() {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;
    if (isCurrentMonth) return;
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  }

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;

  const maxRevenue = data ? Math.max(...data.daily_revenue.map(d => d.revenue), 1) : 1;
  const maxSvcCount = data ? Math.max(...data.by_service.map(s => s.count), 1) : 1;
  const totalStatusCount = data ? data.by_status.reduce((s, x) => s + x.count, 0) : 0;

  return (
    <>
      <div className="crm-page-title">АНАЛИТИКА</div>

      {/* Period selector */}
      <div className="an-period">
        <button className="an-period-btn" onClick={prevMonth}>‹</button>
        <span className="an-period-label">{data ? data.period_label : '...'}</span>
        <button className="an-period-btn" onClick={nextMonth} disabled={isCurrentMonth} style={{ opacity: isCurrentMonth ? 0.3 : 1 }}>›</button>
      </div>

      {loading ? (
        <div className="loading" />
      ) : error ? (
        <div style={{ padding: '2rem', color: 'var(--gray)' }}>Ошибка: {error}</div>
      ) : (
        <>
          {/* KPI row */}
          <div className="kpi-row">
            <div className="kpi">
              <div className="kpi-label">Выручка за месяц</div>
              <div className="kpi-val" style={{ fontSize: '1.5rem' }}>
                {data.total_revenue ? data.total_revenue.toLocaleString('ru-RU') + ' сом' : '—'}
              </div>
              <div className="kpi-delta">{data.done_orders} выполнен{ending(data.done_orders)}</div>
            </div>
            <div className="kpi">
              <div className="kpi-label">Всего заказов</div>
              <div className="kpi-val">{data.total_orders}</div>
              <div className="kpi-delta">за {data.period_label.split(' ')[0].toLowerCase()}</div>
            </div>
            <div className="kpi">
              <div className="kpi-label">Средний чек</div>
              <div className="kpi-val" style={{ fontSize: '1.5rem' }}>
                {data.avg_check ? data.avg_check.toLocaleString('ru-RU') + ' сом' : '—'}
              </div>
              <div className="kpi-delta">по выполненным</div>
            </div>
            <div className="kpi">
              <div className="kpi-label">Конверсия</div>
              <div className="kpi-val">{data.conversion}%</div>
              <div className={`kpi-delta ${data.conversion < 50 ? 'neg' : ''}`}>
                {data.conversion >= 80 ? 'Отлично' : data.conversion >= 50 ? 'Хорошо' : 'Низкая'}
              </div>
            </div>
          </div>

          {/* Revenue by day chart */}
          <div className="crm-box" style={{ marginBottom: '1rem' }}>
            <div className="crm-box-title">Выручка по дням · {data.period_label}</div>
            {data.total_revenue === 0 ? (
              <div style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--gray)', fontSize: '0.82rem' }}>
                Нет выполненных заказов в этом периоде
              </div>
            ) : (
              <div className="an-day-bars">
                {data.daily_revenue.map(d => (
                  <div
                    key={d.date}
                    className="an-bar-col"
                    title={d.revenue ? `${d.day} — ${d.revenue.toLocaleString('ru-RU')} сом (${d.count} заказ${ending(d.count)})` : `${d.day} — нет выручки`}
                  >
                    <div
                      className="an-bar-fill"
                      style={{ height: `${d.revenue > 0 ? Math.max((d.revenue / maxRevenue) * 100, 4) : 0}%` }}
                    />
                    <div className="an-bar-lbl">
                      {(d.day === 1 || d.day % 5 === 0) ? d.day : ''}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Services + Status */}
          <div className="chart-row">
            {/* Top services */}
            <div className="crm-box">
              <div className="crm-box-title">Услуги</div>
              {data.by_service.length === 0 ? (
                <div style={{ color: 'var(--gray)', padding: '1rem 0', fontSize: '0.82rem' }}>Нет данных</div>
              ) : (
                <div className="an-svc-list">
                  {data.by_service.map(s => (
                    <div key={s.service_name} className="an-svc-row">
                      <div className="an-svc-top">
                        <span className="an-svc-name">{s.service_name}</span>
                        <span className="an-svc-rev">
                          {s.revenue ? s.revenue.toLocaleString('ru-RU') + ' сом' : '—'}
                        </span>
                      </div>
                      <div className="an-svc-bar-wrap">
                        <div
                          className="an-svc-bar"
                          style={{ width: `${(s.count / maxSvcCount) * 100}%` }}
                        />
                      </div>
                      <div className="an-svc-meta">{s.count} заказ{ending(s.count)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Status breakdown */}
            <div className="crm-box">
              <div className="crm-box-title">По статусам</div>
              {data.by_status.length === 0 ? (
                <div style={{ color: 'var(--gray)', padding: '1rem 0', fontSize: '0.82rem' }}>Нет данных</div>
              ) : (
                <div className="an-status-list">
                  {data.by_status.map(s => {
                    const pct = totalStatusCount > 0 ? Math.round((s.count / totalStatusCount) * 100) : 0;
                    return (
                      <div key={s.status} className="an-status-row">
                        <div className="an-status-left">
                          <span className="an-status-dot" style={{ color: STATUS_COLOR[s.status] || '#888' }}>●</span>
                          <span className="an-status-name">{STATUS_LABEL[s.status] || s.status}</span>
                        </div>
                        <div className="an-status-right">
                          <div className="an-status-bar-wrap">
                            <div className="an-status-bar" style={{ width: `${pct}%`, background: STATUS_COLOR[s.status] || '#888' }} />
                          </div>
                          <span className="an-status-count" style={{ color: STATUS_COLOR[s.status] || '#888' }}>{s.count}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
