import { useState, useEffect, useRef } from 'react';
import { getClients, getClient } from '../../api/index.js';
import { formatDate } from '../../utils/format.js';

function ending(n) {
  if (n % 100 >= 11 && n % 100 <= 14) return 'ов';
  const r = n % 10;
  if (r === 1) return '';
  if (r >= 2 && r <= 4) return 'а';
  return 'ов';
}

function toWA(phone) {
  return `https://wa.me/${phone.replace(/\D/g, '')}`;
}

export default function Clients({ isActive }) {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const searchTimer = useRef(null);

  const [historyModal, setHistoryModal] = useState(null);

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

      <div className="orders-toolbar" style={{ marginBottom: '0.75rem' }}>
        <input
          className="search-input"
          style={{ flex: 1, minWidth: 0, width: 'auto' }}
          placeholder="Поиск по имени / телефону / номеру машины..."
          value={search}
          onChange={handleSearchChange}
        />
      </div>

      <div className="orders-count">
        {loading ? 'Загрузка...' : `${clients.length} клиент${ending(clients.length)}`}
      </div>

      {loading ? (
        <div className="loading" />
      ) : error ? (
        <div style={{ padding: '2rem', color: 'var(--gray)' }}>Ошибка: {error}</div>
      ) : clients.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--gray)' }}>Клиентов не найдено</div>
      ) : (
        <div className="ocard-list">
          {clients.map(c => (
            <div key={c.id} className="client-card" onClick={() => showHistory(c.id)}>
              {/* Top row: name + visits */}
              <div className="client-card-header">
                <div className="client-card-header-left">
                  <span className="client-card-name">{c.name}</span>
                  <span className="badge badge-done">{c.total_visits} визит{ending(c.total_visits)}</span>
                </div>
                <span className="client-card-date">{formatDate(c.last_visit)}</span>
              </div>

              {/* Second row: phone + car */}
              <div className="client-card-body">
                <a
                  href={toWA(c.phone)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="client-card-phone"
                  onClick={e => e.stopPropagation()}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  {c.phone}
                </a>
                <span className="client-card-car">{c.car || '—'}</span>
                {c.plate_number && (
                  <span className="client-card-plate">{c.plate_number}</span>
                )}
              </div>

              <div className="client-card-footer">
                <button
                  className="ocard-btn ocard-btn-ok"
                  onClick={e => { e.stopPropagation(); showHistory(c.id); }}
                >
                  История визитов →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Client history modal */}
      {historyModal && (
        <div className="modal-bg open" onClick={(e) => e.target === e.currentTarget && setHistoryModal(null)}>
          <div className="modal-box">
            <button className="modal-x" onClick={() => setHistoryModal(null)}>×</button>
            <div className="modal-title">{historyModal.loading ? '...' : historyModal.name}</div>
            <div className="modal-sub">
              {historyModal.loading ? '' : `${historyModal.phone} · ${historyModal.total_visits} визит${ending(historyModal.total_visits || 0)}`}
            </div>
            <div id="order-modal-form">
              {historyModal.loading ? (
                <div className="loading" />
              ) : historyModal.error ? (
                <div style={{ color: 'var(--gray)' }}>{historyModal.error}</div>
              ) : (
                <div className="client-history-list">
                  {historyModal.orders?.length === 0 ? (
                    <div style={{ color: 'var(--gray)', textAlign: 'center', padding: '1.5rem 0' }}>Заказов нет</div>
                  ) : historyModal.orders?.map(o => (
                    <div key={o.id} className="client-history-item">
                      <div className="client-history-top">
                        <span className="td-num">{o.order_number}</span>
                        <span style={{ fontSize: '0.82rem', color: 'var(--silver)' }}>{formatDate(o.date)} {o.time_slot}</span>
                      </div>
                      <div className="client-history-bot">
                        <span style={{ fontSize: '0.83rem' }}>
                          {o.service_name}{o.car_type_name ? ' · ' + o.car_type_name : ''}
                          {o.extras_price > 0 && (
                            <span style={{ color: 'var(--gray)', fontSize: '0.75rem', display: 'block', marginTop: '0.15rem' }}>
                              {o.price_snapshot ? o.price_snapshot.toLocaleString('ru-RU') + ' + ' : ''}
                              доп. {o.extras_price.toLocaleString('ru-RU')} сом
                            </span>
                          )}
                        </span>
                        {(() => {
                          const total = (o.price_snapshot || 0) + (o.extras_price || 0);
                          return total ? (
                            <span className="td-price">{total.toLocaleString('ru-RU')}</span>
                          ) : <span style={{ color: 'var(--gray)' }}>—</span>;
                        })()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
