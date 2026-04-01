import { getServices, getCarTypes, getAdditionalServices, getSlots, createOrder } from '../../api/index.js';
import { formatPrice, todayISO } from '../../utils/format.js';
import { toastError, toastSuccess } from '../../components/toast.js';

let state = {
  services: [],
  carTypes: [],
  extras: [],
  selectedService: null,
  selectedCarType: null,
  selectedExtras: new Set(),
  selectedTime: null,
  slots: [],
};

export async function renderBookingForm(preSelectService = null) {
  const container = document.getElementById('booking-container');
  if (!container) return;
  container.innerHTML = '<div class="loading"></div>';

  try {
    [state.services, state.carTypes, state.extras] = await Promise.all([
      getServices(), getCarTypes(), getAdditionalServices()
    ]);

    if (preSelectService) {
      state.selectedService = state.services.find(s => s.id === preSelectService.id) || null;
    }

    container.innerHTML = buildForm();
    attachEvents();

    if (state.selectedService) {
      updatePriceSummary();
    }

    // Загружаем слоты для сегодня
    await loadSlots(document.getElementById('f-date').value);

  } catch (err) {
    container.innerHTML = `<div style="padding:2rem;color:var(--gray)">Ошибка загрузки формы: ${err.message}</div>`;
  }
}

export function scrollToBooking(preSelectService = null) {
  if (preSelectService) {
    renderBookingForm(preSelectService);
  }
  setTimeout(() => {
    document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' });
  }, 50);
}

function buildForm() {
  const serviceOptions = state.services.map(s =>
    `<option value="${s.id}" ${state.selectedService?.id === s.id ? 'selected' : ''}>${s.name}</option>`
  ).join('');

  const carTypeGrid = state.carTypes.map(ct =>
    `<button type="button" class="car-type-btn" data-ct-id="${ct.id}">
      <span class="ct-icon">${ct.icon || '🚗'}</span>
      <span>${ct.name}</span>
    </button>`
  ).join('');

  const extrasGrid = state.extras.map(e =>
    `<label class="extra-item" data-extra-id="${e.id}">
      <input type="checkbox" value="${e.id}">
      <span class="extra-item-name">${e.name}</span>
      <span class="extra-item-price">${e.is_from_price ? 'от ' : ''}${Number(e.price).toLocaleString('ru-RU')}</span>
    </label>`
  ).join('');

  return `
    <div class="booking-wrap">
      <div class="booking-header">
        <div>
          <h3>ФОРМА ЗАПИСИ</h3>
          <p>Заполните данные — мы подтвердим запись в WhatsApp</p>
        </div>
        <div class="booking-step">FormaCar · Бишкек</div>
      </div>
      <div class="booking-body" id="booking-body">
        <div class="form-grid">
          <div class="form-field">
            <label>Ваше имя</label>
            <input type="text" id="f-name" placeholder="Введите имя">
          </div>
          <div class="form-field">
            <label>WhatsApp / Телефон</label>
            <input type="tel" id="f-phone" placeholder="+996 700 000 000">
          </div>
          <div class="form-field">
            <label>Марка и модель</label>
            <input type="text" id="f-car" placeholder="Toyota Camry, BMW X5...">
          </div>
          <div class="form-field">
            <label>Услуга</label>
            <select id="f-service">
              <option value="">— Выберите услугу —</option>
              ${serviceOptions}
            </select>
          </div>
          <div class="form-field full">
            <label>Тип кузова</label>
            <div class="car-type-grid">${carTypeGrid}</div>
          </div>
          <div class="form-field">
            <label>Дата</label>
            <input type="date" id="f-date" value="${todayISO()}" min="${todayISO()}">
          </div>
          <div class="form-field">
            <label>Выберите время</label>
            <div class="time-grid" id="time-grid"><div class="loading"></div></div>
          </div>
          ${state.extras.length ? `
          <div class="form-field full">
            <label>Дополнительные услуги (необязательно)</label>
            <div class="extras-grid">${extrasGrid}</div>
          </div>` : ''}
          <div class="form-field full">
            <label>Комментарий (необязательно)</label>
            <input type="text" id="f-note" placeholder="Особые пожелания...">
          </div>
        </div>

        <div class="booking-summary" id="book-sum">
          <div class="sum-row"><span>Услуга</span><span id="sum-svc">—</span></div>
          <div class="sum-row"><span>Тип кузова</span><span id="sum-ct">—</span></div>
          <div class="sum-row" id="sum-extras-row" style="display:none"><span>Доп. услуги</span><span id="sum-extras">—</span></div>
          <div class="sum-row total"><span>Итого</span><span id="sum-total">—</span></div>
        </div>

        <button class="btn-submit" id="btn-submit">ПОДТВЕРДИТЬ ЗАПИСЬ →</button>

        <div class="success-panel" id="success-box">
          <div class="check">✓</div>
          <h3>ЗАПИСЬ ПРИНЯТА</h3>
          <p>Мы свяжемся с вами через WhatsApp для подтверждения.</p>
          <p>Ждём вас в FormaCar!</p>
          <div class="order-num" id="success-order-num"></div>
        </div>
      </div>
    </div>`;
}

