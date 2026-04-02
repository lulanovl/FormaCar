import { useState, useEffect, useRef } from 'react';
import { getOrders, updateOrderStatus } from '../../api/index.js';
import { formatDate, STATUS_LABEL, STATUS_BADGE } from '../../utils/format.js';
import { toastSuccess, toastError } from '../../components/toast.js';

const FILTERS = [
  { key: 'all', label: 'Все' },
  { key: 'new', label: 'Новые' },
  { key: 'confirmed', label: 'Принятые' },
  { key: 'wip', label: 'В работе' },
  { key: 'done', label: 'Готово' },
];

function ending(n) {
  if (n % 100 >= 11 && n % 100 <= 14) return 'ов';
  const r = n % 10;
  if (r === 1) return '';
  if (r >= 2 && r <= 4) return 'а';
  return 'ов';
}

function toWA(phone) {
  const digits = phone.replace(/\D/g, '');
  return `https://wa.me/${digits}`;
}

export default function Orders({ isActive, refreshKey, onNewOrder, onOpenChecklist }) {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const searchTimer = useRef(null);

  useEffect(() => {
    loadOrders();
  }, [filter, refreshKey]);

  async function loadOrders() {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (filter !== 'all') params.status = filter;
      if (search) params.search = search;
      const data = await getOrders(params);
      setOrders(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleSearchChange(e) {
    setSearch(e.target.value);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => loadOrders(), 300);
  }

  async function handleAction(orderId, action) {
    if (action === 'checklist') {
      onOpenChecklist(orderId);
      return;
    }
    try {
      await updateOrderStatus(orderId, action);
      toastSuccess('Статус обновлён');
      loadOrders();
    } catch (err) {
      toastError(err.message);
    }
  }

  function toggleExpand(id) {
    setExpandedId(prev => (prev === id ? null : id));
  }

  return (
    <>
      <div className="crm-page-title">
        ВСЕ ЗАКАЗЫ
        <button className="btn-primary" onClick={onNewOrder} style={{ clipPath: 'none', fontFamily: "'Rajdhani',sans-serif", fontSize: '0.75rem', padding: '0.6rem 1.2rem' }}>
          + Новый заказ
        </button>
      </div>
      <div className="crm-table-wrap">
        <div className="crm-table-header">
          <div className="crm-table-title">
            {loading ? 'Загрузка...' : `Список · ${orders.length} заказ${ending(orders.length)}`}
          </div>
          <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              className="search-input"
              placeholder="Поиск клиента / номера..."
              value={search}
              onChange={handleSearchChange}
            />
            <div className="filters">
              {FILTERS.map(f => (
                <button
                  key={f.key}
                  className={`f-btn ${filter === f.key ? 'on' : ''}`}
                  onClick={() => setFilter(f.key)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="loading" />
        ) : error ? (
          <div style={{ padding: '2rem', color: 'var(--gray)' }}>Ошибка: {error}</div>
        ) : orders.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--gray)' }}>Заказов не найдено</div>
        ) : (
          <div className="order-cards">
            {orders.map(o => {
              const total = (o.price_snapshot || 0) + (o.extras_price || 0);
              const isOpen = expandedId === o.id;
              return (
                <div key={o.id} className={`order-card ${isOpen ? 'open' : ''}`}>
                  {/* ── Collapsed row ── */}
                  <div className="oc-row" onClick={() => toggleExpand(o.id)}>
                    <div className="oc-meta">
                      <span className="td-num">{o.order_number}</span>
                      <span className={`badge ${STATUS_BADGE[o.status] || 'badge-new'}`}>
                        {STATUS_LABEL[o.status] || o.status}
                      </span>
                    </div>
                    <div className="oc-main">
                      <span className="oc-name">{o.client_name}</span>
                      <span className="oc-car">{o.client_car}</span>
                    </div>
                    <div className="oc-right" onClick={e => e.stopPropagation()}>
                      <a
                        href={toWA(o.client_phone)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="oc-wa"
                        title="Открыть в WhatsApp"
                      >
                        <svg viewBox="0 0 24 24" fill="currentColor" className="oc-wa-icon">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                        {o.client_phone}
                      </a>
                      <div className="oc-actions">
                        {o.status === 'new' && (
                          <>
                            <button className="act-btn ok" onClick={() => handleAction(o.id, 'confirmed')}>Принять</button>
                            <button className="act-btn danger" onClick={() => handleAction(o.id, 'rejected')}>Отклонить</button>
                          </>
                        )}
                        {o.status === 'confirmed' && (
                          <button className="act-btn ok" onClick={() => handleAction(o.id, 'wip')}>В работу</button>
                        )}
                        {o.status === 'wip' && (
                          <button className="act-btn checklist" onClick={() => handleAction(o.id, 'checklist')}>✓ Проверка</button>
                        )}
                        {o.status === 'done' && (
                          <span style={{ color: '#4caf7d', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>✓ Готово</span>
                        )}
                      </div>
                    </div>
                    <button className="oc-toggle">{isOpen ? '▲' : '▼'}</button>
                  </div>

                  {/* ── Expanded details ── */}
                  {isOpen && (
                    <div className="oc-details">
                      <div className="ocd-row"><span>Услуга</span><span>{o.service_name}</span></div>
                      <div className="ocd-row"><span>Тип кузова</span><span>{o.car_type_name || '—'}</span></div>
                      <div className="ocd-row"><span>Дата и время</span><span>{formatDate(o.date)}, {o.time_slot}</span></div>
                      <div className="ocd-row">
                        <span>Сумма</span>
                        <span className="td-price">{total ? total.toLocaleString('ru-RU') + ' сом' : '—'}</span>
                      </div>
                      {o.note && <div className="ocd-row"><span>Комментарий</span><span>{o.note}</span></div>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
