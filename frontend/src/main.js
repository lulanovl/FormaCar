import './styles/main.css';
import { saveToken, getToken, clearToken, isAuthenticated } from './utils/auth.js';
import { login } from './api/index.js';
import { toastError, toastSuccess } from './components/toast.js';

import { renderServicesSection } from './pages/site/services-section.js';
import { renderBookingForm, scrollToBooking } from './pages/site/booking-form.js';

import { renderDashboard } from './pages/crm/dashboard.js';
import { renderOrders }    from './pages/crm/orders.js';
import { renderCalendar }  from './pages/crm/calendar.js';
import { renderClients }   from './pages/crm/clients.js';
import { renderStaff }     from './pages/crm/staff.js';
import { renderPrices }    from './pages/crm/prices.js';

import { openChecklist, closeChecklist } from './pages/crm/checklist-view.js';
import { openNewOrderModal } from './components/new-order-modal.js';

// ─── State ───────────────────────────────────────────────────────────────────
let currentView = 'site';   // 'site' | 'crm'
let currentPanel = 'dash';
let panelLoaded  = new Set();

// ─── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initLoginModal();
  initOrderModal();
  initSidebarNav();

  // Load client site
  renderServicesSection((svc) => scrollToBooking(svc));
  renderBookingForm();

  // Global events from CRM panels
  window.addEventListener('crm:new-order', openNewOrderModal);
  window.addEventListener('crm:open-checklist', (e) => openChecklist(e.detail.orderId));
  window.addEventListener('crm:refresh', () => {
    panelLoaded.clear();
    if (currentView === 'crm') loadPanel(currentPanel);
  });
  window.addEventListener('auth:expired', () => {
    showSite();
    toastError('Сессия истекла, войдите снова');
  });
});

// ─── Navigation ───────────────────────────────────────────────────────────────
function initNav() {
  document.getElementById('nav-logo')?.addEventListener('click', showSite);
  document.getElementById('btn-back-site')?.addEventListener('click', showSite);
  document.getElementById('btn-book')?.addEventListener('click', () => scrollToBooking());
  document.getElementById('hero-book-btn')?.addEventListener('click', () => scrollToBooking());
  document.getElementById('btn-crm')?.addEventListener('click', handleCrmClick);
}

// Smooth scroll for nav links
window.scrollTo = window.scrollTo; // keep native
window.scrollToSection = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
// Patch nav links
document.querySelectorAll('nav ul a[onclick]').forEach(a => {
  const match = a.getAttribute('onclick').match(/scrollTo\('(.+?)'\)/);
  if (match) {
    a.removeAttribute('onclick');
    a.addEventListener('click', () => document.getElementById(match[1])?.scrollIntoView({ behavior: 'smooth' }));
  }
});

function showSite() {
  currentView = 'site';
  document.getElementById('siteView').classList.add('active');
  document.getElementById('crmView').classList.remove('active');
  document.getElementById('checklistView').style.display = 'none';
  window.scrollTo(0, 0);
}

function showCRM() {
  currentView = 'crm';
  document.getElementById('siteView').classList.remove('active');
  document.getElementById('crmView').classList.add('active');
  document.getElementById('checklistView').style.display = 'none';
  window.scrollTo(0, 0);
  loadPanel(currentPanel);
}

// ─── Login ────────────────────────────────────────────────────────────────────
function handleCrmClick() {
  if (isAuthenticated()) {
    showCRM();
  } else {
    openLoginModal();
  }
}

function initLoginModal() {
  const modal   = document.getElementById('loginModal');
  const closeBtn = document.getElementById('login-modal-close');
  const submitBtn = document.getElementById('login-submit');
  const pwdInput  = document.getElementById('login-password');
  const errEl     = document.getElementById('login-error');

  closeBtn?.addEventListener('click', () => modal.classList.remove('open'));
  modal?.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('open'); });

  const doLogin = async () => {
    const pwd = pwdInput.value;
    if (!pwd) return;
    submitBtn.disabled = true;
    submitBtn.textContent = 'ВХОДИМ...';
    errEl.style.display = 'none';
    try {
      const { token } = await login(pwd);
      saveToken(token);
      modal.classList.remove('open');
      pwdInput.value = '';
      toastSuccess('Добро пожаловать в CRM');
      showCRM();
    } catch {
      errEl.textContent = 'Неверный пароль';
      errEl.style.display = 'block';
    }
    submitBtn.disabled = false;
    submitBtn.textContent = 'ВОЙТИ';
  };

  submitBtn?.addEventListener('click', doLogin);
  pwdInput?.addEventListener('keydown', (e) => { if (e.key === 'Enter') doLogin(); });
}

function openLoginModal() {
  document.getElementById('loginModal')?.classList.add('open');
  setTimeout(() => document.getElementById('login-password')?.focus(), 100);
}

// ─── Order modal (shared: new order + client history) ─────────────────────────
function initOrderModal() {
  const modal   = document.getElementById('orderModal');
  const closeBtn = document.getElementById('order-modal-close');
  closeBtn?.addEventListener('click', () => modal.classList.remove('open'));
  modal?.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('open'); });
}

// ─── CRM Sidebar navigation ───────────────────────────────────────────────────
const PANEL_RENDERERS = {
  dash:    renderDashboard,
  orders:  renderOrders,
  cal:     renderCalendar,
  clients: renderClients,
  staff:   renderStaff,
  prices:  renderPrices,
};

function initSidebarNav() {
  document.querySelectorAll('.crm-btn[data-panel]').forEach(btn => {
    btn.addEventListener('click', () => {
      const panel = btn.dataset.panel;
      switchPanel(panel);
    });
  });
}

function switchPanel(panel) {
  currentPanel = panel;
  // Update sidebar active state
  document.querySelectorAll('.crm-btn[data-panel]').forEach(b => {
    b.classList.toggle('active', b.dataset.panel === panel);
  });
  // Show/hide panels
  document.querySelectorAll('.crm-panel').forEach(p => p.classList.remove('on'));
  document.getElementById(`p-${panel}`)?.classList.add('on');
  loadPanel(panel);
}

function loadPanel(panel) {
  const renderer = PANEL_RENDERERS[panel];
  if (!renderer) return;
  // Always re-render dashboard; others — only on first load or after refresh
  if (panel === 'dash' || !panelLoaded.has(panel)) {
    renderer();
    panelLoaded.add(panel);
  }
}
