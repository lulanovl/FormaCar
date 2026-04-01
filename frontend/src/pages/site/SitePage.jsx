import { useState } from 'react';
import ServicesSection from './ServicesSection.jsx';
import BookingForm from './BookingForm.jsx';

export default function SitePage({ onCrmClick }) {
  const [preSelectService, setPreSelectService] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  function scrollToBooking(svc = null) {
    if (svc) setPreSelectService(svc);
    setMenuOpen(false);
    setTimeout(() => {
      document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  }

  function scrollTo(id) {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <>
      {/* NAV */}
      <nav id="main-nav">
        <div className="nav-logo" onClick={() => window.scrollTo(0, 0)}>
          <div>
            <span><span className="forma">Forma</span>Car</span>
            <span className="sub">Premium Car Wash</span>
          </div>
        </div>
        <ul>
          <li><a onClick={() => scrollTo('services')}>Услуги</a></li>
          <li><a onClick={() => scrollToBooking()}>Запись</a></li>
          <li><a onClick={() => scrollTo('why')}>О нас</a></li>
          <li><a onClick={() => scrollTo('contact')}>Контакты</a></li>
        </ul>
        <div className="nav-right">
          <button className="btn-crm" onClick={onCrmClick}>⚙ Панель</button>
          <button className="btn-nav" onClick={() => scrollToBooking()}>Записаться</button>
          <button
            className="nav-burger"
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Меню"
          >
            <span className={menuOpen ? 'burger-line open' : 'burger-line'}></span>
            <span className={menuOpen ? 'burger-line open' : 'burger-line'}></span>
            <span className={menuOpen ? 'burger-line open' : 'burger-line'}></span>
          </button>
        </div>
      </nav>

      {/* MOBILE MENU */}
      {menuOpen && (
        <div className="mobile-menu">
          <a onClick={() => scrollTo('services')}>Услуги</a>
          <a onClick={() => scrollToBooking()}>Запись</a>
          <a onClick={() => scrollTo('why')}>О нас</a>
          <a onClick={() => scrollTo('contact')}>Контакты</a>
          <a onClick={() => { setMenuOpen(false); onCrmClick(); }} className="mobile-menu-crm">⚙ CRM Панель</a>
        </div>
      )}
      {menuOpen && <div className="mobile-menu-overlay" onClick={() => setMenuOpen(false)} />}

      {/* HERO */}
      <section className="hero">
        <div className="hero-grid"></div>
        <div className="scan-line"></div>
        <div className="hero-content">
          <div className="hero-eyebrow">Премиальная автомойка · Бишкек</div>
          <h1>
            <span className="line1">ЧИСТОТА</span>
            <span className="line2">ВЫСОКОГО</span>
            <span className="line3">КЛАССА</span>
          </h1>
          <p className="hero-sub">FormaCar — профессиональный уход за вашим автомобилем. Запишитесь онлайн, выберите удобное время и приезжайте без очереди.</p>
          <div className="hero-actions">
            <button className="btn-primary" onClick={() => scrollToBooking()}>Записаться онлайн</button>
            <button className="btn-ghost" onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}>Наши услуги</button>
          </div>
        </div>
        <div className="hero-visual">
          <svg viewBox="0 0 900 400" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="carGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#555"/><stop offset="50%" stopColor="#e0e0e0"/><stop offset="100%" stopColor="#333"/>
              </linearGradient>
              <linearGradient id="redLine" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="transparent"/><stop offset="40%" stopColor="#d42b2b"/><stop offset="100%" stopColor="#d42b2b"/>
              </linearGradient>
              <filter id="glow"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            </defs>
            <ellipse cx="450" cy="370" rx="380" ry="18" fill="rgba(212,43,43,0.12)"/>
            <path d="M80,300 L80,240 Q100,200 160,180 L300,155 Q380,100 480,95 Q580,90 640,110 L760,150 Q820,165 840,200 L850,240 L850,300 Z" fill="url(#carGrad)" opacity="0.9"/>
            <path d="M280,158 Q340,95 460,88 Q560,82 620,108 L750,148 Q680,145 620,140 Q520,130 440,125 Q360,118 280,158Z" fill="#c0c0c0" opacity="0.7"/>
            <path d="M310,160 Q340,105 420,100 L490,100 L500,158Z" fill="rgba(212,43,43,0.25)" stroke="rgba(212,43,43,0.4)" strokeWidth="1"/>
            <path d="M510,158 L508,100 Q575,96 630,115 L700,148Z" fill="rgba(212,43,43,0.2)" stroke="rgba(212,43,43,0.35)" strokeWidth="1"/>
            <path d="M80,255 L850,255" stroke="url(#redLine)" strokeWidth="2.5" filter="url(#glow)"/>
            <circle cx="220" cy="305" r="55" fill="#1a1a1a" stroke="#333" strokeWidth="3"/>
            <circle cx="220" cy="305" r="32" fill="#222" stroke="#d42b2b" strokeWidth="1.5"/>
            <circle cx="220" cy="305" r="10" fill="#111"/>
            <circle cx="680" cy="305" r="55" fill="#1a1a1a" stroke="#333" strokeWidth="3"/>
            <circle cx="680" cy="305" r="32" fill="#222" stroke="#d42b2b" strokeWidth="1.5"/>
            <circle cx="680" cy="305" r="10" fill="#111"/>
            <ellipse cx="845" cy="220" rx="20" ry="14" fill="rgba(212,43,43,0.6)" filter="url(#glow)"/>
            <circle cx="350" cy="130" r="3" fill="rgba(100,180,255,0.6)"/>
            <circle cx="420" cy="105" r="2" fill="rgba(100,180,255,0.5)"/>
            <circle cx="560" cy="100" r="2.5" fill="rgba(100,180,255,0.55)"/>
            <circle cx="650" cy="125" r="2" fill="rgba(100,180,255,0.5)"/>
          </svg>
        </div>
        <div className="stats-bar">
          <div className="stat-item"><div><div className="stat-num">1200+</div><div className="stat-label">Клиентов</div></div></div>
          <div className="stat-item"><div><div className="stat-num">4.9</div><div className="stat-label">Рейтинг</div></div></div>
          <div className="stat-item"><div><div className="stat-num">3</div><div className="stat-label">Года на рынке</div></div></div>
          <div className="stat-item"><div><div className="stat-num">100%</div><div className="stat-label">Гарантия</div></div></div>
        </div>
      </section>

      {/* SERVICES */}
      <section id="services" className="section services-bg">
        <div className="section-label">Услуги</div>
        <div className="section-title">ВЫБЕРИТЕ <span className="accent">ПРОГРАММУ</span></div>
        <ServicesSection onPick={scrollToBooking} />
      </section>

      {/* BOOKING */}
      <section id="booking" className="section">
        <div className="section-label">Онлайн-запись</div>
        <div className="section-title">ЗАПИСАТЬСЯ <span className="accent">БЕЗ ОЧЕРЕДИ</span></div>
        <BookingForm preSelectService={preSelectService} />
      </section>

      {/* WHY */}
      <section id="why" className="section services-bg">
        <div className="section-label">Почему FormaCar</div>
        <div className="section-title">НАШ <span className="accent">СТАНДАРТ</span></div>
        <div className="why-grid">
          <div className="why-item"><div className="why-icon">🔬</div><div className="why-title">Профессиональная химия</div><div className="why-desc">Используем только сертифицированную автохимию. Безопасно для лакокрасочного покрытия и пластика.</div></div>
          <div className="why-item"><div className="why-icon">⏱</div><div className="why-title">Запись без ожидания</div><div className="why-desc">Выберите точное время онлайн — мы гарантируем, что мастер будет готов именно к вашему приезду.</div></div>
          <div className="why-item"><div className="why-icon">🛡</div><div className="why-title">Гарантия качества</div><div className="why-desc">Если результат вас не устроит — исправим бесплатно. Мы отвечаем за каждый автомобиль.</div></div>
          <div className="why-item"><div className="why-icon">👨‍🔧</div><div className="why-title">Опытная команда</div><div className="why-desc">Каждый мастер прошёл обучение и сертификацию. За 3 года — более 1200 довольных клиентов.</div></div>
        </div>
      </section>

      {/* FOOTER */}
      <footer id="contact">
        <div className="footer-top">
          <div>
            <span className="footer-logo"><span className="forma">Forma</span>Car</span>
            <div className="footer-desc">Premium Car Wash в Бишкеке. Профессиональный уход за вашим автомобилем. Запись онлайн — без очередей.</div>
          </div>
          <div className="footer-col">
            <div className="footer-col-title">Услуги</div>
            <ul id="footer-services-list"><li><a href="#">Стандартная мойка</a></li></ul>
          </div>
          <div className="footer-col">
            <div className="footer-col-title">Контакты</div>
            <ul>
              <li><a href="#">📍 Бишкек, Кыргызстан</a></li>
              <li><a href="#">📞 +996 — — —</a></li>
              <li><a href="#">💬 WhatsApp</a></li>
              <li><a href="#">📷 Instagram</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2025 <span className="footer-red">FormaCar</span> Premium Car Wash. Все права защищены.</p>
        </div>
      </footer>
    </>
  );
}
