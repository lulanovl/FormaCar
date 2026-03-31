export function formatPrice(price, isFromPrice = false) {
  const formatted = Number(price).toLocaleString('ru-RU');
  return isFromPrice ? `от ${formatted} сом` : `${formatted} сом`;
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-');
  return `${d}.${m}.${y}`;
}

export function formatDateTime(isoStr) {
  if (!isoStr) return '—';
  const d = new Date(isoStr);
  return d.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function todayISO() {
  return new Date().toISOString().split('T')[0];
}

export const STATUS_LABEL = {
  new:       'Новый',
  confirmed: 'Подтверждён',
  wip:       'В работе',
  done:      'Готово',
  rejected:  'Отклонён',
  no_show:   'Не явился',
};

export const STATUS_BADGE = {
  new:       'badge-new',
  confirmed: 'badge-confirmed',
  wip:       'badge-wip',
  done:      'badge-done',
  rejected:  'badge-rejected',
  no_show:   'badge-rejected',
};

export const STAFF_STATUS_LABEL = {
  working: 'В РАБОТЕ',
  break:   'ПЕРЕРЫВ',
  off:     'ВЫХОДНОЙ',
};

export const STAFF_STATUS_COLOR = {
  working: '#4caf7d',
  break:   'var(--gray)',
  off:     '#555',
};

export function getCurrentWeekDates() {
  const today = new Date();
  const day = today.getDay();
  const diffToMon = day === 0 ? -6 : 1 - day;
  const mon = new Date(today);
  mon.setDate(today.getDate() + diffToMon);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    return d.toISOString().split('T')[0];
  });
}