function attachEvents() {
  // Услуга
  document.getElementById('f-service')?.addEventListener('change', (e) => {
    const id = Number(e.target.value);
    state.selectedService = state.services.find(s => s.id === id) || null;
    updatePriceSummary();
  });

  // Тип кузова
  document.querySelectorAll('.car-type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.car-type-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      const id = Number(btn.dataset.ctId);
      state.selectedCarType = state.carTypes.find(ct => ct.id === id) || null;
      updatePriceSummary();
    });
  });

  // Дата
  document.getElementById('f-date')?.addEventListener('change', (e) => {
    state.selectedTime = null;
    loadSlots(e.target.value);
  });

  // Доп. услуги
  document.querySelectorAll('.extra-item input').forEach(cb => {
    cb.addEventListener('change', (e) => {
      const id = Number(e.target.value);
      const label = e.target.closest('.extra-item');
      if (e.target.checked) {
        state.selectedExtras.add(id);
        label?.classList.add('selected');
      } else {
        state.selectedExtras.delete(id);
        label?.classList.remove('selected');
      }
      updatePriceSummary();
    });
  });

  // Сабмит
  document.getElementById('btn-submit')?.addEventListener('click', submitBooking);
}

async function loadSlots(date) {
  const grid = document.getElementById('time-grid');
  if (!grid) return;
  grid.innerHTML = '<div class="loading"></div>';
  try {
    state.slots = await getSlots(date);
    state.selectedTime = null;
    grid.innerHTML = state.slots.map(slot => {
      if (!slot.available) {
        return `<div class="time-btn taken" data-time="${slot.time}">${slot.time}<span class="time-btn-sub">занято</span></div>`;
      }
      const spotsLeft = slot.spots_left ?? 6;
      const sub = spotsLeft <= 3 ? `<span class="time-btn-sub" style="color:#f59e0b">${spotsLeft} место</span>` : '';
      return `<div class="time-btn" data-time="${slot.time}">${slot.time}${sub}</div>`;
    }).join('');
    grid.querySelectorAll('.time-btn:not(.taken)').forEach(btn => {
      btn.addEventListener('click', () => {
        grid.querySelectorAll('.time-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        state.selectedTime = btn.dataset.time;
      });
    });
  } catch {
    grid.innerHTML = '<div style="color:var(--gray);font-size:0.8rem">Не удалось загрузить слоты</div>';
  }
}

function getSelectedPrice() {
  if (!state.selectedService || !state.selectedCarType) return null;
  return state.selectedService.pricing?.find(p => p.car_type_id === state.selectedCarType.id) || null;
}

function updatePriceSummary() {
  const sumEl = document.getElementById('book-sum');
  if (!sumEl) return;

  if (!state.selectedService) { sumEl.classList.remove('visible'); return; }

  sumEl.classList.add('visible');
  document.getElementById('sum-svc').textContent = state.selectedService.name;

  const pricing = getSelectedPrice();
  document.getElementById('sum-ct').textContent = state.selectedCarType
    ? state.selectedCarType.name : '— выберите тип кузова —';

  let extrasTotal = 0;
  if (state.selectedExtras.size > 0) {
    state.extras.forEach(e => {
      if (state.selectedExtras.has(e.id)) extrasTotal += e.price;
    });
    document.getElementById('sum-extras').textContent = `${extrasTotal.toLocaleString('ru-RU')} сом`;
    document.getElementById('sum-extras-row').style.display = '';
  } else {
    document.getElementById('sum-extras-row').style.display = 'none';
  }

  if (pricing) {
    const base = pricing.price;
    const total = base + extrasTotal;
    document.getElementById('sum-total').textContent =
      (pricing.is_from_price ? 'от ' : '') + `${total.toLocaleString('ru-RU')} сом`;
  } else {
    document.getElementById('sum-total').textContent = 'Выберите тип кузова';
  }
}

async function submitBooking() {
  const name  = document.getElementById('f-name')?.value.trim();
  const phone = document.getElementById('f-phone')?.value.trim();
  const car   = document.getElementById('f-car')?.value.trim();
  const date  = document.getElementById('f-date')?.value;
  const note  = document.getElementById('f-note')?.value.trim();

  if (!name || !phone || !car) { toastError('Заполните имя, телефон и марку авто'); return; }
  if (!state.selectedService) { toastError('Выберите услугу'); return; }
  if (!state.selectedCarType) { toastError('Выберите тип кузова'); return; }
  if (!state.selectedTime)    { toastError('Выберите время'); return; }

  const btn = document.getElementById('btn-submit');
  btn.disabled = true;
  btn.textContent = 'ОТПРАВЛЯЕМ...';

  try {
    const order = await createOrder({
      client_name: name,
      client_phone: phone,
      client_car: car,
      service_id: state.selectedService.id,
      car_type_id: state.selectedCarType.id,
      date,
      time_slot: state.selectedTime,
      note,
      additional_service_ids: [...state.selectedExtras],
    });

    document.getElementById('success-order-num').textContent = `Номер заказа: ${order.order_number}`;
    document.getElementById('success-box').classList.add('visible');
    document.getElementById('success-box').scrollIntoView({ behavior: 'smooth' });
    btn.style.display = 'none';
    toastSuccess('Запись принята! Мы свяжемся с вами.');

  } catch (err) {
    toastError(err.message || 'Ошибка при записи');
    btn.disabled = false;
    btn.textContent = 'ПОДТВЕРДИТЬ ЗАПИСЬ →';
  }
}
