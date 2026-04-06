import { useState, useEffect, useRef } from 'react';
import { getOrders, updateOrderStatus, updateOrderPrice, updateOrderPlate } from '../../api/index.js';
import { formatDate, STATUS_LABEL, STATUS_BADGE } from '../../utils/format.js';
import { toastSuccess, toastError } from '../../components/toast.js';

const FILTERS = [
  { key: 'all',       label: 'Все' },
  { key: 'new',       label: 'Новые' },
  { key: 'confirmed', label: 'Принятые' },
  { key: 'wip',       label: 'В работе' },
  { key: 'done',      label: 'Готово' },
];

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

function OrderCard({ o, onAction, onUpdatePrice, onUpdatePlate, isOpen, onToggle, highlighted }) {
  const calculated = (o.price_snapshot || 0) + (o.extras_price || 0);
  const total = o.final_price != null ? o.final_price : calculated;
  const hasDiscount = o.final_price != null && o.final_price !== calculated;

  const [editingPrice, setEditingPrice] = useState(false);
  const [priceInput, setPriceInput] = useState('');
  const [savingPrice, setSavingPrice] = useState(false);

  function startEdit(e) {
    e.stopPropagation();
    setPriceInput(String(total));
    setEditingPrice(true);
  }

  async function savePrice(e) {
    e.stopPropagation();
    setSavingPrice(true);
    await onUpdatePrice(o.id, priceInput);
    setSavingPrice(false);
    setEditingPrice(false);
  }

  function cancelEdit(e) {
    e.stopPropagation();
    setEditingPrice(false);
  }

  async function resetPrice(e) {
    e.stopPropagation();
    setSavingPrice(true);
    await onUpdatePrice(o.id, null);
    setSavingPrice(false);
  }

  const [editingPlate, setEditingPlate] = useState(false);
  const [plateInput, setPlateInput] = useState('');
  const [savingPlate, setSavingPlate] = useState(false);

  function startEditPlate(e) {
    e.stopPropagation();
    setPlateInput(o.plate_number || '');
    setEditingPlate(true);
  }

  async function savePlate(e) {
    e.stopPropagation();
    setSavingPlate(true);
    await onUpdatePlate(o.id, plateInput);
    setSavingPlate(false);
    setEditingPlate(false);
  }

  function cancelEditPlate(e) {
    e.stopPropagation();
    setEditingPlate(false);
  }

  return (
    <div id={`ocard-${o.id}`} className={`ocard ${isOpen ? 'ocard-open' : ''} ocard-${o.status}${highlighted ? ' ocard-highlighted' : ''}`} onClick={onToggle} style={{ cursor: 'pointer' }}>
      {/* Top row: number + status + date/time */}
      <div className="ocard-header">
        <div className="ocard-header-left">
          <span className="ocard-num">{o.order_number}</span>
          <span className={`badge ${STATUS_BADGE[o.status] || 'badge-new'}`}>
            {STATUS_LABEL[o.status] || o.status}
          </span>
        </div>
        <div className="ocard-header-right">
          <span className="ocard-date">{formatDate(o.date)}</span>
          <span className="ocard-time">{o.time_slot}</span>
          <span className="ocard-chevron">{isOpen ? '▲' : '▼'}</span>
        </div>
      </div>

      {/* Client row */}
      <div className="ocard-client">
        <div className="ocard-client-info">
          <span className="ocard-client-name">{o.client_name}</span>
          <span className="ocard-client-car">{o.client_car}</span>
        </div>
        <a
          href={toWA(o.client_phone)}
          target="_blank"
          rel="noopener noreferrer"
          className="ocard-wa"
          onClick={e => e.stopPropagation()}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          {o.client_phone}
        </a>
      </div>

      {/* Action buttons — always visible */}
      <div className="ocard-actions" onClick={e => e.stopPropagation()}>
        {o.status === 'new' && (
          <>
            <button className="ocard-btn ocard-btn-ok" onClick={() => onAction(o.id, 'confirmed')}>✓ Принять</button>
            <button className="ocard-btn ocard-btn-danger" onClick={() => onAction(o.id, 'rejected')}>✕ Отклонить</button>
          </>
        )}
        {o.status === 'confirmed' && (
          <button className="ocard-btn ocard-btn-ok" onClick={() => onAction(o.id, 'wip')}>▶ В работу</button>
        )}
        {o.status === 'wip' && (
          <button className="ocard-btn ocard-btn-check" onClick={() => onAction(o.id, 'checklist')}>✓ Чеклист</button>
        )}
        {o.status === 'done' && (
          <span className="ocard-done">✓ Выполнен</span>
        )}
        {o.status === 'rejected' && (
          <span className="ocard-rejected">✕ Отклонён</span>
        )}
      </div>

      {/* Expanded details */}
      {isOpen && (
        <div className="ocard-details">
          <div className="ocd-grid">
            {/* Left col: Услуга */}
            <div className="ocd-item"><span className="ocd-label">Услуга</span><span className="ocd-val">{o.service_name}</span></div>
            {/* Right col: Гос. номер */}
            <div className="ocd-item">
              <span className="ocd-label">Гос. номер</span>
              {editingPlate ? (
                <span className="ocd-inline-edit" onClick={e => e.stopPropagation()}>
                  <input
                    className="ocd-inline-input"
                    type="text"
                    value={plateInput}
                    onChange={e => setPlateInput(e.target.value.toUpperCase())}
                    autoFocus
                  />
                  <button className="ocd-inline-btn ocd-inline-save" onClick={savePlate} disabled={savingPlate}>OK</button>
                  <button className="ocd-inline-btn" onClick={cancelEditPlate}>—</button>
                </span>
              ) : (
                <span className="ocd-val ocd-editable-val">
                  <span className="ocd-plate-text">{o.plate_number || '—'}</span>
                  <button className="ocd-inline-edit-btn" onClick={startEditPlate} title="Изменить номер">
                    <svg viewBox="0 0 16 16" fill="none" width="13" height="13"><path d="M11.5 2.5l2 2-8 8H3.5v-2l8-8z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/></svg>
                  </button>
                </span>
              )}
            </div>
            {/* Left col: Тип кузова */}
            <div className="ocd-item"><span className="ocd-label">Тип кузова</span><span className="ocd-val">{o.car_type_name || '—'}</span></div>
            {/* Right col: Сумма */}
            <div className="ocd-item">
              <span className="ocd-label">
                Сумма
                {hasDiscount && <span className="ocd-discount-tag">скидка</span>}
              </span>
              {editingPrice ? (
                <span className="ocd-inline-edit" onClick={e => e.stopPropagation()}>
                  <input
                    className="ocd-inline-input ocd-inline-input-price"
                    type="number"
                    min="0"
                    value={priceInput}
                    onChange={e => setPriceInput(e.target.value)}
                    autoFocus
                  />
                  <span className="ocd-price-unit">сом</span>
                  <button className="ocd-inline-btn ocd-inline-save" onClick={savePrice} disabled={savingPrice}>OK</button>
                  <button className="ocd-inline-btn" onClick={cancelEdit}>—</button>
                </span>
              ) : (
                <span className="ocd-val ocd-price ocd-editable-val">
                  {total ? total.toLocaleString('ru-RU') + ' сом' : '—'}
                  {hasDiscount && calculated > 0 && (
                    <span className="ocd-original-price">{calculated.toLocaleString('ru-RU')} сом</span>
                  )}
                  <button className="ocd-inline-edit-btn" onClick={startEdit} title="Изменить сумму">
                    <svg viewBox="0 0 16 16" fill="none" width="13" height="13"><path d="M11.5 2.5l2 2-8 8H3.5v-2l8-8z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/></svg>
                  </button>
                  {hasDiscount && (
                    <button className="ocd-inline-edit-btn ocd-reset-btn" onClick={resetPrice} title="Сбросить к расчётной сумме" disabled={savingPrice}>
                      <svg viewBox="0 0 16 16" fill="none" width="13" height="13"><path d="M3 8a5 5 0 1 0 1.5-3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><path d="M3 4.5V8h3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                  )}
                </span>
              )}
            </div>
            {o.note && <div className="ocd-item ocd-item-full"><span className="ocd-label">Комментарий</span><span className="ocd-val">{o.note}</span></div>}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Orders({ isActive, refreshKey, onRefresh, onNewOrder, onOpenChecklist, initialFilter, initialOrderId }) {
  const [filter, setFilter] = useState(initialFilter || 'all');
  const [search, setSearch] = useState('');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [highlightedId, setHighlightedId] = useState(null);
  const searchTimer = useRef(null);

  // Apply initialFilter when it changes from outside (Dashboard navigation)
  useEffect(() => {
    if (initialFilter) setFilter(initialFilter);
  }, [initialFilter]);

  // Scroll to and highlight a specific order (from Calendar navigation)
  useEffect(() => {
    if (!initialOrderId || loading) return;
    setExpandedId(initialOrderId);
    setHighlightedId(initialOrderId);
    setTimeout(() => {
      document.getElementById(`ocard-${initialOrderId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);
    // Remove highlight after 2s
    const t = setTimeout(() => setHighlightedId(null), 2500);
    return () => clearTimeout(t);
  }, [initialOrderId, loading]);

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
    if (action === 'checklist') { onOpenChecklist(orderId); return; }
    try {
      await updateOrderStatus(orderId, action);
      toastSuccess('Статус обновлён');
      loadOrders();
    } catch (err) {
      toastError(err.message);
    }
  }

  async function handleUpdatePlate(orderId, plate_number) {
    try {
      await updateOrderPlate(orderId, plate_number || null);
      toastSuccess(plate_number ? 'Номер сохранён' : 'Номер удалён');
      loadOrders();
    } catch (err) {
      toastError(err.message);
    }
  }

  async function handleUpdatePrice(orderId, final_price) {
    try {
      await updateOrderPrice(orderId, final_price === null ? null : parseInt(final_price));
      toastSuccess(final_price === null ? 'Сумма сброшена' : 'Сумма обновлена');
      loadOrders();
      onRefresh?.();
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

      {/* Toolbar */}
      <div className="orders-toolbar">
        <input
          className="search-input"
          style={{ flex: 1, minWidth: 0, width: 'auto' }}
          placeholder="Поиск клиента / номера..."
          value={search}
          onChange={handleSearchChange}
        />
        <div className="filters">
          {FILTERS.map(f => (
            <button key={f.key} className={`f-btn ${filter === f.key ? 'on' : ''}`} onClick={() => setFilter(f.key)}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="orders-count">
        {loading ? 'Загрузка...' : `${orders.length} заказ${ending(orders.length)}`}
      </div>

      {loading ? (
        <div className="loading" />
      ) : error ? (
        <div style={{ padding: '2rem', color: 'var(--gray)' }}>Ошибка: {error}</div>
      ) : orders.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--gray)' }}>Заказов не найдено</div>
      ) : (
        <div className="ocard-list">
          {orders.map(o => (
            <OrderCard
              key={o.id}
              o={o}
              onAction={handleAction}
              onUpdatePrice={handleUpdatePrice}
              onUpdatePlate={handleUpdatePlate}
              isOpen={expandedId === o.id}
              onToggle={() => setExpandedId(prev => prev === o.id ? null : o.id)}
              highlighted={highlightedId === o.id}
            />
          ))}
        </div>
      )}
    </>
  );
}
