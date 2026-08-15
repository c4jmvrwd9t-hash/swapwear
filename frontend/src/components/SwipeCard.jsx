import { useState, useRef, useCallback, useEffect } from 'react';
import { Stars } from './Stars.jsx';

const THRESHOLD = 90;

export default function SwipeCard({ item, onSwipe, isTop, stackIndex, enterFrom = null }) {
  const [delta, setDelta] = useState(0);
  // Reingreso por rewind: arranca fuera de pantalla del lado por el que salió
  // y en el siguiente frame se suelta a su posición, así la transición corre.
  const [entering, setEntering] = useState(enterFrom);
  const [dragging, setDragging] = useState(false);
  const [leaving, setLeaving] = useState(null);
  const [photoIndex, setPhotoIndex] = useState(0);
  const startX = useRef(0);
  const startY = useRef(0);
  const isDragRef = useRef(false);
  const tapStartX = useRef(0);

  const photos = item.image_paths?.length ? item.image_paths : [item.image_path];

  useEffect(() => {
    if (!enterFrom) return;
    setEntering(enterFrom);
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setEntering(null)));
    return () => cancelAnimationFrame(id);
  }, [enterFrom, item.id]);

  const onStart = useCallback((clientX, clientY) => {
    if (!isTop) return;
    startX.current = clientX;
    startY.current = clientY;
    tapStartX.current = clientX;
    isDragRef.current = false;
    setDragging(true);
  }, [isTop]);

  const onMove = useCallback((clientX, clientY) => {
    if (!dragging || !isTop) return;
    const dx = clientX - startX.current;
    const dy = clientY - startY.current;
    if (!isDragRef.current && Math.abs(dx) > Math.abs(dy) + 5) {
      isDragRef.current = true;
    }
    if (isDragRef.current) setDelta(dx);
  }, [dragging, isTop]);

  const onEnd = useCallback((clientX) => {
    if (!dragging || !isTop) return;
    setDragging(false);

    if (isDragRef.current && Math.abs(delta) > THRESHOLD) {
      const liked = delta > 0;
      setLeaving(liked ? 'right' : 'left');
      setTimeout(() => onSwipe(item.id, liked), 280);
    } else if (!isDragRef.current && photos.length > 1) {
      // tap to change photo
      const tapDx = (clientX ?? tapStartX.current) - tapStartX.current;
      if (Math.abs(tapDx) < 10) {
        const cardWidth = 380;
        const tapX = (clientX ?? tapStartX.current);
        // rough center-relative tap
        if (tapX - tapStartX.current >= 0) {
          setPhotoIndex(i => Math.min(i + 1, photos.length - 1));
        } else {
          setPhotoIndex(i => Math.max(i - 1, 0));
        }
      }
      setDelta(0);
    } else {
      setDelta(0);
    }
  }, [dragging, isTop, delta, item.id, onSwipe, photos.length]);

  const rotation = delta * 0.07;
  const likeOpacity = Math.max(0, Math.min(delta / 70, 1));
  const nopeOpacity = Math.max(0, Math.min(-delta / 70, 1));

  const cardStyle = {
    zIndex: 20 - stackIndex,
    transition: dragging ? 'none' : 'transform 0.35s ease, opacity 0.35s ease',
    userSelect: 'none',
    touchAction: 'none',
  };

  if (entering) {
    // misma geometría que la salida, pero al revés
    const off = entering === 'right' ? '120vw' : entering === 'left' ? '-120vw' : '0';
    const rot = entering === 'right' ? 25 : entering === 'left' ? -25 : 0;
    cardStyle.transform = entering === 'up'
      ? 'translateY(-110vh) rotate(0deg)'
      : `translateX(${off}) rotate(${rot}deg)`;
    cardStyle.opacity = 0;
    cardStyle.transition = 'none';
  } else if (leaving) {
    cardStyle.transform = `translateX(${leaving === 'right' ? '120vw' : '-120vw'}) rotate(${leaving === 'right' ? 25 : -25}deg)`;
    cardStyle.opacity = 0;
    cardStyle.transition = 'transform 0.28s ease, opacity 0.28s ease';
  } else if (isTop) {
    cardStyle.transform = `translateX(${delta}px) rotate(${rotation}deg)`;
    if (enterFrom && !dragging) cardStyle.transition = 'transform 0.42s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.42s ease';
  } else {
    // Las cards del stack miden lo mismo que la activa (como en Tinder): la
    // profundidad la dan el offset y la opacidad, nunca la escala. El scale()
    // anterior las achicaba y producía un salto de tamaño al avanzar el índice.
    cardStyle.transform = `translateY(${stackIndex * 8}px)`;
    cardStyle.opacity = 1 - stackIndex * 0.14;
  }

  return (
    <div
      className={`swipe-card ${isTop ? 'top' : ''}`}
      style={cardStyle}
      onMouseDown={e => onStart(e.clientX, e.clientY)}
      onMouseMove={e => onMove(e.clientX, e.clientY)}
      onMouseUp={e => onEnd(e.clientX)}
      onMouseLeave={() => onEnd()}
      onTouchStart={e => onStart(e.touches[0].clientX, e.touches[0].clientY)}
      onTouchMove={e => { e.preventDefault(); onMove(e.touches[0].clientX, e.touches[0].clientY); }}
      onTouchEnd={e => onEnd(e.changedTouches[0]?.clientX)}
    >
      {isTop && (
        <>
          <div className="card-label like-label" style={{ opacity: likeOpacity }}>Me gusta</div>
          <div className="card-label nope-label" style={{ opacity: nopeOpacity }}>Paso</div>
        </>
      )}

      <div className="card-img-wrapper">
        <img
          src={photos[photoIndex]}
          alt={item.name}
          className="card-img"
          draggable={false}
        />

        {/* Photo navigation arrows */}
        {isTop && photos.length > 1 && (
          <>
            <button
              className="photo-nav photo-nav-left"
              onMouseDown={e => e.stopPropagation()}
              onClick={e => { e.stopPropagation(); setPhotoIndex(i => Math.max(i - 1, 0)); }}
              style={{ opacity: photoIndex > 0 ? 1 : 0.2 }}
            >‹</button>
            <button
              className="photo-nav photo-nav-right"
              onMouseDown={e => e.stopPropagation()}
              onClick={e => { e.stopPropagation(); setPhotoIndex(i => Math.min(i + 1, photos.length - 1)); }}
              style={{ opacity: photoIndex < photos.length - 1 ? 1 : 0.2 }}
            >›</button>
          </>
        )}

        {/* Dots indicator */}
        {photos.length > 1 && (
          <div className="photo-dots">
            {photos.map((_, i) => (
              <span key={i} className={`photo-dot ${i === photoIndex ? 'active' : ''}`} />
            ))}
          </div>
        )}
      </div>

      <div className="card-body">
        <div className="card-meta">
          <div>
            <h2 className="card-item-name">{item.name || 'Prenda'}</h2>
            <p className="card-username">@{item.username}</p>
            {item.seller_rating && <Stars avg={item.seller_rating.avg} count={item.seller_rating.count} />}
          </div>
          {item.size && <span className="card-size-badge">Talle {item.size}</span>}
        </div>
        <div className="card-chips">
          {item.garment_type && <span className="card-chip">{item.garment_type}</span>}
          {item.cut && <span className="card-chip chip-cut">{item.cut}</span>}
          {item.tipo === 'intercambio' && <span className="card-chip chip-intercambio">↔ Intercambio</span>}
          {item.tipo === 'venta' && <span className="card-chip chip-venta">${item.precio ? item.precio.toLocaleString('es-AR') : '—'}</span>}
          {item.tipo === 'ambos' && <span className="card-chip chip-ambos">↔ · ${item.precio ? item.precio.toLocaleString('es-AR') : '—'}</span>}
        </div>
        {item.description && <p className="card-description">{item.description}</p>}
        {item.measurements && (() => {
          try {
            const m = JSON.parse(item.measurements);
            const entries = Object.entries(m).filter(([,v]) => v);
            if (!entries.length) return null;
            return (
              <div className="card-measures">
                {entries.map(([k, v]) => (
                  <span key={k} className="card-measure-item">
                    <span className="measure-key">{k.replace('_', ' ')}</span> {v}cm
                  </span>
                ))}
              </div>
            );
          } catch { return null; }
        })()}
      </div>
    </div>
  );
}
