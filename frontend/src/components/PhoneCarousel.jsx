import { useEffect, useRef, useState } from 'react';

// Carrusel de mockups de iPhone. Las imágenes rotan solas en un stack 3D;
// se puede navegar con las flechas, el teclado o tocando una carta lateral.
export default function PhoneCarousel({
  images = [],
  interval = 3500,
  className = '',
}) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduced = usePrefersReducedMotion();
  const total = images.length;

  const go = (dir) => setActive((i) => (i + dir + total) % total);

  useEffect(() => {
    if (paused || reduced || total < 2) return;
    const id = setInterval(() => setActive((i) => (i + 1) % total), interval);
    return () => clearInterval(id);
  }, [paused, reduced, total, interval]);

  if (!total) return null;

  const onKeyDown = (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
  };

  return (
    <div
      className={`pc ${className}`}
      role="group"
      aria-roledescription="carrusel"
      aria-label="Prendas disponibles en SwapWear"
      tabIndex={0}
      onKeyDown={onKeyDown}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="pc-stage">
        {images.map((img, i) => {
          // Desplazamiento circular con signo: -1 es la carta de la izquierda.
          let offset = i - active;
          if (offset > total / 2) offset -= total;
          if (offset < -total / 2) offset += total;
          const far = Math.abs(offset) > 1;

          return (
            <div
              key={img.src}
              className="pc-slot"
              data-active={offset === 0 || undefined}
              aria-hidden={offset !== 0 || undefined}
              style={{
                '--pc-offset': offset,
                // abs()/min() en calc() son demasiado recientes para Safari:
                // se resuelven acá y llegan al CSS ya numéricos.
                '--pc-abs': Math.min(Math.abs(offset), 2),
                opacity: far ? 0 : 1,
                pointerEvents: far ? 'none' : 'auto',
                zIndex: total - Math.abs(offset),
              }}
              onClick={() => offset !== 0 && go(offset)}
            >
              <Phone image={img} priority={offset === 0} />
            </div>
          );
        })}
      </div>

      <div className="pc-controls">
        <button
          type="button"
          className="pc-arrow"
          onClick={() => go(-1)}
          aria-label="Prenda anterior"
        >
          <Chevron dir="left" />
        </button>

        <div className="pc-dots" role="tablist" aria-label="Elegir prenda">
          {images.map((img, i) => (
            <button
              key={img.src}
              type="button"
              role="tab"
              className="pc-dot"
              data-on={i === active || undefined}
              aria-selected={i === active}
              aria-label={img.alt || `Prenda ${i + 1}`}
              onClick={() => setActive(i)}
            />
          ))}
        </div>

        <button
          type="button"
          className="pc-arrow"
          onClick={() => go(1)}
          aria-label="Prenda siguiente"
        >
          <Chevron dir="right" />
        </button>
      </div>

      <p className="pc-live" aria-live="polite">
        {images[active]?.alt}
      </p>
    </div>
  );
}

function Phone({ image, priority }) {
  return (
    <div className="pc-phone">
      <div className="pc-phone-body">
        <div className="pc-island" aria-hidden="true" />
        <img
          className="pc-screen"
          src={image.src}
          alt={image.alt || ''}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          draggable="false"
        />
        {image.caption && <span className="pc-caption">{image.caption}</span>}
      </div>
      <span className="pc-btn pc-btn-power" aria-hidden="true" />
      <span className="pc-btn pc-btn-vol-up" aria-hidden="true" />
      <span className="pc-btn pc-btn-vol-dn" aria-hidden="true" />
    </div>
  );
}

function Chevron({ dir }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <path
        d={dir === 'left' ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6'}
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  const mq = useRef(null);

  useEffect(() => {
    mq.current = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.current.matches);
    const onChange = (e) => setReduced(e.matches);
    mq.current.addEventListener('change', onChange);
    return () => mq.current?.removeEventListener('change', onChange);
  }, []);

  return reduced;
}
