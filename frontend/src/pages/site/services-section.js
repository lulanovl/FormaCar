import { getServices } from '../../api/index.js';
import { formatPrice } from '../../utils/format.js';

const SERVICE_ICONS = ['⚡', '✨', '💎', '🧹', '🛡️', '🔧', '🔩'];
const SERVICE_FEATURES = {
  'Стандартная мойка':    ['Мойка кузова под давлением', 'Чистка дисков и арок', 'Сушка микрофиброй', 'Мойка стёкол'],
  'Трёхфазная мойка':     ['Предварительная пена-мойка', 'Основная мойка', 'Финальная полировка', 'Чистка дисков', 'Мойка стёкол'],
  'Премиум мойка':        ['Полная наружная мойка', 'Химчистка салона', 'Полировка кузова', 'Обработка резины', 'Ароматизация'],
  'Химчистка':            ['Пол и коврики', 'Сиденья', 'Потолок', 'Дверные карты', 'Торпедо', 'Глубокое пятновыведение'],
  'Полировка + керамика': ['Машинная полировка', 'Нанокерамическое покрытие', 'Защита на 2–3 года', 'Финальная инспекция'],
  'Мойка днища':          ['Мойка под высоким давлением', 'Удаление грязи и соли'],
  'Антикор днища':        ['Нанесение антикора', 'Защита от ржавчины', 'Полная обработка'],
};

export async function renderServicesSection(onPick) {
  const grid = document.getElementById('services-grid');
  if (!grid) return;

  try {
    const services = await getServices();

    // Обновляем футер
    const footerList = document.getElementById('footer-services-list');
    if (footerList) {
      footerList.innerHTML = services.map(s =>
        `<li><a href="#" onclick="return false">${s.name}</a></li>`
      ).join('');
    }

    if (!services.length) {
      grid.innerHTML = '<div style="padding:2rem;color:var(--gray)">Услуги временно недоступны</div>';
      return;
    }

    grid.innerHTML = `<div class="services-grid">${services.map((s, i) => buildCard(s, i)).join('')}</div>`;

    // Клики по карточкам
    grid.querySelectorAll('.service-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = Number(card.dataset.serviceId);
        const svc = services.find(s => s.id === id);
        if (svc) onPick(svc);
      });
    });

    grid.querySelectorAll('.btn-pick').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = Number(btn.dataset.serviceId);
        const svc = services.find(s => s.id === id);
        if (svc) onPick(svc);
      });
    });

  } catch (err) {
    grid.innerHTML = '<div style="padding:2rem;color:var(--gray)">Не удалось загрузить услуги</div>';
  }
}

function buildCard(svc, index) {
  const icon = SERVICE_ICONS[index] || '🔧';
  const features = SERVICE_FEATURES[svc.name] || [];
  const isPopular = svc.name === 'Трёхфазная мойка';

  const featuresHtml = features.map(f => `<li>${f}</li>`).join('');

  const pricingHtml = svc.pricing && svc.pricing.length
    ? `<div class="service-pricing">${svc.pricing.map(p =>
        `<div class="service-pricing-row">
          <span class="ct-name">${p.car_type_icon || ''} ${p.car_type_name}</span>
          <span class="ct-price">${p.is_from_price ? 'от ' : ''}${Number(p.price).toLocaleString('ru-RU')}</span>
        </div>`
      ).join('')}</div>`
    : `<div class="service-pricing"><div style="color:var(--gray);font-size:0.8rem">Цена по запросу</div></div>`;

  return `
    <div class="service-card" data-service-id="${svc.id}" style="${isPopular ? 'border-top:3px solid var(--red)' : ''}">
      ${isPopular ? '<div style="font-family:Rajdhani,sans-serif;font-size:0.6rem;font-weight:700;letter-spacing:0.25em;text-transform:uppercase;color:var(--red);margin-bottom:0.5rem">★ ПОПУЛЯРНЫЙ</div>' : ''}
      <span class="service-num">0${index + 1}</span>
      <span class="service-icon">${icon}</span>
      <div class="service-name">${svc.name}</div>
      <div class="service-desc">${svc.description}</div>
      <ul class="service-features">${featuresHtml}</ul>
      <div class="service-footer">
        ${pricingHtml}
        <button class="btn-pick" data-service-id="${svc.id}">Выбрать</button>
      </div>
    </div>`;
}
