import { getOrder, getOrderChecklist, updateOrderChecklist, updateOrderStatus } from '../../api/index.js';
import { toastSuccess, toastError } from '../../components/toast.js';

let checkState = {
  orderId: null,
  order: null,
  checklist: null,   // { order_id, progress, categories }
  pending: {},       // { [entry_id]: is_checked }
};

export async function openChecklist(orderId) {
  checkState.orderId = orderId;
  checkState.pending = {};

  // Скрыть все остальные вью, показать чек-лист
  document.getElementById('siteView')?.classList.remove('active');
  document.getElementById('crmView')?.classList.remove('active');
  const view = document.getElementById('checklistView');
  view.style.display = 'block';
  view.classList.add('active');
  window.scrollTo(0, 0);

  const content = document.getElementById('checklist-content');
  content.innerHTML = '<div class="loading"></div>';

  try {
    [checkState.order, checkState.checklist] = await Promise.all([
      getOrder(orderId),
      getOrderChecklist(orderId),
    ]);
    renderChecklist();
  } catch (err) {
    content.innerHTML = `<div style="padding:2rem;color:var(--gray)">Ошибка загрузки: ${err.message}</div>`;
  }
}

export function closeChecklist() {
  const view = document.getElementById('checklistView');
  view.style.display = 'none';
  view.classList.remove('active');
  // Вернуться в CRM
  document.getElementById('crmView').classList.add('active');
  window.dispatchEvent(new CustomEvent('crm:refresh'));
}

function renderChecklist() {
  const { order, checklist } = checkState;
  const content = document.getElementById('checklist-content');
  const { progress, categories } = checklist;

  const categoriesHtml = Object.entries(categories).map(([catName, items]) => {
    const itemsHtml = items.map(item => `
      <div class="checklist-item ${item.is_checked ? 'checked' : ''}" data-entry-id="${item.id}" data-item-id="${item.item_id}">
        <div class="checklist-checkbox">${item.is_checked ? '✓' : ''}</div>
        <div class="checklist-item-title">${item.title}</div>
      </div>`).join('');
    return `
      <div class="checklist-category">
        <div class="checklist-category-title">${catName}</div>
        ${itemsHtml}
      </div>`;
  }).join('');

  const allDone = progress.checked === progress.total && progress.total > 0;

  content.innerHTML = `
    <button class="checklist-back" id="checklist-back-btn">← Вернуться к заказам</button>

    <div class="checklist-header">
      <div class="checklist-order-num">${order.order_number}</div>
      <div class="checklist-car">${order.client_name} · ${order.client_car}</div>
      <div style="font-size:0.8rem;color:var(--gray);margin-top:0.3rem">${order.service_name}${order.car_type_name ? ' · ' + order.car_type_name : ''}</div>
    </div>

    <div class="checklist-progress-bar">
      <div class="checklist-progress-bar-fill" id="progress-fill" style="width:${progress.percent}%"></div>
    </div>
    <div class="checklist-progress-text" id="progress-text">${progress.checked} / ${progress.total} проверено</div>

    <div id="checklist-categories">${categoriesHtml}</div>

    <button class="checklist-finish-btn ${allDone ? 'ready' : ''}" id="checklist-finish-btn">
      ${allDone ? '✓ ЗАВЕРШИТЬ ПРОВЕРКУ' : `ВЫПОЛНЕНО ${progress.checked}/${progress.total}`}
    </button>`;

  // Клики по пунктам
  content.querySelectorAll('.checklist-item').forEach(el => {
    el.addEventListener('click', () => toggleItem(el));
  });

  document.getElementById('checklist-back-btn').addEventListener('click', closeChecklist);
  document.getElementById('checklist-finish-btn').addEventListener('click', finishChecklist);
}

async function toggleItem(el) {
  const entryId = Number(el.dataset.entryId);
  const itemId  = Number(el.dataset.itemId);
  const isChecked = !el.classList.contains('checked');

  // Оптимистичное обновление UI
  el.classList.toggle('checked', isChecked);
  el.querySelector('.checklist-checkbox').textContent = isChecked ? '✓' : '';
  el.querySelector('.checklist-item-title').style.textDecoration = isChecked ? 'line-through' : '';

  // Накапливаем изменения
  checkState.pending[entryId] = { checklist_item_id: itemId, is_checked: isChecked };

  // Обновляем прогресс локально
  const allItems = document.querySelectorAll('.checklist-item');
  const checkedCount = [...allItems].filter(i => i.classList.contains('checked')).length;
  const total = allItems.length;
  const pct = total ? Math.round((checkedCount / total) * 100) : 0;

  document.getElementById('progress-fill').style.width = pct + '%';
  document.getElementById('progress-text').textContent = `${checkedCount} / ${total} проверено`;

  const finBtn = document.getElementById('checklist-finish-btn');
  if (checkedCount === total) {
    finBtn.classList.add('ready');
    finBtn.textContent = '✓ ЗАВЕРШИТЬ ПРОВЕРКУ';
  } else {
    finBtn.classList.remove('ready');
    finBtn.textContent = `ВЫПОЛНЕНО ${checkedCount}/${total}`;
  }

  // Сохранить на сервер (debounced)
  clearTimeout(toggleItem._timer);
  toggleItem._timer = setTimeout(savePending, 800);
}

async function savePending() {
  const items = Object.values(checkState.pending);
  if (!items.length) return;
  try {
    await updateOrderChecklist(checkState.orderId, items);
    checkState.pending = {};
  } catch (err) {
    toastError('Ошибка сохранения: ' + err.message);
  }
}

async function finishChecklist() {
  const btn = document.getElementById('checklist-finish-btn');
  if (!btn.classList.contains('ready')) {
    toastError('Отметьте все пункты перед завершением');
    return;
  }

  // Сохраняем все несохранённые изменения
  await savePending();

  try {
    await updateOrderStatus(checkState.orderId, 'done');
    toastSuccess('Проверка завершена! Заказ отмечен как "Готово"');
    setTimeout(closeChecklist, 1200);
  } catch (err) {
    toastError(err.message);
  }
}
