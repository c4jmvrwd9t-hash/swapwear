import { useState, useEffect } from 'react';
import ChatView from '../components/ChatView.jsx';

export default function LikesPage({ user }) {
  const [convos, setConvos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chatTarget, setChatTarget] = useState(null);

  const getReadTimes = () => {
    try { return JSON.parse(localStorage.getItem(`sw_read_${user.id}`) || '{}'); } catch { return {}; }
  };
  const markRead = (otherId) => {
    const rt = getReadTimes();
    rt[otherId] = new Date().toISOString();
    localStorage.setItem(`sw_read_${user.id}`, JSON.stringify(rt));
  };

  const load = () => {
    const rt = encodeURIComponent(JSON.stringify(getReadTimes()));
    fetch(`/api/likes?user_id=${user.id}&read_times=${rt}`)
      .then(r => r.json())
      .then(data => { setConvos(data); setLoading(false); });
  };

  useEffect(() => { load(); }, [user.id]);

  const openChat = (convo) => {
    markRead(convo.user.id);
    setChatTarget(convo.user);
  };

  const deleteChat = async (convo) => {
    await fetch('/api/conversation', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id, other_id: convo.user.id }),
    });
    setConvos(prev => prev.filter(c => c.user.id !== convo.user.id));
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
              <button className="match-delete-btn" onClick={e => { e.stopPropagation(); deleteChat(convo); }} title="Eliminar chat">✕</button>
              <div className="match-avatar" style={{ position: 'relative' }}>
                {convo.user.avatar
                  ? <img src={convo.user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                  : convo.user.username[0].toUpperCase()
                }
                {convo.unread > 0 && <span className="chat-unread-badge">{convo.unread}</span>}
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
