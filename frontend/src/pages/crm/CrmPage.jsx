import { useState, useEffect } from 'react';
import Dashboard from './Dashboard.jsx';
import Orders from './Orders.jsx';
import Calendar from './Calendar.jsx';
import Clients from './Clients.jsx';
import Staff from './Staff.jsx';
import Prices from './Prices.jsx';
import Analytics from './Analytics.jsx';

const PANEL_LABELS = { dash: 'Дашборд', orders: 'Заказы', cal: 'Расписание', clients: 'Клиенты', analytics: 'Аналитика', staff: 'Персонал', prices: 'Прайс-лист' };

export default function CrmPage({ panel, onPanelChange, refreshKey, onRefresh, onNewOrder, onOpenChecklist, onBackSite }) {
  const [loadedPanels, setLoadedPanels] = useState(new Set(['dash']));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [ordersFilter, setOrdersFilter] = useState('all');
  const [ordersInitialId, setOrdersInitialId] = useState(null);

  function handleNavigate(panelId, payload) {
    if (typeof payload === 'number') {
      // Navigate to a specific order by id
      setOrdersFilter('all');
      setOrdersInitialId(payload);
    } else if (typeof payload === 'string') {
      setOrdersFilter(payload);
      setOrdersInitialId(null);
    }
    onPanelChange(panelId);
    setDrawerOpen(false);
  }

  useEffect(() => {
    setLoadedPanels(prev => new Set([...prev, panel]));
  }, [panel]);

  function navigate(id) {
    onPanelChange(id);
    setDrawerOpen(false);
  }

  const navItems = [
    { id: 'dash',      ico: '📊', label: 'Дашборд' },
    { id: 'orders',    ico: '📋', label: 'Заказы' },
    { id: 'cal',       ico: '📅', label: 'Расписание' },
    { id: 'clients',   ico: '👥', label: 'Клиенты' },
    { id: 'analytics', ico: '📈', label: 'Аналитика' },
    { id: 'staff',     ico: '🔧', label: 'Персонал' },
    { id: 'prices',    ico: '💰', label: 'Прайс-лист' },
  ];

  return (
    <div className="crm-wrap">

      {/* ── Mobile header (tablets/phones) ── */}
      <div className="crm-mobile-header">
        <div>
          <div className="cmh-logo"><span className="forma">Forma</span>Car</div>
          <div className="cmh-title">{PANEL_LABELS[panel]}</div>
        </div>
        <div className="cmh-right">
          <button className="cmh-new-btn" onClick={onNewOrder}>+ Заказ</button>
          <button className="cmh-burger" onClick={() => setDrawerOpen(o => !o)} aria-label="Меню">
            <span /><span /><span />
          </button>
        </div>
      </div>

      {/* ── Nav drawer ── */}
      {drawerOpen && <div className="crm-nav-overlay" onClick={() => setDrawerOpen(false)} />}
      <div className={`crm-nav-drawer ${drawerOpen ? 'open' : ''}`}>
        <div className="cnd-header">
          <div className="cnd-logo"><span className="forma">Forma</span>Car</div>
          <button className="cnd-close" onClick={() => setDrawerOpen(false)}>✕</button>
        </div>
        <button className="crm-btn crm-btn-add" onClick={() => { onNewOrder(); setDrawerOpen(false); }}>
          <span className="ico">+</span>Новый заказ
        </button>
        <div className="crm-group-label">Главное</div>
        {navItems.slice(0, 5).map(item => (
          <button key={item.id} className={`crm-btn ${panel === item.id ? 'active' : ''}`} onClick={() => navigate(item.id)}>
            <span className="ico">{item.ico}</span>{item.label}
          </button>
        ))}
        <div style={{ height: '1px', background: 'var(--border)', margin: '1rem 0' }} />
        <div className="crm-group-label">Настройки</div>
        {navItems.slice(5).map(item => (
          <button key={item.id} className={`crm-btn ${panel === item.id ? 'active' : ''}`} onClick={() => navigate(item.id)}>
            <span className="ico">{item.ico}</span>{item.label}
          </button>
        ))}
        <div style={{ height: '1px', background: 'var(--border)', margin: '1rem 0' }} />
        <button className="crm-btn" onClick={() => { onBackSite(); setDrawerOpen(false); }}>
          <span className="ico">←</span>На сайт
        </button>
      </div>

      <aside className="crm-sidebar" id="crm-sidebar">
        <div className="crm-sidebar-logo">
          <div className="logo-text"><span className="forma">Forma</span>Car</div>
          <div className="sub">CRM · Панель</div>
        </div>
        <button className="crm-btn crm-btn-add" onClick={onNewOrder}>
          <span className="ico">+</span>Новый заказ
        </button>
        <div className="crm-group-label">Главное</div>
        <button className={`crm-btn ${panel === 'dash' ? 'active' : ''}`} onClick={() => onPanelChange('dash')}>
          <span className="ico">📊</span>Дашборд
        </button>
        <button className={`crm-btn ${panel === 'orders' ? 'active' : ''}`} onClick={() => onPanelChange('orders')}>
          <span className="ico">📋</span>Заказы
        </button>
        <button className={`crm-btn ${panel === 'cal' ? 'active' : ''}`} onClick={() => onPanelChange('cal')}>
          <span className="ico">📅</span>Расписание
        </button>
        <button className={`crm-btn ${panel === 'clients' ? 'active' : ''}`} onClick={() => onPanelChange('clients')}>
          <span className="ico">👥</span>Клиенты
        </button>
        <button className={`crm-btn ${panel === 'analytics' ? 'active' : ''}`} onClick={() => onPanelChange('analytics')}>
          <span className="ico">📈</span>Аналитика
        </button>
        <div style={{ height: '1px', background: 'var(--border)', margin: '1rem 0' }} />
        <div className="crm-group-label">Настройки</div>
        <button className={`crm-btn ${panel === 'staff' ? 'active' : ''}`} onClick={() => onPanelChange('staff')}>
          <span className="ico">🔧</span>Персонал
        </button>
        <button className={`crm-btn ${panel === 'prices' ? 'active' : ''}`} onClick={() => onPanelChange('prices')}>
          <span className="ico">💰</span>Прайс-лист
        </button>
        <div style={{ height: '1px', background: 'var(--border)', margin: '1rem 0' }} />
        <button className="crm-btn" onClick={onBackSite}>
          <span className="ico">←</span>На сайт
        </button>
      </aside>

      <main className="crm-main" id="crm-main">
        {/* Render panel when first visited; show/hide via CSS class */}
        <div id="p-dash" className={`crm-panel ${panel === 'dash' ? 'on' : ''}`}>
          {loadedPanels.has('dash') && (
            <Dashboard
              isActive={panel === 'dash'}
              refreshKey={refreshKey}
              onNewOrder={onNewOrder}
              onOpenChecklist={onOpenChecklist}
              onNavigate={handleNavigate}
            />
          )}
        </div>

        <div id="p-orders" className={`crm-panel ${panel === 'orders' ? 'on' : ''}`}>
          {loadedPanels.has('orders') && (
            <Orders
              isActive={panel === 'orders'}
              refreshKey={refreshKey}
              onRefresh={onRefresh}
              onNewOrder={onNewOrder}
              onOpenChecklist={onOpenChecklist}
              initialFilter={ordersFilter}
              initialOrderId={ordersInitialId}
            />
          )}
        </div>

        <div id="p-cal" className={`crm-panel ${panel === 'cal' ? 'on' : ''}`}>
          {loadedPanels.has('cal') && (
            <Calendar isActive={panel === 'cal'} refreshKey={refreshKey} onNavigate={handleNavigate} />
          )}
        </div>

        <div id="p-clients" className={`crm-panel ${panel === 'clients' ? 'on' : ''}`}>
          {loadedPanels.has('clients') && (
            <Clients isActive={panel === 'clients'} />
          )}
        </div>

        <div id="p-analytics" className={`crm-panel ${panel === 'analytics' ? 'on' : ''}`}>
          {loadedPanels.has('analytics') && <Analytics isActive={panel === 'analytics'} />}
        </div>

        <div id="p-staff" className={`crm-panel ${panel === 'staff' ? 'on' : ''}`}>
          {loadedPanels.has('staff') && (
            <Staff isActive={panel === 'staff'} />
          )}
        </div>

        <div id="p-prices" className={`crm-panel ${panel === 'prices' ? 'on' : ''}`}>
          {loadedPanels.has('prices') && (
            <Prices isActive={panel === 'prices'} />
          )}
        </div>
      </main>
    </div>
  );
}
