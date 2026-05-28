import { useState, useEffect } from 'react';
import ChatView from '../components/ChatView.jsx';
import { Stars, StarPicker } from '../components/Stars.jsx';

function RateInline({ me, target, onDone }) {
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetch(`/api/rate?rater_id=${me.id}&rated_id=${target.id}`)
      .then(r => r.json())
      .then(existing => { if (existing) { setStars(existing.stars); setComment(existing.comment || ''); } });
  }, [me.id, target.id]);

  const submit = async () => {
    if (!stars || loading) return;
    setLoading(true);
    await fetch('/api/rate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rater_id: me.id, rated_id: target.id, stars, comment }),
    });
    setDone(true);
    setLoading(false);
    setTimeout(onDone, 1200);
  };

  if (done) return <div className="rate-done"><span>¡Calificado! {'★'.repeat(stars)}</span></div>;

  return (
    <div className="rate-form">
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

export default function LikesPage({ user }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chatTarget, setChatTarget] = useState(null);
  const [ratingTarget, setRatingTarget] = useState(null); // item.id being rated

  useEffect(() => {
    fetch(`/api/likes?user_id=${user.id}`)
      .then(r => r.json())
      .then(data => { setItems(data); setLoading(false); });
  }, [user.id]);

  if (chatTarget) {
    return <ChatView me={user} other={chatTarget} onBack={() => setChatTarget(null)} />;
  }

  if (loading) {
    return (
      <div className="likes-page">
        <div className="swipe-loading"><div className="spinner" /><p>Cargando guardados...</p></div>
      </div>
    );
  }

  return (
    <div className="likes-page">
      <div className="page-header">
        <h2 className="page-title">Guardados</h2>
        <p className="page-subtitle">{items.length} {items.length === 1 ? 'prenda' : 'prendas'} que te gustaron</p>
      </div>

      {items.length === 0 ? (
        <div className="empty-state">
          <span>💔</span>
          <p>Todavía no guardaste ninguna prenda</p>
          <p className="empty-hint">Deslizá a la derecha para guardar las que te gustan</p>
        </div>
      ) : (
        <div className="likes-grid">
          {items.map(item => (
            <div key={item.id} className="like-card">
              <div className="like-img-wrapper">
                <img src={item.image_path} alt={item.name} className="like-img" />
                <div className="like-badge">❤️</div>
                {item.tipo && item.tipo !== 'intercambio' && item.precio && (
                  <div className="card-price-badge">${item.precio.toLocaleString('es-AR')}</div>
                )}
              </div>
              <div className="like-info">
                <h4 className="like-name">{item.name || 'Prenda'}</h4>
                <p className="like-user">@{item.username}</p>
                {item.seller_rating && (
                  <Stars avg={item.seller_rating.avg} count={item.seller_rating.count} />
                )}
                {item.size && <span className="item-size">Talle {item.size}</span>}
                <span className={`tipo-badge tipo-${item.tipo || 'intercambio'}`}>
                  {item.tipo === 'intercambio' || !item.tipo ? '↔ Intercambio'
                    : item.tipo === 'venta' ? '$ Venta' : '↔$ Ambos'}
                </span>
                {item.description && <p className="like-desc">{item.description}</p>}

                {ratingTarget === item.id ? (
                  <RateInline
                    me={user}
                    target={{ id: item.user_id, username: item.username }}
                    onDone={() => setRatingTarget(null)}
                  />
                ) : (
                  <div className="like-actions">
                    <button
                      className="like-chat-btn"
                      onClick={() => setChatTarget({ id: item.user_id, username: item.username })}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                      </svg>
                      Chatear
                    </button>
                    <button
                      className="like-chat-btn"
                      onClick={() => setRatingTarget(item.id)}
                    >
                      ★ Calificar
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
