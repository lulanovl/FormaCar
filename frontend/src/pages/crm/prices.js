import { getAllServices, getCarTypes, getAllAdditionalServices, updateService, updateAdditionalService } from '../../api/index.js';
import { toastSuccess, toastError } from '../../components/toast.js';

export async function renderPrices() {
  const el = document.getElementById('p-prices');
  if (!el) return;
  el.innerHTML = `<div class="crm-page-title">ПРАЙС-ЛИСТ</div><div class="loading"></div>`;

  try {
    const [services, carTypes, extras] = await Promise.all([
      getAllServices(), getCarTypes(), getAllAdditionalServices()
    ]);
    el.innerHTML = buildPricesPage(services, carTypes, extras);
    attachPriceEvents(services, carTypes, extras);
  } catch (err) {
    el.innerHTML = `<div class="crm-page-title">ПРАЙС-ЛИСТ</div><div style="padding:2rem;color:var(--gray)">${err.message}</div>`;
  }
}

function buildPricesPage(services, carTypes, extras) {
  const ctHeaders = carTypes.map(ct => `<th>${ct.icon || ''} ${ct.name}</th>`).join('');

  const serviceRows = services.map(svc => {
    const priceCells = carTypes.map(ct => {
      const p = svc.pricing?.find(pp => pp.car_type_id === ct.id);
      const price = p?.price ?? 0;
      const isFrom = p?.is_from_price ?? false;
      return `<td>
        <div class="price-cell">
          ${isFrom ? '<span class="from-price-badge">от</span>' : ''}
          <input class="price-input" type="number" min="0" step="100"
            data-service-id="${svc.id}" data-car-type-id="${ct.id}"
            value="${price}">
        </div>
      </td>`;
    }).join('');
    return `<tr>
      <td style="font-weight:500">${svc.name}</td>
      <td style="color:var(--gray)">${svc.duration_min} мин</td>
      ${priceCells}
      <td><input type="checkbox" class="svc-active-toggle" data-service-id="${svc.id}" ${svc.is_active ? 'checked' : ''} style="accent-color:var(--red);width:16px;height:16px;cursor:pointer"></td>
    </tr>`;
  }).join('');

  const extraRows = extras.map(e => `<tr>
    <td style="font-weight:500">${e.name}</td>
    <td style="color:var(--gray)">${e.duration_min} мин</td>
    <td>
      <div class="price-cell">
        ${e.is_from_price ? '<span class="from-price-badge">от</span>' : ''}
        <input class="price-input" type="number" min="0" step="100"
          data-extra-id="${e.id}" value="${e.price}">
      </div>
    </td>
    <td><input type="checkbox" class="extra-active-toggle" data-extra-id="${e.id}" ${e.is_active ? 'checked' : ''} style="accent-color:var(--red);width:16px;height:16px;cursor:pointer"></td>
  </tr>`).join('');

  return `
    <div class="crm-page-title">ПРАЙС-ЛИСТ</div>

    <div class="crm-box" style="border:1px solid var(--border);margin-bottom:2rem">
      <div class="crm-box-title">Основные услуги · цены в сом</div>
      <table>
        <thead><tr><th>Услуга</th><th>Время</th>${ctHeaders}<th>Активна</th></tr></thead>
        <tbody id="services-price-body">${serviceRows}</tbody>
      </table>
      <button class="btn-save-price" id="btn-save-services">СОХРАНИТЬ ПРАЙС</button>
    </div>

    <div class="crm-box" style="border:1px solid var(--border)">
      <div class="crm-box-title">Дополнительные услуги</div>
      <table>
        <thead><tr><th>Услуга</th><th>Время</th><th>Цена (сом)</th><th>Активна</th></tr></thead>
        <tbody>${extraRows}</tbody>
      </table>
      <button class="btn-save-price" id="btn-save-extras">СОХРАНИТЬ</button>
    </div>`;
}

function attachPriceEvents(services, carTypes, extras) {
  // Сохранить основной прайс
  document.getElementById('btn-save-services')?.addEventListener('click', async () => {
    const btn = document.getElementById('btn-save-services');
    btn.textContent = 'СОХРАНЯЕМ...';
    btn.disabled = true;
    try {
      const updates = [];
      document.querySelectorAll('.price-input[data-service-id]').forEach(input => {
        const sid = Number(input.dataset.serviceId);
        const ctid = Number(input.dataset.carTypeId);
        const price = Number(input.value);
        let upd = updates.find(u => u.id === sid);
        if (!upd) { upd = { id: sid, pricing: [] }; updates.push(upd); }
        upd.pricing.push({ car_type_id: ctid, price });
      });
      // Активность
      document.querySelectorAll('.svc-active-toggle').forEach(cb => {
        const sid = Number(cb.dataset.serviceId);
        let upd = updates.find(u => u.id === sid);
        if (!upd) { upd = { id: sid, pricing: [] }; updates.push(upd); }
        upd.is_active = cb.checked;
      });
      await Promise.all(updates.map(u => updateService(u.id, { pricing: u.pricing, is_active: u.is_active })));
      toastSuccess('Прайс сохранён');
    } catch (err) { toastError(err.message); }
    btn.textContent = 'СОХРАНИТЬ ПРАЙС';
    btn.disabled = false;
  });

  // Сохранить доп. услуги
  document.getElementById('btn-save-extras')?.addEventListener('click', async () => {
    const btn = document.getElementById('btn-save-extras');
    btn.textContent = 'СОХРАНЯЕМ...';
    btn.disabled = true;
    try {
      const inputs = document.querySelectorAll('.price-input[data-extra-id]');
      const toggles = document.querySelectorAll('.extra-active-toggle');
      const updates = [...inputs].map(input => ({
        id: Number(input.dataset.extraId),
        price: Number(input.value),
      }));
      toggles.forEach(cb => {
        const upd = updates.find(u => u.id === Number(cb.dataset.extraId));
        if (upd) upd.is_active = cb.checked;
      });
      await Promise.all(updates.map(u => updateAdditionalService(u.id, { price: u.price, is_active: u.is_active })));
      toastSuccess('Сохранено');
    } catch (err) { toastError(err.message); }
    btn.textContent = 'СОХРАНИТЬ';
    btn.disabled = false;
  });
}
