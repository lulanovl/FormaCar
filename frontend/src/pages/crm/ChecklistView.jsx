import { useState, useEffect, useRef } from 'react';
import { getOrder, getOrderChecklist, updateOrderChecklist, updateOrderStatus } from '../../api/index.js';
import { toastSuccess, toastError } from '../../components/toast.js';

export default function ChecklistView({ orderId, onBack }) {
  const [order, setOrder] = useState(null);
  const [categories, setCategories] = useState({}); // { [catName]: [item, ...] }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [finishing, setFinishing] = useState(false);

  const pendingRef = useRef({});
  const saveTimerRef = useRef(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    load();
    return () => clearTimeout(saveTimerRef.current);
  }, [orderId]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [ord, checklist] = await Promise.all([getOrder(orderId), getOrderChecklist(orderId)]);
      setOrder(ord);
      setCategories(checklist.categories);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function getAllItems() {
    return Object.values(categories).flat();
  }

  function toggleItem(catName, itemIndex) {
    const item = categories[catName][itemIndex];
    const isChecked = !item.is_checked;

    setCategories(prev => {
      const updated = { ...prev };
      updated[catName] = [...prev[catName]];
      updated[catName][itemIndex] = { ...item, is_checked: isChecked };
      return updated;
    });

    pendingRef.current[item.id] = { checklist_item_id: item.item_id, is_checked: isChecked };

    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(savePending, 800);
  }

  async function savePending() {
    const items = Object.values(pendingRef.current);
    if (!items.length) return;
    try {
      await updateOrderChecklist(orderId, items);
      pendingRef.current = {};
    } catch (err) {
      toastError('Ошибка сохранения: ' + err.message);
    }
  }

  async function handleFinish() {
    const allItems = getAllItems();
    const allDone = allItems.length > 0 && allItems.every(i => i.is_checked);
    if (!allDone) {
      toastError('Отметьте все пункты перед завершением');
      return;
    }
    setFinishing(true);
    await savePending();
    try {
      await updateOrderStatus(orderId, 'done');
      toastSuccess('Проверка завершена! Заказ отмечен как "Готово"');
      setTimeout(onBack, 1200);
    } catch (err) {
      toastError(err.message);
      setFinishing(false);
    }
  }

  if (loading) {
    return (
      <div className="checklist-wrap">
        <div className="loading" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="checklist-wrap">
        <div style={{ padding: '2rem', color: 'var(--gray)' }}>Ошибка загрузки: {error}</div>
      </div>
    );
  }

  const allItems = getAllItems();
  const checkedCount = allItems.filter(i => i.is_checked).length;
  const total = allItems.length;
  const percent = total ? Math.round((checkedCount / total) * 100) : 0;
  const allDone = checkedCount === total && total > 0;

  return (
    <div className="checklist-wrap">
      <button className="checklist-back" onClick={onBack}>← Вернуться к заказам</button>

      <div className="checklist-header">
        <div className="checklist-order-num">{order.order_number}</div>
        <div className="checklist-car">{order.client_name} · {order.client_car}</div>
        <div style={{ fontSize: '0.8rem', color: 'var(--gray)', marginTop: '0.3rem' }}>
          {order.service_name}{order.car_type_name ? ' · ' + order.car_type_name : ''}
        </div>
      </div>

      <div className="checklist-progress-bar">
        <div className="checklist-progress-bar-fill" style={{ width: `${percent}%` }} />
      </div>
      <div className="checklist-progress-text">{checkedCount} / {total} проверено</div>

      <div id="checklist-categories">
        {Object.entries(categories).map(([catName, items]) => (
          <div key={catName} className="checklist-category">
            <div className="checklist-category-title">{catName}</div>
            {items.map((item, idx) => (
              <div
                key={item.id}
                className={`checklist-item ${item.is_checked ? 'checked' : ''}`}
                onClick={() => toggleItem(catName, idx)}
              >
                <div className="checklist-checkbox">{item.is_checked ? '✓' : ''}</div>
                <div
                  className="checklist-item-title"
                  style={item.is_checked ? { textDecoration: 'line-through' } : {}}
                >
                  {item.title}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      <button
        className={`checklist-finish-btn ${allDone ? 'ready' : ''}`}
        disabled={finishing}
        onClick={handleFinish}
      >
        {finishing ? 'ЗАВЕРШАЕМ...' : allDone ? '✓ ЗАВЕРШИТЬ ПРОВЕРКУ' : `ВЫПОЛНЕНО ${checkedCount}/${total}`}
      </button>
    </div>
  );
}
