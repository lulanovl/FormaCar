# FormaCar — Project Context

> Этот файл — полная карта проекта для быстрого входа в новый контекст.
> Последнее обновление: 2026-04-02 (сессия 3)

---

## Что такое FormaCar

Веб-приложение для **премиальной автомойки в Бишкеке**. Два режима в одном SPA:
1. **Клиентский сайт** — лендинг с услугами и формой онлайн-записи
2. **CRM-панель** — внутренняя система для администратора (заказы, расписание, персонал, прайс, чеклист)

Запуск через `start.bat` в корне — поднимает оба сервера одновременно.

---

## Стек

| Слой | Технологии |
|------|-----------|
| Backend | Node.js, Express 4, Knex.js, SQLite3 (файл `backend/data/formacar.db`) |
| Frontend | React 18 + Vite 5, обычный CSS (без UI-фреймворков, без Tailwind) |
| Auth | JWT (24ч), пароль хранится в `.env` как `ADMIN_PASSWORD` |
| Real-time | SSE (Server-Sent Events) — `/api/events` |
| БД | SQLite — один файл, 11 таблиц |

---

## Структура файлов

```
FormaCar/
├── start.bat                        ← запускает backend + frontend
├── PROJECT_CONTEXT.md               ← этот файл
├── Car cleaning regulations.txt     ← оригинальный регламент (источник чеклиста)
│
├── backend/
│   ├── .env                         ← PORT, ADMIN_PASSWORD, JWT_SECRET, DB_PATH
│   ├── .env.example
│   ├── knexfile.js
│   ├── src/
│   │   ├── app.js                   ← Express entry point, порт 3001
│   │   ├── events.js                ← SSE: subscribe() + broadcast()
│   │   ├── middleware/
│   │   │   ├── auth.js              ← JWT middleware (принимает header ИЛИ ?token= для SSE)
│   │   │   └── errorHandler.js
│   │   ├── routes/
│   │   │   ├── index.js             ← монтирует все роуты под /api
│   │   │   ├── auth.js              ← POST /auth/login
│   │   │   ├── services.js          ← GET/PATCH /services, GET /services/all
│   │   │   ├── car-types.js         ← GET /car-types
│   │   │   ├── additional-services.js
│   │   │   ├── slots.js             ← GET /slots?date=YYYY-MM-DD
│   │   │   ├── orders.js            ← CRUD + /orders/admin + /orders/:id/status
│   │   │   ├── clients.js           ← GET /clients, GET /clients/:id (история)
│   │   │   ├── staff.js             ← CRUD /staff
│   │   │   ├── dashboard.js         ← GET /dashboard (KPI + график + персонал)
│   │   │   ├── checklist.js         ← GET/POST/PATCH чеклист
│   │   │   └── events.js            ← GET /events (SSE stream)
│   │   ├── controllers/             ← логика каждого роута
│   │   └── db/
│   │       ├── knex.js
│   │       ├── migrations/          ← 11 файлов (таблицы)
│   │       └── seeds/               ← 07 файлов (начальные данные)
│
└── frontend/
    ├── index.html                   ← только <div id="root">
    ├── vite.config.js               ← proxy /api → localhost:3001
    ├── package.json                 ← react 18, react-dom, @vitejs/plugin-react
    └── src/
        ├── main.jsx                 ← createRoot → <App />
        ├── App.jsx                  ← главный стейт: view, SSE, модалки
        ├── styles/
        │   └── main.css             ← ВЕСЬ CSS проекта (единый файл, ~550 строк)
        ├── api/
        │   ├── client.js            ← fetch-обёртка с Bearer token
        │   └── index.js             ← все API-функции (login, getOrders, etc.)
        ├── utils/
        │   ├── auth.js              ← saveToken/getToken/clearToken (localStorage, 24ч TTL)
        │   └── format.js            ← formatDate, formatPrice, STATUS_LABEL, STATUS_BADGE, etc.
        ├── components/
        │   ├── toast.js             ← toastSuccess/toastError/toastInfo (vanilla JS, глобальный)
        │   ├── CalendarPicker.jsx   ← компактный датапикер (trigger + popup-календарь)
        │   ├── LoginModal.jsx       ← модалка входа в CRM
        │   └── NewOrderModal.jsx    ← модалка создания заказа вручную + CalendarPicker + time grid
        ├── pages/
        │   ├── site/
        │   │   ├── SitePage.jsx     ← nav + hero + секции + footer (весь лендинг)
        │   │   ├── ServicesSection.jsx  ← карточки услуг с ценами
        │   │   └── BookingForm.jsx  ← форма записи клиента + CalendarPicker
        │   └── crm/
        │       ├── CrmPage.jsx      ← sidebar + lazy-loading панелей
        │       ├── Dashboard.jsx    ← KPI, график, персонал, заказы сегодня
        │       ├── Orders.jsx       ← список всех заказов + фильтры + поиск
        │       ├── Calendar.jsx     ← расписание: CalendarPicker + слоты по 6 мест
        │       ├── Clients.jsx      ← база клиентов + история визитов (modal)
        │       ├── Staff.jsx        ← управление персоналом (статусы, добавить/удалить)
        │       ├── Prices.jsx       ← редактор прайса (основные + доп. услуги)
        │       └── ChecklistView.jsx ← планшетный чеклист для мастера
```

