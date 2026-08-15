import { useState, useEffect, useCallback } from 'react';
import SwipeCard from '../components/SwipeCard.jsx';
import SubscriptionPage from './SubscriptionPage.jsx';
import { Icon, GarmentIcon } from '../components/Icons.jsx';

const GARMENTS = [
  { key: 'remera',    label: 'Remera'    },
  { key: 'buzo',      label: 'Buzo'      },
  { key: 'camisa',    label: 'Camisa'    },
  { key: 'musculosa', label: 'Musculosa' },
  { key: 'jean',      label: 'Jean'      },
  { key: 'pantalon',  label: 'Pantalón'  },
  { key: 'short',     label: 'Short'     },
  { key: 'vestido',   label: 'Vestido'   },
  { key: 'falda',     label: 'Falda'     },
  { key: 'campera',   label: 'Campera'   },
  { key: 'abrigo',    label: 'Abrigo'    },
  { key: 'blazer',    label: 'Blazer'    },
];

const STYLE_TAGS = [
  '#baggy', '#streetwear', '#bootcut', '#y2k', '#vintage', '#oversized',
  '#crop', '#grunge', '#minimalist', '#aesthetic', '#thrifted', '#cottagecore',
  '#preppy', '#coquette', '#denim', '#dark', '#casual', '#retro',
  '#boho', '#sporty', '#cargo', '#floral', '#formal', '#colorful',
];

// Ícono de prenda por key
function GI({ name, size = 22 }) {
  const C = GarmentIcon[name];
  return C ? <C size={size} /> : null;
}

