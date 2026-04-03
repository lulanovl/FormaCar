import { useState, useEffect } from 'react';
import { getServices, getCarTypes, getAllAdditionalServices, createOrderAdmin } from '../api/index.js';
import { todayISO } from '../utils/format.js';
import { toastSuccess } from './toast.js';
import CalendarPicker from './CalendarPicker.jsx';

const TIME_SLOTS = [
  '08:00','09:00','10:00','11:00','12:00',
  '13:00','14:00','15:00','16:00','17:00',
  '18:00','19:00','20:00','21:00','22:00','23:00',
];

const FIELD_LABEL = { fontFamily: "'Rajdhani',sans-serif", fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--gray)', marginBottom: '0.5rem' };

export default function NewOrderModal({ onClose, onSuccess }) {
  const [services, setServices] = useState([]);
  const [carTypes, setCarTypes] = useState([]);
  const [extras, setExtras] = useState([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [car, setCar] = useState('');
  const [plate, setPlate] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [carTypeId, setCarTypeId] = useState(null);
  const [selectedExtras, setSelectedExtras] = useState(new Set());
  const [date, setDate] = useState(todayISO());
  const [time, setTime] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([getServices(), getCarTypes(), getAllAdditionalServices()])
      .then(([svcs, cts, exts]) => { setServices(svcs); setCarTypes(cts); setExtras(exts); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  function toggleExtra(id) {
    setSelectedExtras(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function handleSubmit() {
    setError('');
    if (!name)      return setError('Введите имя клиента');
    if (!phone)     return setError('Введите телефон');
    if (!car)       return setError('Введите марку авто');
    if (!serviceId) return setError('Выберите услугу');
    if (!carTypeId) return setError('Выберите тип кузова');
    if (!date)      return setError('Укажите дату');
    if (!time)      return setError('Выберите время');

    setSubmitting(true);
    try {
      const order = await createOrderAdmin({
        client_name: name,
        client_phone: phone,
        client_car: car,
        plate_number: plate || undefined,
        service_id: Number(serviceId),
        car_type_id: carTypeId,
        additional_service_ids: [...selectedExtras],
        date,
        time_slot: time,
        note,
      });
      toastSuccess(`Заказ ${order.order_number} создан`);
      onSuccess();
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-bg open" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <button className="modal-x" onClick={onClose}>×</button>
        <div className="modal-title">НОВЫЙ ЗАКАЗ</div>
        <div className="modal-sub">Ручное добавление записи</div>

        {loading ? (
          <div className="loading" />
        ) : (
          <div className="mform">
            {/* Client info */}
            <input type="text" placeholder="Имя клиента" value={name} onChange={(e) => setName(e.target.value)} />
            <input type="tel" placeholder="Телефон" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <input type="text" placeholder="Марка и модель авто" value={car} onChange={(e) => setCar(e.target.value)} />
            <input type="text" placeholder="Гос. номер (необязательно)" value={plate} onChange={(e) => setPlate(e.target.value.toUpperCase())} />

            {/* Service */}
            <select value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
              <option value="">— Выберите услугу —</option>
              {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>

            {/* Car type */}
            <div>
              <div style={FIELD_LABEL}>Тип кузова</div>
              <div className="car-type-grid mform-ct">
                {carTypes.map(ct => (
                  <button
                    key={ct.id}
                    type="button"
                    className={`car-type-btn ${carTypeId === ct.id ? 'selected' : ''}`}
                    onClick={() => setCarTypeId(ct.id)}
                  >
                    <span className="ct-icon">{ct.icon || '🚗'}</span>
                    <span>{ct.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Additional services */}
            {extras.length > 0 && (
              <div>
                <div style={FIELD_LABEL}>Доп. услуги (необязательно)</div>
                <div className="mform-extras">
                  {extras.map(e => (
                    <label key={e.id} className={`mform-extra-item ${selectedExtras.has(e.id) ? 'selected' : ''}`}>
                      <input
                        type="checkbox"
                        checked={selectedExtras.has(e.id)}
                        onChange={() => toggleExtra(e.id)}
                      />
                      <span className="mform-extra-name">{e.name}</span>
                      <span className="mform-extra-price">{Number(e.price).toLocaleString('ru-RU')} сом</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Date */}
            <div>
              <div style={FIELD_LABEL}>Дата</div>
              <CalendarPicker value={date} onChange={setDate} minDate={todayISO()} />
            </div>

            {/* Time */}
            <div>
              <div style={FIELD_LABEL}>Время</div>
              <div className="cp-time-grid">
                {TIME_SLOTS.map(t => (
                  <button
                    key={t}
                    type="button"
                    className={`cp-time-btn ${time === t ? 'cp-time-selected' : ''}`}
                    onClick={() => setTime(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Note */}
            <input type="text" placeholder="Комментарий (необязательно)" value={note} onChange={(e) => setNote(e.target.value)} />

            {error && <p className="error-msg">{error}</p>}
            <button className="btn-primary" style={{ clipPath: 'none' }} disabled={submitting} onClick={handleSubmit}>
              {submitting ? 'СОЗДАЁМ...' : 'СОЗДАТЬ ЗАКАЗ'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