---

## База данных — таблицы

| Таблица | Назначение |
|---------|-----------|
| `services` | Услуги (name, description, duration_min, is_active) |
| `service_pricing` | Цены: service_id × car_type_id → price, is_from_price |
| `car_types` | Типы кузова (седан, кроссовер, и т.д.) с иконками |
| `additional_services` | Доп. услуги с ценой и флагом is_from_price |
| `staff` | Сотрудники (name, role, initials, status: working/break/off) |
| `time_slots` | Слоты времени (09:00–19:00, шаг 1ч) |
| `orders` | Заказы: client info, service_id, car_type_id, date, time_slot, status, price_snapshot |
| `order_additional_services` | M2M заказ ↔ доп. услуга |
| `clients` | Агрегат клиентов (phone уникальный ключ, total_visits) |
| `checklist_items` | 28 пунктов чеклиста из регламента (5 категорий) |
| `order_checklist` | Состояние чеклиста per заказ (entry per item) |

---

## Ключевые бизнес-правила (важно знать)

- **6 мест на одно время** — `MAX_CARS_PER_SLOT = 6`. Проверка внутри `db.transaction()` → атомарная, без race condition.
- **Статусы заказа**: `new → confirmed → wip → done`, также `rejected`, `no_show`
- **Чеклист** инициализируется при первом открытии (`POST /checklist/order/:id/init`), сохраняется debounce 800ms
- **SSE** — `/api/events?token=JWT` (EventSource не умеет заголовки, поэтому token в query). Две события: `new_order`, `order_updated`
- **Auth middleware** принимает `Authorization: Bearer TOKEN` **или** `?token=TOKEN`
- **Клиентская запись** — без авторизации. Если клиент с таким телефоном уже есть — визиты суммируются.

---

## Цветовая схема (CSS переменные)

```css
--red: #e60000          /* главный акцент (обновлён в сессии 3) */
--red-dark: #bf0000     /* hover красного */
--red-glow: rgba(230,0,0,0.4)
--black: #050505        /* фон body (обновлён в сессии 3) */
--dark: #0b0b0b         /* секции, sidebar, crm-box */
--card: #111111         /* карточки */
--border: #1a1a1a       /* жёсткие рамки */
--border-light: rgba(255,255,255,0.07)  /* стеклянные рамки (новое) */
--border-red: rgba(230,0,0,0.35)
--white: #f0f0f0
--gray: #888            /* серый текст (обновлён, был #666) */
--silver: #bcbcbc
--glass-bg: linear-gradient(145deg, rgba(26,26,26,0.88), rgba(8,8,8,0.94))  /* новое */
```

