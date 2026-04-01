import { useState, useEffect } from 'react';
import { getToken, isAuthenticated } from './utils/auth.js';
import { toastInfo, toastError } from './components/toast.js';
import SitePage from './pages/site/SitePage.jsx';
import CrmPage from './pages/crm/CrmPage.jsx';
import ChecklistView from './pages/crm/ChecklistView.jsx';
import LoginModal from './components/LoginModal.jsx';
import NewOrderModal from './components/NewOrderModal.jsx';

export default function App() {
  const [view, setView] = useState('site'); // 'site' | 'crm' | 'checklist'
  const [crmPanel, setCrmPanel] = useState('dash');
  const [loginOpen, setLoginOpen] = useState(false);
  const [newOrderOpen, setNewOrderOpen] = useState(false);
  const [checklistOrderId, setChecklistOrderId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // SSE connection — active only while in CRM view
  useEffect(() => {
    if (view !== 'crm') return;
    const token = getToken();
    if (!token) return;

    const source = new EventSource(`/api/events?token=${encodeURIComponent(token)}`);

    source.addEventListener('new_order', (e) => {
      const data = JSON.parse(e.data);
      toastInfo(`Новая заявка ${data.order_number} — ${data.client_name}`);
      setRefreshKey(k => k + 1);
    });

    source.addEventListener('order_updated', () => {
      setRefreshKey(k => k + 1);
    });

    source.onerror = () => source.close();

    return () => source.close();
  }, [view]);

  // Listen for auth expiry from API client
  useEffect(() => {
    const handler = () => {
      setView('site');
      toastError('Сессия истекла, войдите снова');
    };
    window.addEventListener('auth:expired', handler);
    return () => window.removeEventListener('auth:expired', handler);
  }, []);

  function handleCrmClick() {
    if (isAuthenticated()) {
      setView('crm');
    } else {
      setLoginOpen(true);
    }
  }

  function handleOpenChecklist(orderId) {
    setChecklistOrderId(orderId);
    setView('checklist');
  }

  function handleChecklistBack() {
    setView('crm');
    setRefreshKey(k => k + 1);
  }

  return (
    <>
      {view === 'site' && (
        <SitePage onCrmClick={handleCrmClick} />
      )}
      {view === 'crm' && (
        <CrmPage
          panel={crmPanel}
          onPanelChange={setCrmPanel}
          refreshKey={refreshKey}
          onNewOrder={() => setNewOrderOpen(true)}
          onOpenChecklist={handleOpenChecklist}
          onBackSite={() => setView('site')}
        />
      )}
      {view === 'checklist' && (
        <ChecklistView
          orderId={checklistOrderId}
          onBack={handleChecklistBack}
        />
      )}
      {loginOpen && (
        <LoginModal
          onClose={() => setLoginOpen(false)}
          onSuccess={() => { setLoginOpen(false); setView('crm'); }}
        />
      )}
      {newOrderOpen && (
        <NewOrderModal
          onClose={() => setNewOrderOpen(false)}
          onSuccess={() => { setNewOrderOpen(false); setRefreshKey(k => k + 1); }}
        />
      )}
    </>
  );
}
