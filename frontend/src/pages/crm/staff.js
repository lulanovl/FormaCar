import { getStaff, createStaff, updateStaff, deleteStaff } from '../../api/index.js';
import { STAFF_STATUS_LABEL, STAFF_STATUS_COLOR } from '../../utils/format.js';
import { toastSuccess, toastError } from '../../components/toast.js';

export async function renderStaff() {
  const el = document.getElementById('p-staff');
  if (!el) return;
  el.innerHTML = `
    <div class="crm-page-title">ПЕРСОНАЛ</div>
    <div id="staff-list"><div class="loading"></div></div>
    <div class="add-form" id="add-staff-form">
      <div class="form-field">
        <label>Имя</label>
        <input type="text" id="new-staff-name" placeholder="Азиз Байсалов">
      </div>
      <div class="form-field">
        <label>Должность</label>
        <input type="text" id="new-staff-role" placeholder="Мастер">
      </div>
      <button class="btn-add" id="btn-add-staff">+ Добавить</button>
    </div>`;

  document.getElementById('btn-add-staff')?.addEventListener('click', async () => {
    const name = document.getElementById('new-staff-name').value.trim();
    const role = document.getElementById('new-staff-role').value.trim();
    if (!name) { toastError('Введите имя'); return; }
    try {
      await createStaff({ name, role: role || 'Мастер' });
      document.getElementById('new-staff-name').value = '';
      document.getElementById('new-staff-role').value = '';
      toastSuccess('Сотрудник добавлен');
      loadStaff();
    } catch (err) { toastError(err.message); }
  });

  await loadStaff();
}

async function loadStaff() {
  const list = document.getElementById('staff-list');
  if (!list) return;
  list.innerHTML = '<div class="loading"></div>';
  try {
    const staff = await getStaff();
    if (!staff.length) {
      list.innerHTML = '<div style="padding:1rem;color:var(--gray)">Нет сотрудников</div>';
      return;
    }
    list.innerHTML = staff.map(s => buildStaffCard(s)).join('');
    list.addEventListener('click', handleStaffAction);
  } catch (err) {
    list.innerHTML = `<div style="padding:1rem;color:var(--gray)">${err.message}</div>`;
  }
}

function buildStaffCard(s) {
  const statusOptions = ['working','break','off'].map(st =>
    `<option value="${st}" ${s.status === st ? 'selected' : ''}>${STAFF_STATUS_LABEL[st]}</option>`
  ).join('');
  return `<div class="staff-card">
    <div class="staff-avatar ${s.status === 'off' ? 'off' : ''}">${s.initials}</div>
    <div class="staff-card-info">
      <div style="font-size:0.88rem;font-weight:500;margin-bottom:0.2rem">${s.name}</div>
      <div style="font-size:0.75rem;color:var(--gray)">${s.role}</div>
    </div>
    <div class="staff-card-actions">
      <select class="status-select" data-staff-id="${s.id}" style="color:${STAFF_STATUS_COLOR[s.status]}">${statusOptions}</select>
      <button class="act-btn danger" data-staff-delete="${s.id}">✕</button>
    </div>
  </div>`;
}

async function handleStaffAction(e) {
  // Смена статуса
  const sel = e.target.closest('[data-staff-id]');
  if (sel && sel.tagName === 'SELECT') {
    try {
      await updateStaff(Number(sel.dataset.staffId), { status: sel.value });
      sel.style.color = STAFF_STATUS_COLOR[sel.value];
      toastSuccess('Статус обновлён');
    } catch (err) { toastError(err.message); }
  }
  // Удаление
  const del = e.target.closest('[data-staff-delete]');
  if (del) {
    if (!confirm('Удалить сотрудника?')) return;
    try {
      await deleteStaff(Number(del.dataset.staffDelete));
      toastSuccess('Сотрудник удалён');
      loadStaff();
    } catch (err) { toastError(err.message); }
  }
}
