import { useState, useEffect } from 'react';
import ChatView from '../components/ChatView.jsx';

export default function LikesPage({ user }) {
  const [convos, setConvos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chatTarget, setChatTarget] = useState(null);

  const load = () =>
    fetch(`/api/likes?user_id=${user.id}`)
      .then(r => r.json())
      .then(data => { setConvos(data); setLoading(false); });

  useEffect(() => { load(); }, [user.id]);

  const openChat = (convo) => {
    const KEY = `sw_notif_seen_saved_${user.id}`;
    localStorage.setItem(KEY, new Date().toISOString());
    setChatTarget(convo.user);
  };

  if (chatTarget) {
    return <ChatView me={user} other={chatTarget} onBack={() => { setChatTarget(null); load(); }} />;
  }

  if (loading) {
    return (
      <div className="matches-page">
        <div className="swipe-loading"><div className="spinner" /><p>Cargando...</p></div>
      </div>
    );
  }

  return (
    <div className="matches-page">
      <div className="page-header">
        <h2 className="page-title">Guardados</h2>
        <p className="page-subtitle">
          {convos.length === 0
            ? 'Todavía no guardaste ninguna prenda'
            : `${convos.length} ${convos.length === 1 ? 'conversación' : 'conversaciones'}`}
        </p>
      </div>

      {convos.length === 0 ? (
        <div className="empty-state">
          <span>💔</span>
          <p>Deslizá a la derecha para guardar prendas</p>
          <p className="empty-hint">Las podrás ver acá y chatear con sus dueños</p>
        </div>
      ) : (
        <div className="matches-list">
          {convos.map(convo => (
            <div key={convo.user.id} className="match-card" onClick={() => openChat(convo)} style={{ cursor: 'pointer' }}>
              <div className="match-avatar">
                {convo.user.avatar
                  ? <img src={convo.user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                  : convo.user.username[0].toUpperCase()
                }
              </div>
              <div className="match-info">
                <p className="match-name">@{convo.user.username}</p>
                {convo.last_message ? (
                  <p className="match-last-msg">
                    {convo.last_message.mine ? 'Vos: ' : ''}{convo.last_message.text}
                  </p>
                ) : (
                  <p className="match-item-label">Le gustó: <strong>{convo.liked_item?.name || 'tu prenda'}</strong></p>
                )}
              </div>
              <img src={convo.liked_item?.image_path} alt="" className="match-thumb" />
              <div className="match-btns" onClick={e => e.stopPropagation()}>
                <button className="match-btn match-btn-primary" onClick={() => openChat(convo)}>Chatear</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
