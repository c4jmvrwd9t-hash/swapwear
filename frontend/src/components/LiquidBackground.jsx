import { useEffect, useRef } from 'react';

/* Fondo Liquid Glass: gradiente base + 5 orbes de color flotando, detrás de
   todo. Incluye el filtro de refracción SVG (#liquid) montado una sola vez.
   La animación se pausa cuando la pestaña no está visible (ahorro de batería)
   y con prefers-reduced-motion (vía CSS). */

const ORBS = [
  { c: '#FF9E80', top: '-10%', left: '-8%',  size: '48vw', dur: 16 },
  { c: '#B79CFF', top: '12%',  left: '58%',  size: '44vw', dur: 21 },
  { c: '#7FC8FF', top: '52%',  left: '-12%', size: '42vw', dur: 14 },
  { c: '#8FE3C2', top: '66%',  left: '52%',  size: '40vw', dur: 22 },
  { c: '#FF9EC8', top: '34%',  left: '24%',  size: '36vw', dur: 18 },
];

export default function LiquidBackground() {
  const ref = useRef(null);

  useEffect(() => {
    const onVis = () => {
      if (ref.current) ref.current.dataset.paused = document.hidden ? 'true' : 'false';
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  return (
    <div className="liquid-bg" ref={ref} aria-hidden="true">
      {ORBS.map((o, i) => (
        <span
          key={i}
          className="liquid-orb"
          style={{
            '--c': o.c,
            '--size': o.size,
            top: o.top,
            left: o.left,
            animationDuration: `${o.dur}s`,
            animationDelay: `${-i * 2}s`,
          }}
        />
      ))}

      {/* Filtro de refracción (mejora progresiva; solo se nota en Chromium) */}
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
        <filter id="liquid" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.012" numOctaves="2" seed="7" result="n" />
          <feGaussianBlur in="n" stdDeviation="1.4" result="nb" />
          <feDisplacementMap in="SourceGraphic" in2="nb" scale="24" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
    </div>
  );
}
