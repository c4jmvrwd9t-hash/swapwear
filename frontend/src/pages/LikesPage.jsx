import { useState, useEffect } from 'react';
import ChatView from '../components/ChatView.jsx';
import { Icon } from '../components/Icons.jsx';

const fmtTime = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  return sameDay
    ? d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
};

export default function LikesPage({ user, onNavigate }) {
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

  if (loading) return null;

  return (
    <div className="matches-page">
      <div className="page-header">
        <h2 className="page-title">Chats</h2>
        <p className="page-subtitle">
          {convos.length === 0
            ? 'Todavía no guardaste ninguna prenda'
            : `${convos.length} ${convos.length === 1 ? 'conversación' : 'conversaciones'}`}
        </p>
      </div>

      {convos.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><Icon.Chats size={34} /></div>
          <p>Todavía no tenés conversaciones</p>
          <p className="empty-hint">Deslizá a la derecha en Explorar para guardar prendas y chatear con sus dueños</p>
          <button className="btn-primary" onClick={() => onNavigate?.('swipe')}>Explorar prendas</button>
        </div>
      ) : (
        <div className="chat-list">
          {convos.map(convo => (
            <div key={convo.user.id} className={`chat-row ${convo.unread > 0 ? 'is-unread' : ''}`} onClick={() => openChat(convo)} role="button" tabIndex={0}
              onKeyDown={e => { if (e.key === 'Enter') openChat(convo); }}>
              <div className="chat-row-avatar">
                {convo.user.avatar
                  ? <img src={convo.user.avatar} alt="" />
                  : <span>{convo.user.username[0].toUpperCase()}</span>}
              </div>
              <div className="chat-row-body">
                <div className="chat-row-top">
                  <span className="chat-row-name">@{convo.user.username}</span>
                  <span className="chat-row-time">{convo.last_message ? fmtTime(convo.last_message.created_at) : ''}</span>
                </div>
                <div className="chat-row-bottom">
                  {convo.last_message ? (
                    <p className="chat-row-preview">{convo.last_message.mine ? 'Vos: ' : ''}{convo.last_message.text}</p>
                  ) : (
                    <p className="chat-row-preview muted">Le gustó {convo.liked_item?.name || 'tu prenda'}</p>
                  )}
                  {convo.unread > 0 && <span className="chat-row-unread">{convo.unread}</span>}
                </div>
              </div>
              <img src={convo.liked_item?.image_path} alt="" className="chat-row-thumb" />
              <button className="chat-row-del" onClick={e => { e.stopPropagation(); deleteChat(convo); }} aria-label="Eliminar conversación">
                <Icon.X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
