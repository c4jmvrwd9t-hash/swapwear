import { useState, useEffect, useCallback } from 'react';
import SwipeCard from '../components/SwipeCard.jsx';
import SubscriptionPage from './SubscriptionPage.jsx';

const GARMENTS = [
  { key: 'remera',    label: 'Remera',    icon: '👕' },
  { key: 'buzo',      label: 'Buzo',      icon: '🧶' },
  { key: 'camisa',    label: 'Camisa',    icon: '👔' },
  { key: 'musculosa', label: 'Musculosa', icon: '🎽' },
  { key: 'jean',      label: 'Jean',      icon: '👖' },
  { key: 'pantalon',  label: 'Pantalón',  icon: '👗' },
  { key: 'short',     label: 'Short',     icon: '🩳' },
  { key: 'vestido',   label: 'Vestido',   icon: '👒' },
  { key: 'falda',     label: 'Falda',     icon: '🪭' },
  { key: 'campera',   label: 'Campera',   icon: '🧥' },
  { key: 'abrigo',    label: 'Abrigo',    icon: '🥼' },
  { key: 'blazer',    label: 'Blazer',    icon: '🤵' },
];

const STYLE_TAGS = [
  '#baggy', '#streetwear', '#bootcut', '#y2k', '#vintage', '#oversized',
  '#crop', '#grunge', '#minimalist', '#aesthetic', '#thrifted', '#cottagecore',
  '#preppy', '#coquette', '#denim', '#dark', '#casual', '#retro',
  '#boho', '#sporty', '#cargo', '#floral', '#formal', '#colorful',
];