Шрифты: `Bebas Neue` (заголовки), `Rajdhani` (лейблы/кнопки), `Inter` (текст/формы) — Google Fonts.

---

## App.jsx — навигация и стейт

```
view: 'site' | 'crm' | 'checklist'
  ├── 'site'      → <SitePage>
  ├── 'crm'       → <CrmPage panel={crmPanel}>
  └── 'checklist' → <ChecklistView orderId={...}>

Модалки (независимые от view):
  loginOpen      → <LoginModal>
  newOrderOpen   → <NewOrderModal>

SSE подключается при view === 'crm', закрывается при уходе
refreshKey (инкрементируется) → форс-обновление панелей CRM
```

---

## CalendarPicker — компонент

**Файл:** `frontend/src/components/CalendarPicker.jsx`

Компактный датапикер: одна строка с иконкой + дата → по клику всплывает popup.

```jsx
<CalendarPicker
  value="2026-04-01"       // YYYY-MM-DD
  onChange={(ds) => ...}   // ds = YYYY-MM-DD
  minDate={todayISO()}     // блокирует прошлые даты
  markedDates={new Set()}  // красные точки (дни с заказами в Calendar.jsx)
/>
```

Используется в: `BookingForm.jsx`, `Calendar.jsx` (CRM), `NewOrderModal.jsx`

В `NewOrderModal` рядом с ним — `cp-time-grid` (кнопки 09:00–19:00).

---

## Запуск проекта

```bash
# Из корня
start.bat   # Windows: запускает backend (3001) и frontend (5173)

# Или вручную:
cd backend && npm run dev     # nodemon
cd frontend && npm run dev    # vite

# Первый раз (если БД пустая):
cd backend && npm run setup   # migrate + seed

# Перезалить чеклист:
cd backend && npx knex seed:run --specific=04_checklist_items.js

# Пароль администратора:
# задан в backend/.env → ADMIN_PASSWORD=formacar2025
```

---

## Seed-данные (что уже в БД)

**Услуги (7 штук):** Стандартная мойка, Трёхфазная мойка (★ популярная), Премиум мойка, Химчистка, Полировка + керамика, Мойка днища, Антикор днища

**Типы кузова:** Седан, Хетчбэк, Кроссовер/SUV, Минивэн/Фургон (с иконками)

**Чеклист — 28 пунктов, 5 категорий:**
- Кузов (10 пунктов) — арки, пороги, диски, резинки и т.д.
- Подкапотное (2 пункта)
- Стёкла и зеркала (4 пункта)
- Салон (11 пунктов) — коврики, торпедо, сиденья и т.д.
- Финальная инспекция (1 пункт)

**Персонал:** 3 сотрудника-заготовки

**Слоты:** 08:00–23:00 (16 слотов, шаг 1ч). Мойка работает с 8 утра до 00:00, последний клиент принимается в 23:00.

---

## Что СДЕЛАНО ✅

### Backend
- [x] REST API (Express) — все эндпоинты
- [x] SQLite + Knex migrations + seeds
- [x] JWT авторизация (один пароль администратора)
- [x] Слоты: 6 мест на слот, race condition защита через transaction
- [x] SSE real-time: `new_order` + `order_updated` события
- [x] Чеклист: 28 пунктов из реального регламента компании
- [x] Dashboard KPI + недельный график
- [x] История клиентов (агрегация по телефону)
- [x] Admin-заказ (`POST /orders/admin`) — без проверки слота, для walk-in клиентов

### Frontend
- [x] Миграция с Vanilla JS на React 18 + Vite
- [x] Лендинг: Hero, услуги, форма записи, "Почему FormaCar", футер
- [x] Форма записи: услуга + тип кузова + дата + время + доп. услуги + калькулятор цены
- [x] CRM панель: Dashboard, Заказы, Расписание, Клиенты, Персонал, Прайс
- [x] Чеклист-вью (планшетный вид) с прогресс-баром и debounced сохранением
- [x] Модалка "Новый заказ" (walk-in клиенты)
- [x] SSE — автообновление CRM при новых заказах + toast уведомления
- [x] CalendarPicker — компактный датапикер (trigger + popup) в стиле проекта
- [x] Toast уведомления (success / error / info)
- [x] Расписание: 6 мест на слот, капасити-бейдж, все заказы в слоте

