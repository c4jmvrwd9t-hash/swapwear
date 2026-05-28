import { useState } from 'react';

export function Stars({ avg, count }) {
  if (avg === null || avg === undefined) {
    return <span className="stars-none">Sin calificaciones</span>;
  }
  const filled = Math.round(avg);
  return (
    <span className="stars-display">
      <span className="stars-row">
        {[1,2,3,4,5].map(i => (
          <span key={i} className={i <= filled ? 'star-on' : 'star-off'}>★</span>
        ))}
      </span>
      <span className="stars-avg">{avg}</span>
      {count !== undefined && <span className="stars-count">({count})</span>}
    </span>
  );
}

export function StarPicker({ value, onChange }) {
  const [hover, setHover] = useState(null);
  return (
    <div className="star-picker">
      {[1,2,3,4,5].map(i => (
        <button
          key={i}
          type="button"
          className={`star-pick-btn ${i <= (hover ?? value ?? 0) ? 'active' : ''}`}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(null)}
          onClick={() => onChange(i)}
        >★</button>
      ))}
    </div>
  );
}
