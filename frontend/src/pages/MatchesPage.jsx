import { useState, useEffect } from 'react';
import ChatView from '../components/ChatView.jsx';
import { Stars, StarPicker } from '../components/Stars.jsx';

// ─── Rating form inline ───────────────────────────────────────────────────────
function RateForm({ me, target, onDone }) {
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    fetch(`/api/rate?rater_id=${me.id}&rated_id=${target.id}`)
      .then(r => r.json())
      .then(existing => { if (existing) { setStars(existing.stars); setComment(existing.comment || ''); } });
  }, [me.id, target.id]);

  const submit = async () => {
    if (!stars || loading) return;
    setLoading(true);
    const res = await fetch('/api/rate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rater_id: me.id, rated_id: target.id, stars, comment }),
    });
    const data = await res.json();
    setResult(data);
    setDone(true);
    setLoading(false);
    setTimeout(onDone, 1500);
  };

  if (done) {
    return (
      <div className="rate-done">
        <Stars avg={result?.avg} count={result?.count} />
        <span>¡Calificación guardada!</span>
      </div>
    );
  }

  return (
    <div className="rate-form">
      <p className="rate-label">Calificá a @{target.username}</p>
      <StarPicker value={stars} onChange={setStars} />
      <input
        className="input-field rate-comment"
        placeholder="Comentario opcional..."
        value={comment}
        onChange={e => setComment(e.target.value)}
        maxLength={120}
      />
      <div className="rate-actions">
        <button className="match-btn match-btn-outline" onClick={onDone}>Cancelar</button>
        <button className="match-btn match-btn-primary" onClick={submit} disabled={!stars || loading}>
          {loading ? '...' : 'Guardar'}
        </button>
      </div>
    </div>
  );
}

// ─── Profile sub-view ─────────────────────────────────────────────────────────
function ProfileView({ userId, onBack, onChat }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/profile/${userId}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); });
  }, [userId]);

  if (loading) {
    return (
      <div className="matches-page">
        <div className="swipe-loading"><div className="spinner" /></div>
      </div>
    );
  }

  return (
    <div className="matches-page">
      <div className="chat-header">
        <button className="back-btn" onClick={onBack}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
        <div className="profile-header-info">
          <span className="chat-header-name">@{data.user.username}</span>
          {data.user.rating && <Stars avg={data.user.rating.avg} count={data.user.rating.count} />}
        </div>
        <button className="profile-chat-btn" onClick={onChat}>Chatear</button>
      </div>

      {data.items.length === 0 ? (
        <div className="empty-state">
          <span>👗</span>
          <p>Este usuario no tiene prendas publicadas</p>
        </div>
      ) : (
        <div className="likes-grid" style={{ padding: '1rem' }}>
          {data.items.map(item => (
            <div key={item.id} className="like-card">
              <div className="like-img-wrapper">
                <img src={item.image_path} alt={item.name} className="like-img" />
                {item.tipo && item.tipo !== 'intercambio' && (
                  <div className="card-price-badge">
                    ${item.precio ? item.precio.toLocaleString('es-AR') : '—'}
                  </div>
                )}
              </div>
              <div className="like-info">
                <h4 className="like-name">{item.name || 'Prenda'}</h4>
                {item.size && <span className="item-size">Talle {item.size}</span>}
                <span className={`tipo-badge tipo-${item.tipo || 'intercambio'}`}>
                  {item.tipo === 'intercambio' ? '↔ Intercambio' : item.tipo === 'venta' ? '$ Venta' : '↔$ Ambos'}
                </span>
                {item.description && <p className="like-desc">{item.description}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Matches list ─────────────────────────────────────────────────────────────
export default function MatchesPage({ user }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list');
  const [selected, setSelected] = useState(null);
  const [ratingId, setRatingId] = useState(null); // user id being rated inline

  useEffect(() => {
    if (view !== 'list') return;
    fetch(`/api/matches?user_id=${user.id}`)
      .then(r => r.json())
      .then(data => { setMatches(data); setLoading(false); });
  }, [user.id, view]);

  const openChat    = (match) => { setSelected(match); setView('chat'); };
  const openProfile = (match) => { setSelected(match); setView('profile'); };

  const deleteChat = async (match) => {
    await fetch('/api/conversation', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id, other_id: match.user.id }),
    });
    setMatches(prev => prev.filter(m => m.user.id !== match.user.id));
  };

  if (view === 'chat' && selected) {
    return <ChatView me={user} other={selected.user} onBack={() => setView('list')} />;
  }

  if (view === 'profile' && selected) {
    return (
      <ProfileView
        userId={selected.user.id}
        onBack={() => setView('list')}
        onChat={() => setView('chat')}
      />
    );
  }

  if (loading) {
    return (
      <div className="matches-page">
        <div className="swipe-loading"><div className="spinner" /><p>Cargando matches...</p></div>
      </div>
    );
  }

  return (
    <div className="matches-page">
      <div className="page-header">
        <h2 className="page-title">Matches</h2>
        <p className="page-subtitle">
          {matches.length === 0
            ? 'Todavía nadie le dio ❤️ a tu ropa'
            : `${matches.length} ${matches.length === 1 ? 'persona' : 'personas'} le dieron ❤️ a tu ropa`}
        </p>
      </div>

      {matches.length === 0 ? (
        <div className="empty-state">
          <span>💌</span>
          <p>Cuando alguien le dé corazón a tus prendas, aparecerá acá</p>
          <p className="empty-hint">Subí más ropa para que te descubran</p>
        </div>
      ) : (
        <div className="matches-list">
          {matches.map(match => (
            <div key={match.user.id} className="match-card">
              <button className="match-delete-btn" onClick={() => deleteChat(match)} title="Eliminar chat">✕</button>
              <div className="match-avatar">{match.user.username[0].toUpperCase()}</div>
              <div className="match-info">
                <p className="match-name">@{match.user.username}</p>
                <Stars avg={match.user.rating?.avg} count={match.user.rating?.count} />
                <p className="match-item-label">Le gustó: <strong>{match.liked_item.name || 'tu prenda'}</strong></p>
              </div>
              <img src={match.liked_item.image_path} alt="" className="match-thumb" />

              {ratingId === match.user.id ? (
                <div className="match-rate-expand">
                  <RateForm
                    me={user}
                    target={match.user}
                    onDone={() => setRatingId(null)}
                  />
                </div>
              ) : (
                <div className="match-btns">
                  <button className="match-btn match-btn-outline" onClick={() => openProfile(match)}>Ver prendas</button>
                  <button className="match-btn match-btn-outline" onClick={() => setRatingId(match.user.id)}>★ Calificar</button>
                  <button className="match-btn match-btn-primary" onClick={() => openChat(match)}>Chatear</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