export default function SwipePage({ user }) {
  const unlimited  = user.daily_limit === null;
  const dailyLimit = unlimited ? Infinity : (user.daily_limit || 35);
  const [showSub, setShowSub] = useState(false);

  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [todayCount, setTodayCount] = useState(0);
  const [likeCount, setLikeCount] = useState(0);
  const [lastAction, setLastAction] = useState(null);
  const [empty, setEmpty] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ garment_type: '', tags: [] });
  const [pendingFilters, setPendingFilters] = useState({ garment_type: '', tags: [] });

  useEffect(() => {
    loadFeed(filters);
    fetch(`/api/stats?user_id=${user.id}`)
      .then(r => r.json())
      .then(d => { setTodayCount(d.today); setLikeCount(d.liked); });
  }, [user.id]);

  const buildQuery = (f) => {
    const params = new URLSearchParams({ user_id: user.id });
    if (f.garment_type) params.set('garment_type', f.garment_type);
    if (f.tags.length) params.set('tags', f.tags.join(','));
    return params.toString();
  };

  const loadFeed = async (f) => {
    setLoading(true);
    setEmpty(false);
    try {
      const res = await fetch(`/api/feed?${buildQuery(f)}`);
      const data = await res.json();
      setFeed(data);
      if (data.length === 0) setEmpty(true);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    setFilters(pendingFilters);
    setShowFilters(false);
    loadFeed(pendingFilters);
  };

  const clearFilters = () => {
    const cleared = { garment_type: '', tags: [] };
    setPendingFilters(cleared);
    setFilters(cleared);
    setShowFilters(false);
    loadFeed(cleared);
  };

  const toggleTag = (tag) => {
    setPendingFilters(f => ({
      ...f,
      tags: f.tags.includes(tag) ? f.tags.filter(t => t !== tag) : [...f.tags, tag],
    }));
  };

  const handleSwipe = useCallback(async (itemId, liked) => {
    const item = feed.find(i => i.id === itemId);
    setLastAction({ liked, name: item?.name || 'Prenda' });

    const res = await fetch('/api/swipe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id, item_id: itemId, liked }),
    });

    if (res.status === 429) return;

    setFeed(prev => prev.filter(i => i.id !== itemId));
    setTodayCount(c => c + 1);
    if (liked) setLikeCount(c => c + 1);
    setTimeout(() => setLastAction(null), 1100);
  }, [feed, user.id]);

  const activeFilterCount = (filters.garment_type ? 1 : 0) + filters.tags.length;
  const remaining = unlimited ? '∞' : Math.max(0, dailyLimit - todayCount);
  const progress  = unlimited ? 0 : Math.min(todayCount / dailyLimit, 1);

  if (loading) {
    return (
      <div className="swipe-page">
        <div className="swipe-loading"><div className="spinner" /><p>Cargando prendas...</p></div>
      </div>
    );
  }

  if (!unlimited && todayCount >= dailyLimit) {
    return (
      <div className="swipe-page">
        {showSub && <SubscriptionPage user={user} onClose={() => setShowSub(false)} />}
        <div className="end-state">
          <div className="end-icon">🎉</div>
          <h2>¡Límite de hoy alcanzado!</h2>
          <p>Volvé mañana para seguir explorando.</p>
          <div className="end-stats">
            <div className="stat-item">
              <span className="stat-number">{likeCount}</span>
              <span className="stat-label">Te gustaron</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{todayCount - likeCount}</span>
              <span className="stat-label">Pasaste</span>
            </div>
          </div>
          {user.promo && <p className="promo-badge-sm">🎁 Miembro fundador · {dailyLimit} swaps/día</p>}
          <button className="sub-inline-btn" onClick={() => setShowSub(true)}>
            ⚡ Swaps ilimitados con Pro
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="swipe-page">
      {/* Progress bar + filter */}
      <div className="swipe-top-bar">
        <div className="swipe-progress-wrap">
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progress * 100}%` }} />
          </div>
          <div className="progress-meta">
            <span className="progress-label">{unlimited ? '∞ swaps hoy' : `${remaining} restantes hoy`}</span>
            {unlimited ? <span className="progress-promo">⚡ Pro</span>
              : user.promo ? <span className="progress-promo">🎁 {dailyLimit}/día</span> : null}
          </div>
        </div>
        <button
          className={`filter-toggle-btn ${activeFilterCount > 0 ? 'has-filters' : ''}`}
          onClick={() => { setPendingFilters(filters); setShowFilters(v => !v); }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
            <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
          </svg>
          Filtrar
          {activeFilterCount > 0 && <span className="filter-count">{activeFilterCount}</span>}
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="filter-panel">
          <div className="filter-section">
            <p className="filter-section-title">Tipo de prenda</p>
            <div className="filter-garment-grid">
              {GARMENTS.map(g => (
                <button
                  key={g.key}
                  type="button"
                  className={`filter-garment-btn ${pendingFilters.garment_type === g.key ? 'selected' : ''}`}
                  onClick={() => setPendingFilters(f => ({ ...f, garment_type: f.garment_type === g.key ? '' : g.key }))}
                >
                  <span>{g.icon}</span>
                  <span>{g.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="filter-section">
            <p className="filter-section-title">Estilo</p>
            <div className="hashtag-suggestions">
              {STYLE_TAGS.map(tag => (
                <button
                  key={tag}
                  type="button"
                  className={`hashtag-btn ${pendingFilters.tags.includes(tag) ? 'active' : ''}`}
                  onClick={() => toggleTag(tag)}
                >{tag}</button>
              ))}
            </div>
          </div>
          <div className="filter-actions">
            <button className="btn-ghost" onClick={clearFilters}>Limpiar</button>
            <button className="btn-primary" onClick={applyFilters}>Ver resultados</button>
          </div>
        </div>
      )}

      {/* Active filter chips */}
      {activeFilterCount > 0 && !showFilters && (
        <div className="active-filters">
          {filters.garment_type && (
            <span className="active-chip">
              {GARMENTS.find(g => g.key === filters.garment_type)?.icon} {filters.garment_type}
            </span>
          )}
          {filters.tags.map(t => <span key={t} className="active-chip">{t}</span>)}
        </div>
      )}

      {/* Toast */}
      {lastAction && (
        <div className={`action-toast ${lastAction.liked ? 'toast-like' : 'toast-pass'}`}>
          {lastAction.liked ? '❤️ Guardado' : '✕ Pasaste'}
        </div>
      )}

      {/* Empty state */}
      {(empty || feed.length === 0) ? (
        <div className="end-state" style={{ flex: 1 }}>
          <div className="end-icon">{activeFilterCount > 0 ? '🔍' : '✨'}</div>
          <h2>{activeFilterCount > 0 ? 'Sin resultados' : '¡Lo viste todo!'}</h2>
          <p>{activeFilterCount > 0 ? 'No hay prendas con esos filtros.' : 'No quedan más prendas por explorar.'}</p>
          {activeFilterCount > 0
            ? <button className="btn-primary" onClick={clearFilters} style={{ marginTop: '1rem' }}>Ver todas</button>
            : <button className="btn-primary" onClick={() => loadFeed(filters)} style={{ marginTop: '1rem' }}>Recargar</button>
          }
        </div>
      ) : (
        <>
          <div className="card-stack">
            {feed.slice(0, 4).map((item, index) => (
              <SwipeCard key={item.id} item={item} onSwipe={handleSwipe} isTop={index === 0} stackIndex={index} />
            ))}
          </div>

          <div className="swipe-actions">
            <button
              className="action-btn pass-btn"
              onClick={() => feed.length && handleSwipe(feed[0].id, false)}
              title="Pasar"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="26" height="26">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
            <div
              className="swipe-counter"
              title={`${likeCount} likes hoy`}
              aria-label={`${likeCount} likes hoy`}
            >
              <span className="counter-num">💖 {likeCount}</span>
              <span className="counter-label">likes hoy</span>
            </div>
            <button
              className="action-btn like-btn"
              onClick={() => feed.length && handleSwipe(feed[0].id, true)}
              title="Me gusta"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" width="26" height="26">
                <path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z"/>
              </svg>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
