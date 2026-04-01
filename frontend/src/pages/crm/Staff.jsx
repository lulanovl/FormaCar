import { useState, useEffect } from 'react';
import { getStaff, createStaff, updateStaff, deleteStaff } from '../../api/index.js';
import { STAFF_STATUS_LABEL, STAFF_STATUS_COLOR } from '../../utils/format.js';
import { toastSuccess, toastError } from '../../components/toast.js';

export default function Staff({ isActive }) {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setStaff(await getStaff());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd() {
    if (!newName.trim()) { toastError('Введите имя'); return; }
    setAdding(true);
    try {
      await createStaff({ name: newName.trim(), role: newRole.trim() || 'Мастер' });
      setNewName('');
      setNewRole('');
      toastSuccess('Сотрудник добавлен');
      load();
    } catch (err) {
      toastError(err.message);
    } finally {
      setAdding(false);
    }
  }

  async function handleStatusChange(id, status) {
    try {
      await updateStaff(id, { status });
      setStaff(prev => prev.map(s => s.id === id ? { ...s, status } : s));
      toastSuccess('Статус обновлён');
    } catch (err) {
      toastError(err.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Удалить сотрудника?')) return;
    try {
      await deleteStaff(id);
      toastSuccess('Сотрудник удалён');
      load();
    } catch (err) {
      toastError(err.message);
    }
  }

  return (
    <>
      <div className="crm-page-title">ПЕРСОНАЛ</div>

      {loading ? (
        <div className="loading" />
      ) : error ? (
        <div style={{ padding: '1rem', color: 'var(--gray)' }}>{error}</div>
      ) : staff.length === 0 ? (
        <div style={{ padding: '1rem', color: 'var(--gray)' }}>Нет сотрудников</div>
      ) : (
        <div id="staff-list">
          {staff.map(s => (
            <div key={s.id} className="staff-card">
              <div className={`staff-avatar ${s.status === 'off' ? 'off' : ''}`}>{s.initials}</div>
              <div className="staff-card-info">
                <div style={{ fontSize: '0.88rem', fontWeight: 500, marginBottom: '0.2rem' }}>{s.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--gray)' }}>{s.role}</div>
              </div>
              <div className="staff-card-actions">
                <select
                  className="status-select"
                  value={s.status}
                  style={{ color: STAFF_STATUS_COLOR[s.status] }}
                  onChange={(e) => handleStatusChange(s.id, e.target.value)}
                >
                  {['working', 'break', 'off'].map(st => (
                    <option key={st} value={st}>{STAFF_STATUS_LABEL[st]}</option>
                  ))}
                </select>
                <button className="act-btn danger" onClick={() => handleDelete(s.id)}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="add-form">
        <div className="form-field">
          <label>Имя</label>
          <input type="text" placeholder="Азиз Байсалов" value={newName} onChange={e => setNewName(e.target.value)} />
        </div>
        <div className="form-field">
          <label>Должность</label>
          <input type="text" placeholder="Мастер" value={newRole} onChange={e => setNewRole(e.target.value)} />
        </div>
        <button className="btn-add" disabled={adding} onClick={handleAdd}>
          {adding ? 'Добавляем...' : '+ Добавить'}
        </button>
      </div>
    </>
  );
}
