import { useState, useEffect, useRef } from 'react';

export default function ChatView({ me, other, onBack }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const loadMsgs = () =>
    fetch(`/api/messages?user_id=${me.id}&other_id=${other.id}`)
      .then(r => r.json())
      .then(setMessages);

  useEffect(() => {
    loadMsgs();
    const id = setInterval(loadMsgs, 3000);
    return () => clearInterval(id);
  }, [me.id, other.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    const body = { sender_id: me.id, receiver_id: other.id, text: text.trim() };
    setText('');
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const saved = await res.json();
    setMessages(prev => [...prev, saved]);
    setSending(false);
  };

  return (
    <div className="chat-view">
      <div className="chat-header">
        <button className="back-btn" onClick={onBack}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
        <span className="chat-header-name">@{other.username}</span>
      </div>

      <div className="chat-messages">
        {messages.length === 0 && (
          <p className="chat-empty">Sé el primero en escribir 👋</p>
        )}
        {messages.map(m => (
          m.system
            ? <div key={m.id} className="chat-system-msg">{m.text}</div>
            : <div key={m.id} className={`chat-bubble ${m.sender_id === me.id ? 'mine' : 'theirs'}`}>
                {m.text}
              </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form className="chat-input-bar" onSubmit={send}>
        <input
          className="chat-input"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Escribí un mensaje..."
          disabled={sending}
          autoFocus
        />
        <button type="submit" className="chat-send-btn" disabled={!text.trim() || sending}>
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </button>
      </form>
    </div>
  );
}
