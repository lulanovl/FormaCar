import { useState, useEffect, useRef } from 'react';
import { getClients, getClient } from '../../api/index.js';
import { formatDate } from '../../utils/format.js';

export default function Clients({ isActive }) {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const searchTimer = useRef(null);

  // History modal
  const [historyModal, setHistoryModal] = useState(null); // null | { loading, name, phone, total_visits, orders }

  useEffect(() => {
    loadClients('');
  }, []);

  async function loadClients(q) {
    setLoading(true);
    setError(null);
    try {
      const data = await getClients(q ? { search: q } : {});
      setClients(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleSearchChange(e) {
    setSearch(e.target.value);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => loadClients(e.target.value), 300);
  }

  async function showHistory(id) {
    setHistoryModal({ loading: true });
    try {
      const data = await getClient(id);
      setHistoryModal({ loading: false, ...data });
    } catch (err) {
      setHistoryModal({ loading: false, error: err.message });
    }
  }

  return (
    <>
      <div className="crm-page-title">КЛИЕНТЫ</div>
      <div className="crm-table-wrap">
        <div className="crm-table-header">
          <div className="crm-table-title">
            {loading ? 'Загрузка...' : `База клиентов · ${clients.length}`}
          </div>
          <input
            className="search-input"
            placeholder="Поиск по имени / телефону..."
            value={search}
            onChange={handleSearchChange}
          />
        </div>
        {loading ? (
          <div className="loading" />
        ) : error ? (
          <div style={{ padding: '2rem', color: 'var(--gray)' }}>Ошибка: {error}</div>
        ) : clients.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--gray)' }}>Клиентов не найдено</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Клиент</th><th>Телефон</th><th>Автомобиль</th>
                <th>Визитов</th><th>Последний визит</th><th></th>
              </tr>
            </thead>
            <tbody>
              {clients.map(c => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 500 }}>{c.name}</td>
                  <td>
                    <a
                      href={`https://wa.me/${c.phone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#25d366', textDecoration: 'none', fontSize: '0.83rem' }}
                    >
                      {c.phone}
                    </a>
                  </td>
                  <td>{c.car || '—'}</td>
                  <td><span className="badge badge-done">{c.total_visits}</span></td>
                  <td>{formatDate(c.last_visit)}</td>
                  <td><button className="act-btn" onClick={() => showHistory(c.id)}>История</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Client history modal */}
      {historyModal && (
        <div className="modal-bg open" onClick={(e) => e.target === e.currentTarget && setHistoryModal(null)}>
          <div className="modal-box">
            <button className="modal-x" onClick={() => setHistoryModal(null)}>×</button>
            <div className="modal-title">{historyModal.loading ? '...' : historyModal.name}</div>
            <div className="modal-sub">
              {historyModal.loading ? '' : `${historyModal.phone} · ${historyModal.total_visits} визитов`}
            </div>
            <div id="order-modal-form">
              {historyModal.loading ? (
                <div className="loading" />
              ) : historyModal.error ? (
                <div style={{ color: 'var(--gray)' }}>{historyModal.error}</div>
              ) : (
                <table>
                  <thead>
                    <tr><th>#</th><th>Дата</th><th>Услуга</th><th>Тип авто</th><th>Сумма</th></tr>
                  </thead>
                  <tbody>
                    {historyModal.orders?.length === 0 ? (
                      <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--gray)' }}>Заказов нет</td></tr>
                    ) : historyModal.orders?.map(o => (
                      <tr key={o.id}>
                        <td className="td-num">{o.order_number}</td>
                        <td>{formatDate(o.date)} {o.time_slot}</td>
                        <td>{o.service_name}</td>
                        <td>{o.car_type_name || '—'}</td>
                        <td className="td-price">{o.price_snapshot ? o.price_snapshot.toLocaleString('ru-RU') : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
