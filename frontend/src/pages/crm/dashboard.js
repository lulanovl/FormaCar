import { getDashboard, updateStaff, updateOrderStatus } from '../../api/index.js';
import { formatDate, STATUS_LABEL, STATUS_BADGE, STAFF_STATUS_LABEL, STAFF_STATUS_COLOR } from '../../utils/format.js';
import { toastSuccess, toastError } from '../../components/toast.js';

export async function renderDashboard() {
  const el = document.getElementById('p-dash');
  if (!el) return;
  el.innerHTML = '<div class="loading"></div>';

  try {
    const data = await getDashboard();
    el.innerHTML = buildDashboard(data);
    attachDashboardEvents(data);
  } catch (err) {
    el.innerHTML = `<div style="padding:2rem;color:var(--gray)">Ошибка загрузки: ${err.message}</div>`;
  }
}

function buildDashboard(data) {
  const maxCount = Math.max(...data.week_chart.map(d => d.count), 1);
  const barsHtml = data.week_chart.map(d => {
    const pct = Math.round((d.count / maxCount) * 100);
    return `<div class="bar-col">
      <div class="bar-fill ${d.isToday ? 'today' : ''}" style="height:${Math.max(pct, 3)}%" title="${d.count} заказов"></div>
      <div class="bar-lbl" style="${d.isToday ? 'color:var(--red)' : ''}">${d.label}</div>
    </div>`;
  }).join('');

  const staffHtml = data.staff.map(s => `
    <div class="staff-row">
      <div class="staff-avatar ${s.status === 'off' ? 'off' : ''}">${s.initials}</div>
      <div><div class="staff-name">${s.name}</div><div class="staff-role">${s.role}</div></div>
      <div class="staff-status" data-staff-id="${s.id}" data-status="${s.status}"
           style="color:${STAFF_STATUS_COLOR[s.status] || 'var(--gray)'}">
        ● ${STAFF_STATUS_LABEL[s.status] || s.status}
      </div>
    </div>`).join('');

  const ordersHtml = data.today_orders.length
    ? data.today_orders.map(o => `
        <tr>
          <td class="td-num">${o.order_number}</td>
          <td>${o.client_name}</td>
          <td style="color:var(--gray)">${o.client_car}</td>
          <td>${o.service_name}</td>
          <td>${o.car_type_name || '—'}</td>
          <td>${o.time_slot}</td>
          <td><span class="badge ${STATUS_BADGE[o.status] || 'badge-new'}">${STATUS_LABEL[o.status] || o.status}</span></td>
          <td>${buildOrderActions(o)}</td>
        </tr>`).join('')
    : '<tr><td colspan="8" style="text-align:center;color:var(--gray);padding:2rem">Заказов сегодня нет</td></tr>';

  const todayDate = new Date().toLocaleDateString('ru-RU', { weekday:'long', day:'numeric', month:'long', year:'numeric' });

  return `
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1.5rem;flex-wrap:wrap;gap:1rem">
      <div>
        <div style="font-family:'Bebas Neue',sans-serif;font-size:2rem;letter-spacing:0.06em">ДАШБОРД</div>
        <div style="font-size:0.78rem;color:var(--gray);text-transform:capitalize">${todayDate}</div>
      </div>
      <button class="btn-primary" id="btn-new-order" style="clip-path:none;font-family:'Rajdhani',sans-serif;font-size:0.75rem;padding:0.6rem 1.2rem">+ Новый заказ</button>
    </div>

    <div class="kpi-row">
      <div class="kpi"><div class="kpi-label">Заказов сегодня</div><div class="kpi-val">${data.today_orders_count}</div></div>
      <div class="kpi"><div class="kpi-label">Выручка сегодня</div><div class="kpi-val" style="font-size:1.6rem">${data.today_revenue ? data.today_revenue.toLocaleString('ru-RU') + ' сом' : '—'}</div></div>
      <div class="kpi"><div class="kpi-label">В ожидании</div><div class="kpi-val">${data.pending_count}</div>${data.pending_count > 0 ? '<div class="kpi-delta neg">Нужно принять</div>' : ''}</div>
      <div class="kpi"><div class="kpi-label">Клиентов всего</div><div class="kpi-val">${data.total_clients}</div></div>
    </div>

    <div class="chart-row">
      <div class="crm-box">
        <div class="crm-box-title">Заказы · эта неделя</div>
        <div class="bars">${barsHtml}</div>
      </div>
      <div class="crm-box">
        <div class="crm-box-title">Персонал сейчас</div>
        <div class="staff-widget">${staffHtml}</div>
      </div>
    </div>

    <div class="crm-table-wrap">
      <div class="crm-table-header"><div class="crm-table-title">Заказы сегодня</div></div>
      <table>
        <thead><tr><th>#</th><th>Клиент</th><th>Авто</th><th>Услуга</th><th>Тип</th><th>Время</th><th>Статус</th><th>Действия</th></tr></thead>
        <tbody id="dash-orders-body">${ordersHtml}</tbody>
      </table>
    </div>`;
}

function buildOrderActions(o) {
  if (o.status === 'new')       return `<button class="act-btn ok"    data-id="${o.id}" data-action="confirmed">Принять</button><button class="act-btn danger" data-id="${o.id}" data-action="rejected">Отклонить</button>`;
  if (o.status === 'confirmed') return `<button class="act-btn ok"    data-id="${o.id}" data-action="wip">В работу</button>`;
  if (o.status === 'wip')       return `<button class="act-btn checklist" data-id="${o.id}" data-action="checklist">✓ Проверка</button>`;
  if (o.status === 'done')      return '<span style="color:#4caf7d;font-size:0.8rem">✓ Готово</span>';
  return '';
}

function attachDashboardEvents(data) {
  // Кнопка нового заказа
  document.getElementById('btn-new-order')?.addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('crm:new-order'));
  });

  // Статусы персонала
  document.querySelectorAll('.staff-status').forEach(el => {
    el.addEventListener('click', async () => {
      const id = Number(el.dataset.staffId);
      const current = el.dataset.status;
      const statuses = ['working', 'break', 'off'];
      const next = statuses[(statuses.indexOf(current) + 1) % statuses.length];
      try {
        await updateStaff(id, { status: next });
        el.dataset.status = next;
        el.style.color = STAFF_STATUS_COLOR[next];
        el.textContent = `● ${STAFF_STATUS_LABEL[next]}`;
      } catch { toastError('Не удалось обновить статус'); }
    });
  });

  // Кнопки действий заказов
  document.getElementById('dash-orders-body')?.addEventListener('click', async (e) => {
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
      renderDashboard();
    } catch (err) { toastError(err.message); }
  });
}
