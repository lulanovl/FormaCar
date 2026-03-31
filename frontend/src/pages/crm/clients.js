import { getClients, getClient } from '../../api/index.js';
import { formatDate } from '../../utils/format.js';

export async function renderClients() {
  const el = document.getElementById('p-clients');
  if (!el) return;
  el.innerHTML = `
    <div class="crm-page-title">КЛИЕНТЫ</div>
    <div class="crm-table-wrap">
      <div class="crm-table-header">
        <div class="crm-table-title" id="clients-count">Загрузка...</div>
        <input class="search-input" id="clients-search" placeholder="Поиск по имени / телефону...">
      </div>
      <div id="clients-body"><div class="loading"></div></div>
    </div>`;

  let timer;
  document.getElementById('clients-search')?.addEventListener('input', (e) => {
    clearTimeout(timer);
    timer = setTimeout(() => loadClients(e.target.value), 300);
  });

  await loadClients('');
}

async function loadClients(search) {
  const body = document.getElementById('clients-body');
  if (!body) return;
  body.innerHTML = '<div class="loading"></div>';
  try {
    const clients = await getClients(search ? { search } : {});
    document.getElementById('clients-count').textContent = `База клиентов · ${clients.length}`;
    if (!clients.length) {
      body.innerHTML = '<div style="padding:2rem;text-align:center;color:var(--gray)">Клиентов не найдено</div>';
      return;
    }
    body.innerHTML = `
      <table>
        <thead><tr><th>Клиент</th><th>Телефон</th><th>Автомобиль</th><th>Визитов</th><th>Последний визит</th><th></th></tr></thead>
        <tbody>${clients.map(c => `
          <tr>
            <td style="font-weight:500">${c.name}</td>
            <td style="color:var(--gray)">${c.phone}</td>
            <td>${c.car || '—'}</td>
            <td><span class="badge badge-done">${c.total_visits}</span></td>
            <td>${formatDate(c.last_visit)}</td>
            <td><button class="act-btn" data-client-id="${c.id}">История</button></td>
          </tr>`).join('')}
        </tbody>
      </table>`;

    body.addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-client-id]');
      if (!btn) return;
      showClientHistory(Number(btn.dataset.clientId));
    });
  } catch (err) {
    body.innerHTML = `<div style="padding:2rem;color:var(--gray)">Ошибка: ${err.message}</div>`;
  }
}

async function showClientHistory(id) {
  const modal = document.getElementById('orderModal');
  const form = document.getElementById('order-modal-form');
  if (!modal || !form) return;

  form.innerHTML = '<div class="loading"></div>';
  modal.classList.add('open');

  try {
    const data = await getClient(id);
    const orderRows = data.orders.length
      ? data.orders.map(o => `<tr>
          <td class="td-num">${o.order_number}</td>
          <td>${formatDate(o.date)} ${o.time_slot}</td>
          <td>${o.service_name}</td>
          <td>${o.car_type_name || '—'}</td>
          <td class="td-price">${o.price_snapshot ? o.price_snapshot.toLocaleString('ru-RU') : '—'}</td>
        </tr>`).join('')
      : '<tr><td colspan="5" style="text-align:center;color:var(--gray)">Заказов нет</td></tr>';

    document.querySelector('#orderModal .modal-title').textContent = data.name;
    document.querySelector('#orderModal .modal-sub').textContent = `${data.phone} · ${data.total_visits} визитов`;
    form.innerHTML = `
      <table>
        <thead><tr><th>#</th><th>Дата</th><th>Услуга</th><th>Тип авто</th><th>Сумма</th></tr></thead>
        <tbody>${orderRows}</tbody>
      </table>`;
  } catch (err) {
    form.innerHTML = `<div style="color:var(--gray)">${err.message}</div>`;
  }
}