### UI / Адаптивка (сессия 2)
- [x] **Цены в услугах** — крупнее (`1.45rem`, `Bebas Neue`), тип кузова светлее (`--silver`)
- [x] **Мобильная адаптация лендинга** (`≤600px`):
  - Hero: `flex-direction:column`, stats-bar статичный внизу (`position:static`), кнопки на всю ширину
  - Навигация: hamburger-кнопка + мобильное меню-оверлей (`SitePage.jsx` + CSS)
  - Секции, карточки услуг, форма записи, footer — уменьшены padding, оптимизированы grid
- [x] **Мобильная адаптация CRM** (`≤900px`):
  - Скрытый sidebar заменён на sticky header с логотипом, названием раздела, кнопкой "+ Заказ" и гамбургером
  - Выезжающий drawer-навигатор (slide-in слева) с overlay (`CrmPage.jsx`)
  - Таблицы: `overflow-x:auto` + горизонтальный скролл, уменьшен padding ячеек
  - Фильтры и поиск — в колонку на узких экранах

### Баги / Фиксы (сессия 2)
- [x] **Слоты одинаковой высоты** — `min-height:52px` на `.time-btn`; раньше кнопка "занято" была выше остальных
- [x] **Галочка у доп. услуг** — нативный `<input type="checkbox" readOnly>` заменён на кастомный `<div className="extra-check">` с `✓` через React state; на iOS нативный чекбокс не обновлялся визуально
- [x] **CalendarPicker не выходит за экран** — при открытии вычисляется позиция через `getBoundingClientRect()`: если не хватает места снизу — открывается вверх; ширина попапа = ширина триггер-поля (`rect.width`)
- [x] **Просроченные слоты** — на сегодняшний день слоты с `час ≤ текущий час` показываются как "прошло" (disabled); на будущие даты не влияет (`BookingForm.jsx → isSlotPast()`)

### Сессия 3 — Дизайн и UX

#### Баги / Фиксы
- [x] **Выручка дашборда** — `SUM(price_snapshot)` заменён на `SUM(price_snapshot + extras_price)` в `dashboardController.js`; доп. услуги теперь корректно входят в дневную выручку
- [x] **Время работы** — слоты обновлены с `09:00–19:00` на `08:00–23:00` (seed + `Calendar.jsx` + `NewOrderModal.jsx`)

#### Дизайн — лендинг
- [x] **Glassmorphism редизайн** — новые CSS-переменные (`--black: #050505`, `--red: #e60000`, `--glass-bg`, `--border-light`); карточки услуг и "Почему FormaCar" получили `backdrop-filter: blur`, прозрачные рамки, hover `translateY(-6px)` с красным свечением
- [x] **Ambient orbs** — 3 размытых радиальных ореола в hero-секции (`SitePage.jsx` + CSS), создают глубину как на референсном сайте
- [x] **Убраны эмодзи из карточек услуг** — удалён массив `SERVICE_ICONS` и `<span className="service-icon">` из `ServicesSection.jsx`
- [x] **SVG-иконки в секции "Почему FormaCar"** — все 4 элемента получили единые SVG-иконки в красном цвете (химия / часы / щит / люди); заменены смешанные эмодзи
- [x] **Номера услуг** — видимость поднята с `rgba(230,0,0,0.28)` до `0.45`; список фич услуги светлее (`#888` / hover `#aaa`)
- [x] **Форма записи — кастомный dropdown** — нативный `<select>` заменён на dropdown в стиле проекта: тёмный триггер с `Rajdhani`-шрифтом, стрелка вращается при открытии, меню на тёмном фоне с красной рамкой, пункты в caps; закрывается по `mousedown` вне
- [x] **Автопрефикс телефона** — поле телефона инициализируется `+996`; если пользователь вводит цифры без кода — `+996` подставляется автоматически (`BookingForm.jsx → handlePhoneChange`)
- [x] **Форма записи — стеклянный контейнер** — `booking-wrap` получил `backdrop-filter: blur(12px)`, `box-shadow: 0 24px 64px rgba(0,0,0,0.5)`, `border-radius: 8px`

