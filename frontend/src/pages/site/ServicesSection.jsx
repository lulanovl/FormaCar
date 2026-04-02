import { useState, useEffect } from 'react';
import { getServices } from '../../api/index.js';

const SERVICE_FEATURES = {
  'Стандартная мойка':    ['Мойка кузова под давлением', 'Чистка дисков и арок', 'Сушка микрофиброй', 'Мойка стёкол'],
  'Трёхфазная мойка':     ['Предварительная пена-мойка', 'Основная мойка', 'Финальная полировка', 'Чистка дисков', 'Мойка стёкол'],
  'Премиум мойка':        ['Полная наружная мойка', 'Химчистка салона', 'Полировка кузова', 'Обработка резины', 'Ароматизация'],
  'Химчистка':            ['Пол и коврики', 'Сиденья', 'Потолок', 'Дверные карты', 'Торпедо', 'Глубокое пятновыведение'],
  'Полировка + керамика': ['Машинная полировка', 'Нанокерамическое покрытие', 'Защита на 2–3 года', 'Финальная инспекция'],
  'Мойка днища':          ['Мойка под высоким давлением', 'Удаление грязи и соли'],
  'Антикор днища':        ['Нанесение антикора', 'Защита от ржавчины', 'Полная обработка'],
};

export default function ServicesSection({ onPick }) {
  const [services, setServices] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    getServices()
      .then((data) => {
        setServices(data);
        // Update footer services list
        const footerList = document.getElementById('footer-services-list');
        if (footerList) {
          footerList.innerHTML = data.map(s => `<li><a href="#">${s.name}</a></li>`).join('');
        }
      })
      .catch(() => setError('Не удалось загрузить услуги'));
  }, []);

  if (error) {
    return <div style={{ padding: '2rem', color: 'var(--gray)' }}>{error}</div>;
  }

  if (!services.length) {
    return <div id="services-grid"><div className="loading" /></div>;
  }

  return (
    <div id="services-grid">
      <div className="services-grid">
        {services.map((svc, i) => {
          const features = SERVICE_FEATURES[svc.name] || [];
          const isPopular = svc.name === 'Трёхфазная мойка';

          return (
            <div
              key={svc.id}
              className="service-card"
              style={isPopular ? { borderTop: '3px solid var(--red)' } : {}}
              onClick={() => onPick(svc)}
            >
              {isPopular && (
                <div style={{ fontFamily: 'Rajdhani,sans-serif', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--red)', marginBottom: '0.5rem' }}>
                  ★ ПОПУЛЯРНЫЙ
                </div>
              )}
              <span className="service-num">0{i + 1}</span>
              <div className="service-name">{svc.name}</div>
              <div className="service-desc">{svc.description}</div>
              <ul className="service-features">
                {features.map((f, fi) => <li key={fi}>{f}</li>)}
              </ul>
              <div className="service-footer">
                {svc.pricing && svc.pricing.length ? (
                  <div className="service-pricing">
                    {svc.pricing.map((p) => (
                      <div key={p.car_type_id} className="service-pricing-row">
                        <span className="ct-name">{p.car_type_icon || ''} {p.car_type_name}</span>
                        <span className="ct-price">{p.is_from_price ? 'от ' : ''}{Number(p.price).toLocaleString('ru-RU')}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="service-pricing">
                    <div style={{ color: 'var(--gray)', fontSize: '0.8rem' }}>Цена по запросу</div>
                  </div>
                )}
                <button
                  className="btn-pick"
                  onClick={(e) => { e.stopPropagation(); onPick(svc); }}
                >
                  Выбрать
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