export default function SwipePage({ user }) {
  const unlimited  = user.daily_limit === null;
  // OJO: `unlimited` es true sólo para Pro (daily_limit === null). Basic paga y
  // tiene límite 100, así que usarlo como gate dejaría afuera a un suscriptor.
  const isPlus = ['basic', 'pro'].includes(user.tier);
  const dailyLimit = unlimited ? Infinity : (user.daily_limit || 35);
  const [showSub, setShowSub] = useState(false);
  // Motivo por el que se abrió el paywall, para que el modal lo explique.
  const [subReason, setSubReason] = useState(null);
  const openSub = (reason = null) => { setSubReason(reason); setShowSub(true); };
  const closeSub = () => { setShowSub(false); setSubReason(null); };

  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [todayCount, setTodayCount] = useState(0);
  const [likeCount, setLikeCount] = useState(0);
  const [lastAction, setLastAction] = useState(null);
  // Pila de swipes deshacibles (rewind ilimitado para SwapWear+). Antes era
  // una sola prenda; ahora se apila para poder volver varias veces.
  const [history, setHistory] = useState([]);
  const [rewound, setRewound] = useState(null); // { id, dir } de la carta que reingresa
  const [spinning, setSpinning] = useState(false);
  const [notice, setNotice] = useState('');
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

  const handleSwipe = useCallback(async (itemId, liked, isSuper = false) => {
    const item = feed.find(i => i.id === itemId);
    setLastAction({ liked, isSuper, name: item?.name || 'Prenda' });
    // izquierda = nope · arriba = super · derecha = like
    const dir = isSuper ? 'up' : liked ? 'right' : 'left';
    if (item) setHistory(h => [...h, { item, liked, isSuper, dir }]);

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

  // La flecha gira siempre que se toca, haya o no prenda que recuperar.
  const spinArrow = () => {
    setSpinning(true);
    setTimeout(() => setSpinning(false), 520);
  };

  const handleUndo = async () => {
    // Exclusivo de SwapWear+: al usuario free se le abre el paywall.
    if (!isPlus) {
      openSub('Volver a la prenda anterior es parte de SwapWear+.');
      return;
    }

    spinArrow();

    if (history.length === 0) {
      setNotice('No hay prenda anterior');
      setTimeout(() => setNotice(''), 1800);
      return;
    }

    const last = history[history.length - 1];
    setHistory(h => h.slice(0, -1));

    // Reinserta al frente marcando por dónde debe reingresar
    setFeed(prev => [last.item, ...prev.filter(i => i.id !== last.item.id)]);
    setRewound({ id: last.item.id, dir: last.dir });
    setTodayCount(c => Math.max(0, c - 1));
    if (last.liked) setLikeCount(c => Math.max(0, c - 1));
    setEmpty(false);

    // Borra el swipe en el servidor: sin esto la prenda no vuelve al recargar
    // y el cupo diario seguiría consumido.
    try {
      await fetch('/api/swipe', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, item_id: last.item.id }),
      });
    } catch {
      // El rewind local ya ocurrió; un fallo de red no debe revertir la UI.
    }
  };

  // Los toasts flotan dentro del área de la carta: como .card-stack ya es
  // position:relative, quedan bien ubicados en cualquier ancho sin números
  // mágicos. Antes iban en el flujo de .ex-center y le robaban ~42px de alto
  // al stack durante 1.1s, así que la carta se encogía en cada swipe.
  const toasts = (
    <>
      {notice && (
        <div className="action-toast toast-pass" role="status" aria-live="polite">{notice}</div>
      )}
      {lastAction && (
        <div className={`action-toast ${lastAction.liked ? 'toast-like' : 'toast-pass'}`} role="status" aria-live="polite">
          {lastAction.isSuper ? '★ Super like' : lastAction.liked ? 'Me gusta' : 'Pasaste'}
        </div>
      )}
    </>
  );

  const activeFilterCount = (filters.garment_type ? 1 : 0) + filters.tags.length;
  const remaining = unlimited ? '∞' : Math.max(0, dailyLimit - todayCount);
  const progress  = unlimited ? 0 : Math.min(todayCount / dailyLimit, 1);
  const topId = feed[0]?.id;

  // ── Contenido de filtros (rail en desktop · panel toggle en mobile) ──
  const filtersBlock = (
    <aside className={`ex-rail ex-filters ${showFilters ? 'open' : ''}`} aria-label="Filtros de búsqueda">
      <p className="ex-rail-title">Tipo de prenda</p>
      <div className="filter-garment-grid">
        {GARMENTS.map(g => (
          <button
            key={g.key}
            type="button"
            className={`filter-garment-btn ${pendingFilters.garment_type === g.key ? 'selected' : ''}`}
            onClick={() => setPendingFilters(f => ({ ...f, garment_type: f.garment_type === g.key ? '' : g.key }))}
            aria-pressed={pendingFilters.garment_type === g.key}
          >
            <GI name={g.key} />
            <span>{g.label}</span>
          </button>
        ))}
      </div>
      <p className="ex-rail-title">Estilo</p>
      <div className="hashtag-suggestions">
        {STYLE_TAGS.map(tag => (
          <button
            key={tag}
            type="button"
            className={`hashtag-btn ${pendingFilters.tags.includes(tag) ? 'active' : ''}`}
            onClick={() => toggleTag(tag)}
            aria-pressed={pendingFilters.tags.includes(tag)}
          >{tag}</button>
        ))}
      </div>
      <div className="filter-actions">
        <button className="btn-ghost" onClick={clearFilters}>Limpiar</button>
        <button className="btn-primary" onClick={applyFilters}>Ver resultados</button>
      </div>
    </aside>
  );

  if (loading) return null;

  if (!unlimited && todayCount >= dailyLimit) {
    return (
      <div className="swipe-page ex">
        {showSub && <SubscriptionPage user={user} reason={subReason} onClose={closeSub} />}
        <div className="end-state">
          <div className="end-icon-wrap"><Icon.Check size={40} /></div>
          <h2>Llegaste a tu límite de hoy</h2>
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
          {user.promo && <p className="promo-badge-sm">Miembro fundador · {dailyLimit} swaps/día</p>}
          <button className="sub-inline-btn" onClick={() => openSub()}>
            <Icon.Sparkles size={18} /> Swaps ilimitados con SwapWear+
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="swipe-page ex">
      {showSub && <SubscriptionPage user={user} reason={subReason} onClose={closeSub} />}

      {/* ── Columna izquierda (desktop) / panel toggle (mobile) ── */}
      {filtersBlock}

      {/* ── Columna central: descubrir ── */}
      <section className="ex-center">
        <h1 className="sr-only">Explorar prendas</h1>
        <div className="swipe-top-bar">
          <div className="swipe-progress-wrap">
            <div className="progress-track" role="progressbar" aria-valuemin="0" aria-valuemax={unlimited ? undefined : dailyLimit} aria-valuenow={unlimited ? undefined : todayCount} aria-label="Swaps usados hoy">
              <div className="progress-fill" style={{ width: `${progress * 100}%` }} />
            </div>
            <div className="progress-meta">
              <span className="progress-label">{unlimited ? 'Swaps ilimitados' : `${remaining} swaps restantes hoy`}</span>
              {unlimited ? <span className="progress-promo">SwapWear+</span>
                : user.promo ? <span className="progress-promo">{dailyLimit}/día</span> : null}
            </div>
          </div>
          <button
            className={`filter-toggle-btn ex-mobile-only ${activeFilterCount > 0 ? 'has-filters' : ''}`}
            onClick={() => { setPendingFilters(filters); setShowFilters(v => !v); }}
            aria-label="Filtrar prendas"
          >
            <Icon.Filter size={16} />
            Filtrar
            {activeFilterCount > 0 && <span className="filter-count">{activeFilterCount}</span>}
          </button>
        </div>

        {/* Chips de filtros activos */}
        {activeFilterCount > 0 && (
          <div className="active-filters">
            {filters.garment_type && (
              <span className="active-chip">{GARMENTS.find(g => g.key === filters.garment_type)?.label || filters.garment_type}</span>
            )}
            {filters.tags.map(t => <span key={t} className="active-chip">{t}</span>)}
          </div>
        )}


        {(empty || feed.length === 0) ? (
          <div className="end-state" style={{ flex: 1, position: 'relative' }}>
            {toasts}
            <div className="end-icon-wrap">{activeFilterCount > 0 ? <Icon.Search size={38} /> : <Icon.Sparkles size={38} />}</div>
            <h2>{activeFilterCount > 0 ? 'Sin resultados' : 'Lo viste todo'}</h2>
            <p>{activeFilterCount > 0 ? 'No hay prendas con esos filtros.' : 'No quedan más prendas por explorar.'}</p>
            {activeFilterCount > 0
              ? <button className="btn-primary" onClick={clearFilters} style={{ marginTop: '1rem' }}>Ver todas</button>
              : <button className="btn-primary" onClick={() => loadFeed(filters)} style={{ marginTop: '1rem' }}>Recargar</button>}
          </div>
        ) : (
          <>
            <div className="card-stack">
              {toasts}
              {feed.slice(0, 4).map((item, index) => (
                <SwipeCard
                  key={item.id}
                  item={item}
                  onSwipe={handleSwipe}
                  isTop={index === 0}
                  stackIndex={index}
                  enterFrom={rewound?.id === item.id ? rewound.dir : null}
                />
              ))}
            </div>

            {/* El trío va absoluto y centrado sobre la barra, así el rewind de
                la izquierda no lo descentra (esté visible o no). */}
            <div className="swipe-actions">
              <button
                className={`action-btn act-undo ${!isPlus ? 'is-locked' : ''} ${spinning ? 'is-spinning' : ''}`}
                onClick={handleUndo}
                aria-label={isPlus ? 'Volver a la prenda anterior' : 'Volver a la prenda anterior (exclusivo de SwapWear+)'}
              >
                <Icon.Undo />
                {!isPlus && (
                  <span className="act-lock" aria-hidden="true"><Icon.Lock size={12} /></span>
                )}
              </button>

              <div className="swipe-actions-main">
                <button className="action-btn act-pass" onClick={() => topId && handleSwipe(topId, false)} aria-label="Pasar">
                  <Icon.X />
                </button>
                <button className="action-btn act-super" onClick={() => topId && handleSwipe(topId, true, true)} aria-label="Super like">
                  <Icon.Star />
                </button>
                <button className="action-btn act-like" onClick={() => topId && handleSwipe(topId, true)} aria-label="Me gusta">
                  <Icon.Heart />
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      {/* ── Columna derecha (desktop): actividad ── */}
      <aside className="ex-rail ex-activity ex-desktop-only" aria-label="Tu actividad de hoy">
        <p className="ex-rail-title">Tu actividad de hoy</p>
        <div className="ex-stat-grid">
          <div className="ex-stat"><span className="ex-stat-num">{likeCount}</span><span className="ex-stat-lbl">Me gusta</span></div>
          <div className="ex-stat"><span className="ex-stat-num">{todayCount}</span><span className="ex-stat-lbl">Vistas</span></div>
          <div className="ex-stat"><span className="ex-stat-num">{remaining}</span><span className="ex-stat-lbl">Restantes</span></div>
        </div>
        {!unlimited && (
          <div className="ex-plus-card">
            <Icon.Sparkles size={22} />
            <strong>SwapWear+</strong>
            <span>Swaps y prendas sin límite, y aparecés primero.</span>
            <button className="btn-primary" onClick={() => openSub()}>Conocer SwapWear+</button>
          </div>
        )}
      </aside>
    </div>
  );
}