#### Дизайн — CRM
- [x] **Страница заказов — полный редизайн** (`Orders.jsx`) — таблица заменена на карточки:
  - Левый бордер меняет цвет по статусу (красный/синий/жёлтый/зелёный/серый)
  - Верхняя строка: номер + бейдж слева, дата + время (крупно) справа
  - Строка клиента: имя + марка авто + pill-кнопка WhatsApp (`wa.me/...`)
  - Кнопки действий (Принять / Отклонить / В работу / Чеклист) всегда видны без горизонтального скролла
  - Раскрытие по клику: услуга, тип кузова, сумма, комментарий в 2-колонной сетке
- [x] **WhatsApp-ссылки в заказах и клиентах** — телефоны в `Orders.jsx` и `Clients.jsx` стали кликабельными ссылками `wa.me/{digits}`, открываются в новой вкладке
- [x] **Навигация с дашборда** — KPI-карточки стали кликабельными (`kpi-link`):
  - "Заказов сегодня" → страница заказов (все)
  - "В ожидании" → страница заказов, фильтр «Новые»
  - "Клиентов всего" → страница клиентов
  - Реализовано через `onNavigate(panelId, filter)` → `CrmPage.jsx` хранит `ordersFilter` state и передаёт как `initialFilter` в `Orders.jsx`

---

## Что НЕ СДЕЛАНО ❌ (до идеала)

### Высокий приоритет
- [ ] **WhatsApp/Telegram уведомление** при новой заявке — клиент записался, владелец получает сообщение в мессенджер (Telegram Bot API проще всего)
- [x] ~~**Мобильная адаптация CRM**~~ — сделано в сессии 2
- [ ] **Фото в чеклисте** — мастер на планшете должен прикреплять фото к пунктам (camera capture)
- [ ] **Статус заказа в реальном времени** для клиента — страница `/order/FC-0001` с текущим статусом

### Средний приоритет
- [ ] **Аналитика** — графики выручки по месяцам, топ услуги, конверсия
- [ ] **Экспорт** — выгрузка заказов в Excel/CSV за период
- [ ] **Повторная запись** — кнопка "Записаться снова" в истории клиента
- [ ] **Комментарии к заказу** — мастер может добавить заметку к выполненному заказу
- [ ] **Поиск в расписании** — найти заказ по имени клиента/авто прямо в Calendar
- [ ] **Цвет кузова авто** в заказе — опциональное поле
- [ ] **Бейдж "Новых заказов"** на sidebar-кнопке (счётчик непринятых)

### Инфраструктура / Деплой
- [ ] **Production деплой** — сейчас только localhost. Нужно: сервер (VPS/Railway/Render), PostgreSQL вместо SQLite, nginx/caddy reverse proxy, HTTPS
- [ ] **Переменные окружения** — `JWT_SECRET` и `ADMIN_PASSWORD` нужно сменить перед продом
- [ ] **Смена пароля** — UI для смены пароля администратора из CRM
- [ ] **Backup БД** — автоматическое резервирование SQLite файла
- [ ] **Multi-user роли** — сейчас один пароль на всё. Нужно: owner (полный доступ) + мастер (только чеклист) + администратор (заказы)

### UX улучшения
- [ ] **Drag-and-drop в расписании** — перетаскивание заказа на другой слот
- [x] ~~**Подтверждение через WhatsApp**~~ — телефоны в заказах и клиентах стали прямыми `wa.me`-ссылками (сессия 3)
- [ ] **Напоминание клиенту** — автоматическое сообщение за 2ч до записи
- [ ] **Dark/Light тема** — сейчас только dark
- [ ] **Печать чеклиста** — кнопка print для физической распечатки

---

## Известные особенности / нюансы

