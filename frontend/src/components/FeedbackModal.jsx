import { useState } from 'react';

const TIPOS = [
  { value: '💡 Idea',   label: '💡 Idea'   },
  { value: '🐛 Bug',    label: '🐛 Bug'    },
  { value: '✨ Mejora', label: '✨ Mejora'  },
  { value: '💬 Otro',   label: '💬 Otro'   },
];

export default function FeedbackModal({ user, onClose }) {
  const [tipo, setTipo]       = useState('💡 Idea');
  const [mensaje, setMensaje] = useState('');
  const [sending, setSending] = useState(false);
  const [done, setDone]       = useState(false);
  const [error, setError]     = useState('');

  const handleSend = async () => {
    if (!mensaje.trim()) { setError('Escribí tu mensaje antes de enviar'); return; }
    setSending(true);
    setError('');
    try {
      const r = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user?.id || null,
          username: user?.username || 'Anónimo',
          tipo,
          mensaje,
        }),
      });
      const d = await r.json();
      if (!r.ok) { setError(d.error || 'Error al enviar'); return; }
      setDone(true);
    } catch {
      setError('Error de conexión, intentá de nuevo');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fb-overlay" onClick={onClose}>
      <div className="fb-modal" onClick={e => e.stopPropagation()}>
        <button className="sub-close" onClick={onClose}>✕</button>

        {done ? (
          <div className="fb-done">
            <span className="fb-done-icon">🙌</span>
            <h3 className="fb-done-title">¡Gracias!</h3>
            <p className="fb-done-text">Tu feedback nos ayuda a mejorar SwapWear. Lo vamos a leer con atención.</p>
            <button className="btn-primary btn-full" onClick={onClose} style={{ marginTop: '1rem' }}>
              Cerrar
            </button>
          </div>
        ) : (
          <>
            <p className="sub-eyebrow">SwapWear</p>
            <h2 className="fb-title">Mandanos tu feedback</h2>
            <p className="fb-subtitle">¿Algo que mejorar? ¿Una idea? ¿Encontraste un bug? Contanos.</p>

            <div className="fb-tipo-grid">
              {TIPOS.map(t => (
                <button
                  key={t.value}
                  className={`fb-tipo-btn ${tipo === t.value ? 'selected' : ''}`}
                  onClick={() => setTipo(t.value)}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="input-group" style={{ margin: '1rem 0' }}>
              <label className="input-label">Tu mensaje</label>
              <textarea
                className="input-field textarea"
                rows={4}
                value={mensaje}
                onChange={e => setMensaje(e.target.value)}
                placeholder="Escribí acá tu sugerencia, idea o problema..."
                maxLength={1000}
                autoFocus
              />
              <span style={{ fontSize: '0.72rem', color: 'var(--muted)', alignSelf: 'flex-end' }}>
                {mensaje.length}/1000
              </span>
            </div>

            {error && <p className="form-error" style={{ marginBottom: '0.75rem' }}>{error}</p>}

            <button
              className="btn-primary btn-full"
              onClick={handleSend}
              disabled={sending || !mensaje.trim()}
            >
              {sending ? <span className="spinner-sm" /> : 'Enviar feedback'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
