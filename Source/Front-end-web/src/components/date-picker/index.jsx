import { useState, useEffect } from 'react';
import './date-picker.css';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

function useCurrentTime() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const fmt = () => {
      const d = new Date();
      let h = d.getHours();
      const m = d.getMinutes();
      const ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12 || 12;
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
    };
    setTime(fmt());
    const id = setInterval(() => setTime(fmt()), 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

export default function DatePicker({ selectedDate, onSelectDate }) {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const time = useCurrentTime();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const isToday = (day) =>
    day === now.getDate() &&
    viewMonth === now.getMonth() &&
    viewYear === now.getFullYear();

  const isSelected = (day) =>
    selectedDate &&
    day === selectedDate.getDate() &&
    viewMonth === selectedDate.getMonth() &&
    viewYear === selectedDate.getFullYear();

  const todaySuppressed = !!selectedDate;

  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`e-${i}`} className="cal-day empty" />);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const todayClass = isToday(day)
      ? todaySuppressed ? 'today date-selected-active' : 'today'
      : '';
    const selectedClass = isSelected(day) ? 'selected' : '';

    days.push(
      <div
        key={day}
        className={`cal-day ${todayClass} ${selectedClass}`.trim()}
        onClick={() => onSelectDate(new Date(viewYear, viewMonth, day))}
      >
        {day}
      </div>
    );
  }

  return (
    <div className="calendar-card">
      <div className="cal-header">
        <div className="cal-title">
          {MONTHS[viewMonth]} {viewYear}
          <span className="cal-arrow">▶</span>
        </div>
        <div className="cal-nav">
          <button onClick={prevMonth}>&#8249;</button>
          <button onClick={nextMonth}>&#8250;</button>
        </div>
      </div>

      <div className="cal-grid">
        {DAYS.map(d => <div key={d} className="cal-dow">{d}</div>)}
        {days}
      </div>

    </div>
  );
}