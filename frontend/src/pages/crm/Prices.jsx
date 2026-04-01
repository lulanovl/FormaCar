import { useState, useEffect } from 'react';
import { getAllServices, getCarTypes, getAllAdditionalServices, updateService, updateAdditionalService } from '../../api/index.js';
import { toastSuccess, toastError } from '../../components/toast.js';

export default function Prices({ isActive }) {
  const [services, setServices] = useState([]);
  const [carTypes, setCarTypes] = useState([]);
  const [extras, setExtras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Editable state: { [serviceId]: { pricing: { [carTypeId]: price }, is_active: bool } }
  const [svcEdits, setSvcEdits] = useState({});
  // Editable state for extras: { [extraId]: { price, is_active } }
  const [extEdits, setExtEdits] = useState({});

  const [savingSvc, setSavingSvc] = useState(false);
  const [savingExt, setSavingExt] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [svcs, cts, exts] = await Promise.all([getAllServices(), getCarTypes(), getAllAdditionalServices()]);
      setServices(svcs);
      setCarTypes(cts);
      setExtras(exts);

      // Init editable state
      const se = {};
      svcs.forEach(svc => {
        se[svc.id] = {
          is_active: svc.is_active,
          pricing: {},
        };
        cts.forEach(ct => {
          const p = svc.pricing?.find(pp => pp.car_type_id === ct.id);
          se[svc.id].pricing[ct.id] = p?.price ?? 0;
        });
      });
      setSvcEdits(se);

      const ee = {};
      exts.forEach(e => { ee[e.id] = { price: e.price, is_active: e.is_active }; });
      setExtEdits(ee);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function saveServices() {
    setSavingSvc(true);
    try {
      await Promise.all(services.map(svc => {
        const edit = svcEdits[svc.id];
        const pricing = carTypes.map(ct => ({ car_type_id: ct.id, price: Number(edit.pricing[ct.id] || 0) }));
        return updateService(svc.id, { pricing, is_active: edit.is_active });
      }));
      toastSuccess('Прайс сохранён');
    } catch (err) {
      toastError(err.message);
    } finally {
      setSavingSvc(false);
    }
  }

  async function saveExtras() {
    setSavingExt(true);
    try {
      await Promise.all(extras.map(e => {
        const edit = extEdits[e.id];
        return updateAdditionalService(e.id, { price: Number(edit.price), is_active: edit.is_active });
      }));
      toastSuccess('Сохранено');
    } catch (err) {
      toastError(err.message);
    } finally {
      setSavingExt(false);
    }
  }

  if (loading) return <><div className="crm-page-title">ПРАЙС-ЛИСТ</div><div className="loading" /></>;
  if (error) return <><div className="crm-page-title">ПРАЙС-ЛИСТ</div><div style={{ padding: '2rem', color: 'var(--gray)' }}>{error}</div></>;

  return (
    <>
      <div className="crm-page-title">ПРАЙС-ЛИСТ</div>

      {/* Services price table */}
      <div className="crm-box" style={{ border: '1px solid var(--border)', marginBottom: '2rem' }}>
        <div className="crm-box-title">Основные услуги · цены в сом</div>
        <table>
          <thead>
            <tr>
              <th>Услуга</th>
              <th>Время</th>
              {carTypes.map(ct => <th key={ct.id}>{ct.icon || ''} {ct.name}</th>)}
              <th>Активна</th>
            </tr>
          </thead>
          <tbody>
            {services.map(svc => (
              <tr key={svc.id}>
                <td style={{ fontWeight: 500 }}>{svc.name}</td>
                <td style={{ color: 'var(--gray)' }}>{svc.duration_min} мин</td>
                {carTypes.map(ct => {
                  const orig = svc.pricing?.find(pp => pp.car_type_id === ct.id);
                  return (
                    <td key={ct.id}>
                      <div className="price-cell">
                        {orig?.is_from_price && <span className="from-price-badge">от</span>}
                        <input
                          className="price-input"
                          type="number"
                          min="0"
                          step="100"
                          value={svcEdits[svc.id]?.pricing[ct.id] ?? 0}
                          onChange={e => setSvcEdits(prev => ({
                            ...prev,
                            [svc.id]: {
                              ...prev[svc.id],
                              pricing: { ...prev[svc.id].pricing, [ct.id]: e.target.value },
                            },
                          }))}
                        />
                      </div>
                    </td>
                  );
                })}
                <td>
                  <input
                    type="checkbox"
                    checked={svcEdits[svc.id]?.is_active ?? true}
                    style={{ accentColor: 'var(--red)', width: '16px', height: '16px', cursor: 'pointer' }}
                    onChange={e => setSvcEdits(prev => ({
                      ...prev,
                      [svc.id]: { ...prev[svc.id], is_active: e.target.checked },
                    }))}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button className="btn-save-price" disabled={savingSvc} onClick={saveServices}>
          {savingSvc ? 'СОХРАНЯЕМ...' : 'СОХРАНИТЬ ПРАЙС'}
        </button>
      </div>

      {/* Additional services */}
      <div className="crm-box" style={{ border: '1px solid var(--border)' }}>
        <div className="crm-box-title">Дополнительные услуги</div>
        <table>
          <thead>
            <tr><th>Услуга</th><th>Время</th><th>Цена (сом)</th><th>Активна</th></tr>
          </thead>
          <tbody>
            {extras.map(e => (
              <tr key={e.id}>
                <td style={{ fontWeight: 500 }}>{e.name}</td>
                <td style={{ color: 'var(--gray)' }}>{e.duration_min} мин</td>
                <td>
                  <div className="price-cell">
                    {e.is_from_price && <span className="from-price-badge">от</span>}
                    <input
                      className="price-input"
                      type="number"
                      min="0"
                      step="100"
                      value={extEdits[e.id]?.price ?? 0}
                      onChange={ev => setExtEdits(prev => ({
                        ...prev,
                        [e.id]: { ...prev[e.id], price: ev.target.value },
                      }))}
                    />
                  </div>
                </td>
                <td>
                  <input
                    type="checkbox"
                    checked={extEdits[e.id]?.is_active ?? true}
                    style={{ accentColor: 'var(--red)', width: '16px', height: '16px', cursor: 'pointer' }}
                    onChange={ev => setExtEdits(prev => ({
                      ...prev,
                      [e.id]: { ...prev[e.id], is_active: ev.target.checked },
                    }))}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button className="btn-save-price" disabled={savingExt} onClick={saveExtras}>
          {savingExt ? 'СОХРАНЯЕМ...' : 'СОХРАНИТЬ'}
        </button>
      </div>
    </>
  );
}
