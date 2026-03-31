import { getServices, getCarTypes, createOrderAdmin } from '../api/index.js';
import { todayISO } from '../utils/format.js';
import { toastSuccess, toastError } from './toast.js';

let _services = [];
let _carTypes = [];
let _selectedCarType = null;

export async function openNewOrderModal() {
  const modal = document.getElementById('orderModal');
  const form  = document.getElementById('order-modal-form');
  if (!modal || !form) return;

  document.querySelector('#orderModal .modal-title').textContent = 'НОВЫЙ ЗАКАЗ';
  document.querySelector('#orderModal .modal-sub').textContent = 'Ручное добавление записи';

  form.innerHTML = '<div class="loading"></div>';
  modal.classList.add('open');
  _selectedCarType = null;

  try {
    [_services, _carTypes] = await Promise.all([getServices(), getCarTypes()]);
    renderForm(form);
  } catch (err) {
    form.innerHTML = `<div style="color:var(--gray)">${err.message}</div>`;
  }
}

function renderForm(form) {
  const serviceOpts = _services.map(s =>
    `<option value="${s.id}">${s.name}</option>`).join('');
  const ctGrid = _carTypes.map(ct =>
    `<button type="button" class="car-type-btn" data-ct-id="${ct.id}">
      <span class="ct-icon">${ct.icon || '🚗'}</span>
      <span>${ct.name}</span>
    </button>`).join('');

  form.innerHTML = `
    <div class="mform">
      <input type="text"  id="mo-name"  placeholder="Имя клиента">
      <input type="tel"   id="mo-phone" placeholder="Телефон">
      <input type="text"  id="mo-car"   placeholder="Марка и модель авто">
      <select id="mo-service"><option value="">— Выберите услугу —</option>${serviceOpts}</select>
      <div>
        <div style="font-family:'Rajdhani',sans-serif;font-size:0.65rem;font-weight:600;letter-spacing:0.25em;text-transform:uppercase;color:var(--gray);margin-bottom:0.5rem">Тип кузова</div>
        <div class="car-type-grid mform-ct">${ctGrid}</div>
      </div>
      <input type="date"          id="mo-date"  value="${todayISO()}" min="${todayISO()}">
      <input type="time"          id="mo-time"  value="10:00" step="3600">
      <input type="text"          id="mo-note"  placeholder="Комментарий (необязательно)">
      <p class="error-msg" id="mo-error" style="display:none"></p>
      <button class="btn-primary" id="mo-submit" style="clip-path:none">СОЗДАТЬ ЗАКАЗ</button>
    </div>`;

  form.querySelectorAll('.car-type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      form.querySelectorAll('.car-type-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      _selectedCarType = Number(btn.dataset.ctId);
    });
  });

  document.getElementById('mo-submit').addEventListener('click', submitNewOrder);
}

async function submitNewOrder() {
  const name    = document.getElementById('mo-name')?.value.trim();
  const phone   = document.getElementById('mo-phone')?.value.trim();
  const car     = document.getElementById('mo-car')?.value.trim();
  const svcId   = Number(document.getElementById('mo-service')?.value);
  const date    = document.getElementById('mo-date')?.value;
  const timeRaw = document.getElementById('mo-time')?.value;
  const note    = document.getElementById('mo-note')?.value.trim();
  const errEl   = document.getElementById('mo-error');

  const timeSlot = timeRaw ? timeRaw.slice(0, 5) : '';

  const showErr = (msg) => { errEl.textContent = msg; errEl.style.display = 'block'; };
  errEl.style.display = 'none';

  if (!name)            return showErr('Введите имя клиента');
  if (!phone)           return showErr('Введите телефон');
  if (!car)             return showErr('Введите марку авто');
  if (!svcId)           return showErr('Выберите услугу');
  if (!_selectedCarType) return showErr('Выберите тип кузова');
  if (!date || !timeSlot) return showErr('Укажите дату и время');

  const btn = document.getElementById('mo-submit');
  btn.disabled = true;
  btn.textContent = 'СОЗДАЁМ...';

  try {
    const order = await createOrderAdmin({
      client_name: name, client_phone: phone, client_car: car,
      service_id: svcId, car_type_id: _selectedCarType,
      date, time_slot: timeSlot, note,
    });
    toastSuccess(`Заказ ${order.order_number} создан`);
    document.getElementById('orderModal').classList.remove('open');
    window.dispatchEvent(new CustomEvent('crm:refresh'));
  } catch (err) {
    showErr(err.message);
    btn.disabled = false;
    btn.textContent = 'СОЗДАТЬ ЗАКАЗ';
  }
}
