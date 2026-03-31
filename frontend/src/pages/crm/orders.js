import { getOrders, updateOrderStatus } from '../../api/index.js';
import { formatDate, STATUS_LABEL, STATUS_BADGE } from '../../utils/format.js';
import { toastSuccess, toastError } from '../../components/toast.js';

let currentFilter = 'all';
let searchQuery = '';

export async function renderOrders() {
  const el = document.getElementById('p-orders');
  if (!el) return;
  el.innerHTML = `
    <div class="crm-page-title">
      ВСЕ ЗАКАЗЫ
      <button class="btn-primary" id="btn-new-order-2" style="clip-path:none;font-family:'Rajdhani',sans-serif;font-size:0.75rem;padding:0.6rem 1.2rem">+ Новый заказ</button>
    </div>
    <div class="crm-table-wrap">
      <div class="crm-table-header">
        <div class="crm-table-title" id="orders-count-title">Загрузка...</div>
        <div style="display:flex;gap:0.8rem;align-items:center;flex-wrap:wrap">
          <input class="search-input" id="orders-search" placeholder="Поиск клиента / номера..." value="${searchQuery}">
          <div class="filters" id="orders-filters">
            <button class="f-btn ${currentFilter === 'all'       ? 'on' : ''}" data-filter="all">Все</button>
            <button class="f-btn ${currentFilter === 'new'       ? 'on' : ''}" data-filter="new">Новые</button>
            <button class="f-btn ${currentFilter === 'confirmed' ? 'on' : ''}" data-filter="confirmed">Принятые</button>
            <button class="f-btn ${currentFilter === 'wip'       ? 'on' : ''}" data-filter="wip">В работе</button>
            <button class="f-btn ${currentFilter === 'done'      ? 'on' : ''}" data-filter="done">Готово</button>
          </div>
        </div>
      </div>
      <div id="orders-table-body"><div class="loading"></div></div>
    </div>`;

  document.getElementById('btn-new-order-2')?.addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('crm:new-order'));
  });

  document.getElementById('orders-filters')?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-filter]');
    if (!btn) return;
    currentFilter = btn.dataset.filter;
    loadOrders();
  });

  let searchTimer;
  document.getElementById('orders-search')?.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    clearTimeout(searchTimer);
    searchTimer = setTimeout(loadOrders, 300);
  });

  await loadOrders();
}

async function loadOrders() {
  const body = document.getElementById('orders-table-body');
  if (!body) return;
  body.innerHTML = '<div class="loading"></div>';

  // Sync filter buttons
  document.querySelectorAll('#orders-filters .f-btn').forEach(b => {
    b.classList.toggle('on', b.dataset.filter === currentFilter);
  });

  try {
    const params = {};
    if (currentFilter !== 'all') params.status = currentFilter;
    if (searchQuery) params.search = searchQuery;
    const orders = await getOrders(params);

    document.getElementById('orders-count-title').textContent =
      `Список · ${orders.length} заказ${ending(orders.length)}`;

    if (!orders.length) {
      body.innerHTML = '<div style="padding:2rem;text-align:center;color:var(--gray)">Заказов не найдено</div>';
      return;
    }

    body.innerHTML = `
      <table>
        <thead><tr>
          <th>#</th><th>Клиент</th><th>Телефон</th><th>Авто</th>
          <th>Услуга</th><th>Тип</th><th>Дата</th><th>Время</th>
          <th>Статус</th><th>Сумма</th><th>Действие</th>
        </tr></thead>
        <tbody>${orders.map(buildRow).join('')}</tbody>
      </table>`;

    body.addEventListener('click', handleAction);
  } catch (err) {
    body.innerHTML = `<div style="padding:2rem;color:var(--gray)">Ошибка: ${err.message}</div>`;
  }
}

function buildRow(o) {
  const total = (o.price_snapshot || 0) + (o.extras_price || 0);
  return `<tr>
    <td class="td-num">${o.order_number}</td>
    <td>${o.client_name}</td>
    <td style="color:var(--gray)">${o.client_phone}</td>
    <td>${o.client_car}</td>
    <td>${o.service_name}</td>
    <td style="color:var(--gray)">${o.car_type_name || '—'}</td>
    <td>${formatDate(o.date)}</td>
    <td>${o.time_slot}</td>
    <td><span class="badge ${STATUS_BADGE[o.status] || 'badge-new'}">${STATUS_LABEL[o.status] || o.status}</span></td>
    <td class="td-price">${total ? total.toLocaleString('ru-RU') : '—'}</td>
    <td>${buildActions(o)}</td>
  </tr>`;
}

function buildActions(o) {
  const a = [];
  if (o.status === 'new')       { a.push(`<button class="act-btn ok" data-id="${o.id}" data-action="confirmed">Принять</button>`); a.push(`<button class="act-btn danger" data-id="${o.id}" data-action="rejected">Отклонить</button>`); }
  if (o.status === 'confirmed') a.push(`<button class="act-btn ok" data-id="${o.id}" data-action="wip">В работу</button>`);
  if (o.status === 'wip')       a.push(`<button class="act-btn checklist" data-id="${o.id}" data-action="checklist">✓ Проверка</button>`);
  if (o.status === 'done')      a.push('<span style="color:#4caf7d;font-size:0.8rem">✓ Готово</span>');
  return a.join('');
}

async function handleAction(e) {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const id = Number(btn.dataset.id);
  const action = btn.dataset.action;
  if (action === 'checklist') {
    window.dispatchEvent(new CustomEvent('crm:open-checklist', { detail: { orderId: id } }));
    return;
  }
  try {
    await updateOrderStatus(id, action);
    toastSuccess('Статус обновлён');
    loadOrders();
  } catch (err) { toastError(err.message); }
}

function ending(n) {
  if (n % 100 >= 11 && n % 100 <= 14) return 'ов';
  const r = n % 10;
  if (r === 1) return '';
  if (r >= 2 && r <= 4) return 'а';
  return 'ов';
}
