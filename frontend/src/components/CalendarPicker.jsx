import { useState, useRef, useEffect } from 'react';

const MONTHS_RU = [
  'Январь','Февраль','Март','Апрель','Май','Июнь',
  'Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь',
];
const DAYS_SHORT = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];

function pad(n) { return String(n).padStart(2, '0'); }
function toISO(y, m, d) { return `${y}-${pad(m + 1)}-${pad(d)}`; }
function parseDate(str) {
  if (!str) return new Date();
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}
function formatDisplay(str) {
  if (!str) return '';
  const [y, m, d] = str.split('-');
  return `${d}.${m}.${y}`;
}

/**
 * CalendarPicker — compact date field + popup calendar
 * @param {string}   value        YYYY-MM-DD
 * @param {function} onChange     (YYYY-MM-DD) => void
 * @param {string}   [minDate]    YYYY-MM-DD – days before this are disabled
 * @param {Set}      [markedDates] Set<YYYY-MM-DD> – red dot indicators
 */
export default function CalendarPicker({ value, onChange, minDate, markedDates }) {
  const [open, setOpen] = useState(false);
  const [popupStyle, setPopupStyle] = useState({});
  const ref = useRef(null);

  const today = new Date().toISOString().split('T')[0];
  const initial = value ? parseDate(value) : new Date();
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  // Close on outside click
  useEffect(() => {
    function onOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [open]);

  // Calculate popup position to avoid viewport overflow
  function calcPopupStyle() {
    if (!ref.current) return {};
    const rect = ref.current.getBoundingClientRect();
    const popupW = rect.width; // match trigger width exactly
    const popupH = 290;
    const style = { width: popupW };
    // Horizontal: always left-aligned (same width = no overflow)
    style.left = 0;
    style.right = 'auto';
    // Vertical: open upward if not enough space below
    if (rect.bottom + popupH > window.innerHeight) {
      style.top = 'auto';
      style.bottom = 'calc(100% + 4px)';
    } else {
      style.top = 'calc(100% + 4px)';
      style.bottom = 'auto';
    }
    return style;
  }

  // Sync view when value changes externally
  useEffect(() => {
    if (value) {
      const d = parseDate(value);
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
    }
  }, [value]);

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  function selectDay(d) {
    const ds = toISO(viewYear, viewMonth, d);
    if (minDate && ds < minDate) return;
    onChange(ds);
    setOpen(false);
  }

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const offset = firstDay === 0 ? 6 : firstDay - 1;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const displayValue = value ? formatDisplay(value) : formatDisplay(today);

  return (
    <div className="cp-root" ref={ref}>
      {/* Trigger */}
      <button
        type="button"
        className={`cp-trigger ${open ? 'cp-trigger-open' : ''}`}
        onClick={() => { const s = calcPopupStyle(); setPopupStyle(s); setOpen(o => !o); }}
      >
        <svg className="cp-icon" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="4" width="14" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
          <path d="M3 8h14" stroke="currentColor" strokeWidth="1.4"/>
          <path d="M7 2v3M13 2v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
        <span className="cp-display">{displayValue}</span>
        <svg className="cp-chevron" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Popup */}
      {open && (
        <div className="cp-popup" style={popupStyle}>
          {/* Month nav */}
          <div className="cp-popup-head">
            <button type="button" className="cp-arr" onClick={prevMonth}>‹</button>
            <span className="cp-popup-month">{MONTHS_RU[viewMonth]} {viewYear}</span>
            <button type="button" className="cp-arr" onClick={nextMonth}>›</button>
          </div>

          {/* Day grid */}
          <div className="cp-popup-grid">
            {DAYS_SHORT.map(d => (
              <div key={d} className="cp-g-hdr">{d}</div>
            ))}
            {Array.from({ length: offset }, (_, i) => (
              <div key={`e${i}`} className="cp-g-empty" />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const d = i + 1;
              const ds = toISO(viewYear, viewMonth, d);
              const isToday    = ds === today;
              const isSelected = ds === value;
              const isDisabled = minDate ? ds < minDate : false;
              const isMarked   = markedDates?.has(ds) && !isSelected;

              return (
                <div
                  key={d}
                  className={[
                    'cp-g-day',
                    isToday    ? 'cp-g-today'    : '',
                    isSelected ? 'cp-g-selected' : '',
                    isDisabled ? 'cp-g-disabled' : '',
                    isMarked   ? 'cp-g-marked'   : '',
                  ].filter(Boolean).join(' ')}
                  onClick={() => !isDisabled && selectDay(d)}
                >
                  {d}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
