import { useState, useEffect, useRef } from 'react';
import { getServices, getCarTypes, getAdditionalServices, getSlots, createOrder } from '../../api/index.js';
import { todayISO } from '../../utils/format.js';
import { toastError, toastSuccess } from '../../components/toast.js';
import CalendarPicker from '../../components/CalendarPicker.jsx';

export default function BookingForm({ preSelectService = null }) {
  const [services, setServices] = useState([]);
  const [carTypes, setCarTypes] = useState([]);
  const [extras, setExtras] = useState([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  const [selectedService, setSelectedService] = useState(null);
  const [selectedCarType, setSelectedCarType] = useState(null);
  const [selectedExtras, setSelectedExtras] = useState(new Set());
  const [selectedTime, setSelectedTime] = useState(null);

  const [date, setDate] = useState(todayISO());
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(true);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+996');
  const [car, setCar] = useState('');
  const [plate, setPlate] = useState('');

  function handlePhoneChange(e) {
    let val = e.target.value;
    if (!val.startsWith('+996')) {
      const digits = val.replace(/\D/g, '');
      val = '+996' + digits;
    }
    setPhone(val);
  }
  const [note, setNote] = useState('');

  const [svcDropOpen, setSvcDropOpen] = useState(false);
  const svcDropRef = useRef(null);

  useEffect(() => {
    function onMouseDown(e) {
      if (svcDropRef.current && !svcDropRef.current.contains(e.target)) {
        setSvcDropOpen(false);
      }
    }
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, []);

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');

  // Load base data once
  useEffect(() => {
    async function load() {
      try {
        const [svcs, cts, exts] = await Promise.all([getServices(), getCarTypes(), getAdditionalServices()]);
        setServices(svcs);
        setCarTypes(cts);
        setExtras(exts);
        if (preSelectService) {
          const svc = svcs.find(s => s.id === preSelectService.id);
          setSelectedService(svc || null);
        }
        setDataLoaded(true);
        await loadSlots(todayISO());
      } catch {
        setDataLoaded(true);
      }
    }
    load();
  }, []);

  // Update selectedService when preSelectService prop changes after initial load
  useEffect(() => {
    if (!dataLoaded || !preSelectService) return;
    const svc = services.find(s => s.id === preSelectService.id);
    if (svc) setSelectedService(svc);
  }, [preSelectService?.id, dataLoaded]);

  // Reload slots when date changes
  useEffect(() => {
    if (dataLoaded) loadSlots(date);
  }, [date]);

  async function loadSlots(d) {
    setSlotsLoading(true);
    setSelectedTime(null);
    try {
      const data = await getSlots(d);
      setSlots(data);
    } catch {
      setSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  }

  function isSlotPast(slotTime) {
    if (date !== todayISO()) return false;
    const slotHour = Number(slotTime.split(':')[0]);
    return new Date().getHours() >= slotHour;
  }

  function toggleExtra(id) {
    setSelectedExtras(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function getSelectedPrice() {
    if (!selectedService || !selectedCarType) return null;
    return selectedService.pricing?.find(p => p.car_type_id === selectedCarType.id) || null;
  }

  function calcExtrasTotal() {
    return extras.filter(e => selectedExtras.has(e.id)).reduce((sum, e) => sum + e.price, 0);
  }

  async function handleSubmit() {
    if (!name || !phone || !car) { toastError('Заполните имя, телефон и марку авто'); return; }
    if (!selectedService) { toastError('Выберите услугу'); return; }
    if (!selectedCarType) { toastError('Выберите тип кузова'); return; }
    if (!selectedTime)    { toastError('Выберите время'); return; }

    setSubmitting(true);
    try {
      const order = await createOrder({
        client_name: name,
        client_phone: phone,
        client_car: car,
        plate_number: plate || undefined,
        service_id: selectedService.id,
        car_type_id: selectedCarType.id,
        date,
        time_slot: selectedTime,
        note,
        additional_service_ids: [...selectedExtras],
      });
      setOrderNumber(order.order_number);
      setSubmitted(true);
      toastSuccess('Запись принята! Мы свяжемся с вами.');
    } catch (err) {
      toastError(err.message || 'Ошибка при записи');
      setSubmitting(false);
    }
  }

  if (!dataLoaded) {
    return (
      <div id="booking-container">
        <div className="loading" />
      </div>
    );
  }

  const pricing = getSelectedPrice();
  const extrasTotal = calcExtrasTotal();
  const showSummary = !!selectedService;

  return (
    <div id="booking-container">
      <div className="booking-wrap">
        <div className="booking-header">
          <div>
            <h3>ФОРМА ЗАПИСИ</h3>
            <p>Заполните данные — мы подтвердим запись в WhatsApp</p>
          </div>
          <div className="booking-step">FormaCar · Бишкек</div>
        </div>
        <div className="booking-body">
          <div className="form-grid">
            {/* Name */}
            <div className="form-field">
              <label>Ваше имя</label>
              <input type="text" placeholder="Введите имя" value={name} onChange={e => setName(e.target.value)} />
            </div>
            {/* Phone */}
            <div className="form-field">
              <label>WhatsApp / Телефон</label>
              <input type="tel" placeholder="+996 700 000 000" value={phone} onChange={handlePhoneChange} />
            </div>
            {/* Car */}
            <div className="form-field">
              <label>Марка и модель</label>
              <input type="text" placeholder="Toyota Camry, BMW X5..." value={car} onChange={e => setCar(e.target.value)} />
            </div>
            {/* Plate */}
            <div className="form-field">
              <label>Гос. номер <span style={{ fontWeight: 400, opacity: 0.5 }}>(необязательно)</span></label>
              <input type="text" placeholder="01 KG 123 AB" value={plate} onChange={e => setPlate(e.target.value.toUpperCase())} />
            </div>
            {/* Service */}
            <div className="form-field" ref={svcDropRef} style={{ position: 'relative' }}>
              <label>Услуга</label>
              <button
                type="button"
                className={`svc-drop-trigger ${svcDropOpen ? 'open' : ''}`}
                onClick={() => setSvcDropOpen(o => !o)}
              >
                <span className={selectedService ? 'svc-drop-value' : 'svc-drop-placeholder'}>
                  {selectedService ? selectedService.name : '— Выберите услугу —'}
                </span>
                <svg className="svc-drop-arrow" viewBox="0 0 10 6" fill="none">
                  <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              {svcDropOpen && (
                <div className="svc-drop-menu">
                  {services.map(s => (
                    <button
                      key={s.id}
                      type="button"
                      className={`svc-drop-item ${selectedService?.id === s.id ? 'active' : ''}`}
                      onClick={() => { setSelectedService(s); setSvcDropOpen(false); }}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {/* Car type */}
            <div className="form-field full">
              <label>Тип кузова</label>
              <div className="car-type-grid">
                {carTypes.map(ct => (
                  <button
                    key={ct.id}
                    type="button"
                    className={`car-type-btn ${selectedCarType?.id === ct.id ? 'selected' : ''}`}
                    onClick={() => setSelectedCarType(ct)}
                  >
                    <span className="ct-icon">{ct.icon || '🚗'}</span>
                    <span>{ct.name}</span>
                  </button>
                ))}
              </div>
            </div>
            {/* Date */}
            <div className="form-field">
              <label>Дата</label>
              <CalendarPicker value={date} onChange={setDate} minDate={todayISO()} />
            </div>
            {/* Time */}
            <div className="form-field">
              <label>Выберите время</label>
              <div className="time-grid" id="time-grid">
                {slotsLoading ? (
                  <div className="loading" />
                ) : slots.map(slot => {
                  const past = isSlotPast(slot.time);
                  if (!slot.available || past) {
                    return (
                      <div key={slot.time} className="time-btn taken" data-time={slot.time}>
                        {slot.time}
                        <span className="time-btn-sub">{past ? 'прошло' : 'занято'}</span>
                      </div>
                    );
                  }
                  const spotsLeft = slot.spots_left ?? 6;
                  return (
                    <div
                      key={slot.time}
                      className={`time-btn ${selectedTime === slot.time ? 'selected' : ''}`}
                      onClick={() => setSelectedTime(slot.time)}
                    >
                      {slot.time}
                      {spotsLeft <= 3 && (
                        <span className="time-btn-sub" style={{ color: '#f59e0b' }}>{spotsLeft} место</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Extras */}
            {extras.length > 0 && (
              <div className="form-field full">
                <label>Дополнительные услуги (необязательно)</label>
                <div className="extras-grid">
                  {extras.map(e => (
                    <div
                      key={e.id}
                      className={`extra-item ${selectedExtras.has(e.id) ? 'selected' : ''}`}
                      onClick={() => toggleExtra(e.id)}
                    >
                      <div className="extra-check">{selectedExtras.has(e.id) ? '✓' : ''}</div>
                      <span className="extra-item-name">{e.name}</span>
                      <span className="extra-item-price">{e.is_from_price ? 'от ' : ''}{Number(e.price).toLocaleString('ru-RU')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Note */}
            <div className="form-field full">
              <label>Комментарий (необязательно)</label>
              <input type="text" placeholder="Особые пожелания..." value={note} onChange={e => setNote(e.target.value)} />
            </div>
          </div>

          {/* Price summary */}
          <div className={`booking-summary ${showSummary ? 'visible' : ''}`} id="book-sum">
            <div className="sum-row"><span>Услуга</span><span>{selectedService?.name || '—'}</span></div>
            <div className="sum-row"><span>Тип кузова</span><span>{selectedCarType ? selectedCarType.name : '— выберите тип кузова —'}</span></div>
            {selectedExtras.size > 0 && (
              <div className="sum-row"><span>Доп. услуги</span><span>{extrasTotal.toLocaleString('ru-RU')} сом</span></div>
            )}
            <div className="sum-row total">
              <span>Итого</span>
              <span>
                {pricing
                  ? (pricing.is_from_price ? 'от ' : '') + `${(pricing.price + extrasTotal).toLocaleString('ru-RU')} сом`
                  : 'Выберите тип кузова'}
              </span>
            </div>
          </div>

          {!submitted && (
            <button className="btn-submit" disabled={submitting} onClick={handleSubmit}>
              {submitting ? 'ОТПРАВЛЯЕМ...' : 'ПОДТВЕРДИТЬ ЗАПИСЬ →'}
            </button>
          )}

          {submitted && (
            <div className="success-panel visible" id="success-box">
              <div className="check">✓</div>
              <h3>ЗАПИСЬ ПРИНЯТА</h3>
              <p>Мы свяжемся с вами через WhatsApp для подтверждения.</p>
              <p>Ждём вас в FormaCar!</p>
              <div className="order-num">{`Номер заказа: ${orderNumber}`}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