1. **`toast.js` остался на Vanilla JS** — он создаёт DOM-элемент напрямую. Работает нормально с React, но если нужно — можно переписать на React portal.

2. **CalendarPicker закрывается по `mousedown` вне** — это важно, `click` не работает надёжно когда кликаешь на другой интерактивный элемент. Попап позиционируется динамически через `calcPopupStyle()` при каждом открытии — ширина = ширина триггера, вертикаль выбирается по наличию места.

3. **`Calendar.jsx` в CRM** — month/year навигация теперь управляется через `selectedDate` (вытаскиваем `year/month` из строки). При смене выбранной даты на другой месяц — автоматически перезагружает заказы для нового месяца.

4. **`ordersController.js`** — `createOrderAdmin` (walk-in) **не проверяет** лимит 6 мест. Это сознательно — администратор может поставить любое количество.

5. **`auth.js` middleware** — принимает токен из `req.query.token` ИЛИ из `Authorization: Bearer`. Нужно для SSE (EventSource не умеет кастомные заголовки).

6. **Seed checklist** — после `npm run seed` старые `order_checklist` записи удаляются (FK dependency). Если есть активные заказы с чеклистами — они сбрасываются. В продакшене надо делать аккуратно.

7. **`refreshKey` в App.jsx** — инкрементируется при SSE-событии. Пробрасывается в CRM-панели как prop. Dashboard всегда перерисовывается, остальные только если `panelLoaded.has(panel)`.

8. **Кастомный dropdown услуг в `BookingForm.jsx`** — закрывается по `mousedown` вне (не `click`). Триггер-кнопка + абсолютное меню. Стейт `svcDropOpen` + `ref` на контейнер.

9. **`ordersFilter` в `CrmPage.jsx`** — хранит текущий фильтр для страницы заказов. Устанавливается через `handleNavigate(panelId, filter)` когда пользователь кликает KPI на дашборде. Передаётся в `Orders.jsx` как `initialFilter` prop.

10. **Glassmorphism** — `--glass-bg: linear-gradient(145deg, rgba(26,26,26,0.88), rgba(8,8,8,0.94))` + `backdrop-filter: blur(10px)`. Используется в карточках услуг, секции "Почему", форме записи. Требует `overflow:hidden` на родителе чтобы `border-radius` работал корректно.

---

## API — краткий справочник

```
POST   /api/auth/login                    { password } → { token }

GET    /api/services                      активные услуги с pricing
GET    /api/services/all                  все (включая неактивные) — auth required
PATCH  /api/services/:id                  { pricing, is_active } — auth required

GET    /api/car-types
GET    /api/additional-services           активные
GET    /api/additional-services/all       — auth required
PATCH  /api/additional-services/:id       — auth required

GET    /api/slots?date=YYYY-MM-DD         → [{time, available, spots_left, spots_total}]

POST   /api/orders                        создать (клиентская запись)
POST   /api/orders/admin                  создать (walk-in, без лимита) — auth required
GET    /api/orders?status=&search=        — auth required
GET    /api/orders/:id                    — auth required
PATCH  /api/orders/:id/status             { status } — auth required

GET    /api/clients?search=               — auth required
GET    /api/clients/:id                   история клиента — auth required

GET    /api/staff                         — auth required
POST   /api/staff                         — auth required
PATCH  /api/staff/:id                     — auth required
DELETE /api/staff/:id                     — auth required

GET    /api/dashboard                     — auth required

GET    /api/checklist/items               все пункты чеклиста
GET    /api/checklist/order/:orderId      состояние чеклиста заказа
POST   /api/checklist/order/:orderId/init инициализация чеклиста
PATCH  /api/checklist/order/:orderId      { items, checked_by }

GET    /api/events?token=JWT              SSE stream — auth via query
```

---

## Цитата для быстрого старта

> Запусти `start.bat`, открой `http://localhost:5173`.  
> Войди в CRM: кнопка "⚙ Панель" → пароль `formacar2025`.  
> Если БД пустая — `cd backend && npm run setup`.
