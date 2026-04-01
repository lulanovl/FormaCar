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

export default function Orders({ isActive, refreshKey, onNewOrder, onOpenChecklist }) {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
          <table>
            <thead>
              <tr>
                <th>#</th><th>Клиент</th><th>Телефон</th><th>Авто</th>
                <th>Услуга</th><th>Тип</th><th>Дата</th><th>Время</th>
                <th>Статус</th><th>Сумма</th><th>Действие</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => {
                const total = (o.price_snapshot || 0) + (o.extras_price || 0);
                return (
                  <tr key={o.id}>
                    <td className="td-num">{o.order_number}</td>
                    <td>{o.client_name}</td>
                    <td style={{ color: 'var(--gray)' }}>{o.client_phone}</td>
                    <td>{o.client_car}</td>
                    <td>{o.service_name}</td>
                    <td style={{ color: 'var(--gray)' }}>{o.car_type_name || '—'}</td>
                    <td>{formatDate(o.date)}</td>
                    <td>{o.time_slot}</td>
                    <td><span className={`badge ${STATUS_BADGE[o.status] || 'badge-new'}`}>{STATUS_LABEL[o.status] || o.status}</span></td>
                    <td className="td-price">{total ? total.toLocaleString('ru-RU') : '—'}</td>
                    <td>
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
                        <span style={{ color: '#4caf7d', fontSize: '0.8rem' }}>✓ Готово</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
