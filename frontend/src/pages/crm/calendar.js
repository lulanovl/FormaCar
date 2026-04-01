import { getOrders } from '../../api/index.js';
import { STATUS_LABEL, STATUS_BADGE } from '../../utils/format.js';

const MONTHS_RU = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
const DAYS_RU = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
const MAX_BAYS = 6;

let calState = { year: new Date().getFullYear(), month: new Date().getMonth(), selectedDate: null, orders: [] };

export async function renderCalendar() {
  const el = document.getElementById('p-cal');
  if (!el) return;
  const today = new Date();
  calState.selectedDate = today.toISOString().split('T')[0];
  await loadAndRender(el);
}

async function loadAndRender(el) {
  el.innerHTML = `<div class="crm-page-title">РАСПИСАНИЕ</div><div class="loading"></div>`;
  try {
    const y = calState.year, m = calState.month;
    const from = `${y}-${String(m+1).padStart(2,'0')}-01`;
    const lastDay = new Date(y, m+1, 0).getDate();
    const to = `${y}-${String(m+1).padStart(2,'0')}-${lastDay}`;

    const allOrders = await getOrders({});
    calState.orders = allOrders.filter(o => o.date >= from && o.date <= to);

    el.innerHTML = buildCalendarLayout();
    renderCalendarGrid();
    renderSlots();
    attachCalEvents(el);
  } catch (err) {
    el.innerHTML = `<div class="crm-page-title">РАСПИСАНИЕ</div><div style="padding:2rem;color:var(--gray)">Ошибка: ${err.message}</div>`;
  }
}

function buildCalendarLayout() {
  return `
    <div class="crm-page-title">РАСПИСАНИЕ</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1px;background:var(--border)">
      <div class="crm-box">
        <div class="cal-nav">
          <button class="cal-nav-btn" id="cal-prev">← Пред</button>
          <div class="cal-month-title" id="cal-title"></div>
          <button class="cal-nav-btn" id="cal-next">След →</button>
        </div>
        <div class="cal-grid" id="cal-grid"></div>
      </div>
      <div class="crm-box">
        <div class="crm-box-title" id="slots-title">Слоты</div>
        <div class="slot-list" id="slot-list"></div>
      </div>
    </div>`;
}

function renderCalendarGrid() {
  const { year, month, selectedDate } = calState;
  document.getElementById('cal-title').textContent = `${MONTHS_RU[month]} ${year}`;

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset = firstDay === 0 ? 6 : firstDay - 1;
  const today = new Date().toISOString().split('T')[0];

  const datesWithOrders = new Set(calState.orders.map(o => o.date));

  let html = DAYS_RU.map(d => `<div class="cal-hdr">${d}</div>`).join('');
  for (let i = 0; i < offset; i++) html += `<div class="cal-d empty"></div>`;
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const cls = [
      'cal-d',
      dateStr === today ? 'today' : '',
      dateStr === selectedDate ? 'sel' : '',
      datesWithOrders.has(dateStr) && dateStr !== selectedDate ? 'has' : '',
    ].filter(Boolean).join(' ');
    html += `<div class="${cls}" data-date="${dateStr}">${d}</div>`;
  }
  document.getElementById('cal-grid').innerHTML = html;
}

function renderSlots() {
  const { selectedDate, orders } = calState;
  if (!selectedDate) return;

  const d = new Date(selectedDate);
  const label = d.toLocaleDateString('ru-RU', { day:'numeric', month:'long' });
  document.getElementById('slots-title').textContent = `Слоты · ${label}`;

  const dayOrders = orders
    .filter(o => o.date === selectedDate && !['rejected','no_show'].includes(o.status))
    .sort((a, b) => a.time_slot.localeCompare(b.time_slot));

  // Group by time slot (multiple orders per slot = multiple bays)
  const ordersByTime = {};
  for (const o of dayOrders) {
    if (!ordersByTime[o.time_slot]) ordersByTime[o.time_slot] = [];
    ordersByTime[o.time_slot].push(o);
  }

  const slots = ['09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00'];

  const html = slots.map(time => {
    const slotOrders = ordersByTime[time] || [];
    const count = slotOrders.length;
    const free  = MAX_BAYS - count;

    if (count === 0) {
      return `<div class="slot-item free">
        <span class="slot-time" style="color:var(--gray)">${time}</span>
        <div style="font-size:0.83rem;color:var(--gray)">Свободно · 6/6 мест</div>
      </div>`;
    }

    const capacityColor = free === 0 ? 'var(--red)' : free <= 2 ? '#f59e0b' : '#4caf7d';
    const capacityLabel = free === 0 ? 'Занято' : `${free} из ${MAX_BAYS} свободно`;

    const orderCards = slotOrders.map(o => `
      <div class="slot-order-card">
        <div class="slot-order-row">
          <span class="slot-order-name">${o.client_name}</span>
          <span class="badge ${STATUS_BADGE[o.status] || 'badge-new'}">${STATUS_LABEL[o.status]}</span>
        </div>
        <div class="slot-order-detail">${o.client_car} · ${o.service_name}${o.car_type_name ? ' · ' + o.car_type_name : ''}</div>
      </div>`).join('');

    return `<div class="slot-item slot-item-multi ${free === 0 ? 'full' : ''}">
      <div class="slot-item-header">
        <span class="slot-time" style="color:${statusColor(slotOrders[0].status)}">${time}</span>
        <span class="slot-capacity" style="color:${capacityColor}">${count}/${MAX_BAYS} · ${capacityLabel}</span>
      </div>
      ${orderCards}
    </div>`;
  }).join('');

  document.getElementById('slot-list').innerHTML = html;
}

function statusColor(status) {
  return { done:'#4caf7d', wip:'#64b5f6', new:'var(--red)', confirmed:'#64b5f6' }[status] || 'var(--gray)';
}

function attachCalEvents(el) {
  document.getElementById('cal-prev')?.addEventListener('click', async () => {
    calState.month--;
    if (calState.month < 0) { calState.month = 11; calState.year--; }
    await loadAndRender(el);
  });
  document.getElementById('cal-next')?.addEventListener('click', async () => {
    calState.month++;
    if (calState.month > 11) { calState.month = 0; calState.year++; }
    await loadAndRender(el);
  });
  document.getElementById('cal-grid')?.addEventListener('click', (e) => {
    const d = e.target.closest('[data-date]');
    if (!d) return;
    calState.selectedDate = d.dataset.date;
    renderCalendarGrid();
    renderSlots();
  });
}
