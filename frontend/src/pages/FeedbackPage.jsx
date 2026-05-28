import { useState, useEffect } from 'react';

const TIPOS = [
  { value: '💡 Idea',   label: '💡 Idea'   },
  { value: '✨ Mejora', label: '✨ Mejora'  },
  { value: '🐛 Bug',    label: '🐛 Bug'    },
  { value: '💬 Otro',   label: '💬 Otro'   },
];

const BANNER_KEY = 'swapwear_feedback_banner_v1';

function WelcomeBanner({ onClose, onDismiss }) {
  return (
    <div className="fb-banner-overlay" onClick={onClose}>
      <div className="fb-banner" onClick={e => e.stopPropagation()}>
        <div className="fb-banner-icon">🎁</div>
        <h2 className="fb-banner-title">¡Tu opinión vale!</h2>
        <p className="fb-banner-body">
          Esta sección es para que nos cuentes qué mejorarías, qué te gusta, o si encontraste algo raro.
        </p>
        <div className="fb-banner-highlight">
          <span className="fb-banner-star">⚡</span>
          <p>
            Si tu feedback nos lleva a implementar una mejora,{' '}
            <strong>te regalamos 1 mes de suscripción Pro</strong> sin costo.
          </p>
        </div>
        <div className="fb-banner-actions">
          <button className="btn-ghost" onClick={onDismiss}>
            No mostrar más
          </button>
          <button className="btn-primary" style={{ flex: 1 }} onClick={onClose}>
            ¡Entendido!
          </button>
        </div>
      </div>
    </div>
  );
}

export default function FeedbackPage({ user }) {
  const [showBanner, setShowBanner] = useState(false);
  const [tipo, setTipo]             = useState('💡 Idea');
  const [mensaje, setMensaje]       = useState('');
  const [sending, setSending]       = useState(false);
  const [done, setDone]             = useState(false);
  const [error, setError]           = useState('');

  useEffect(() => {
    const dismissed = localStorage.getItem(BANNER_KEY);
    if (!dismissed) setShowBanner(true);
  }, []);

  const closeBanner = () => setShowBanner(false);
  const dismissBanner = () => {
    localStorage.setItem(BANNER_KEY, '1');
    setShowBanner(false);
  };

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
      setMensaje('');
    } catch {
      setError('Error de conexión, intentá de nuevo');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="feedback-page">
      {showBanner && <WelcomeBanner onClose={closeBanner} onDismiss={dismissBanner} />}

      <div className="page-header">
        <h1 className="page-title">Feedback</h1>
        <p className="page-subtitle">Ayudanos a mejorar SwapWear</p>
      </div>

      <div className="feedback-content">
        {/* Incentivo siempre visible */}
        <div className="fb-promo-card">
          <div className="fb-promo-left">
            <span className="fb-promo-icon">⚡</span>
            <div>
              <p className="fb-promo-title">Ganá 1 mes Pro gratis</p>
              <p className="fb-promo-desc">Si implementamos tu idea, te regalamos la suscripción</p>
            </div>
          </div>
        </div>

        {done ? (
          <div className="fb-success">
            <span className="fb-success-icon">🙌</span>
            <h3 className="fb-success-title">¡Gracias por tu feedback!</h3>
            <p className="fb-success-text">
              Lo vamos a leer con atención. Si tu idea se implementa, te contactamos para darte el mes Pro.
            </p>
            <button
              className="btn-primary"
              style={{ marginTop: '1.5rem' }}
              onClick={() => setDone(false)}
            >
              Enviar otro
            </button>
          </div>
        ) : (
          <div className="fb-form-card">
            <p className="fb-form-label">¿De qué se trata?</p>
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

            <div className="input-group" style={{ marginTop: '1.25rem' }}>
              <label className="input-label">Tu mensaje</label>
              <textarea
                className="input-field textarea"
                rows={5}
                value={mensaje}
                onChange={e => setMensaje(e.target.value)}
                placeholder="Contanos tu idea, qué mejorarías, o qué no funciona bien..."
                maxLength={1000}
              />
              <span className="fb-char-count">{mensaje.length}/1000</span>
            </div>

            {error && <p className="form-error" style={{ marginBottom: '0.5rem' }}>{error}</p>}

            <button
              className="btn-primary btn-full"
              onClick={handleSend}
              disabled={sending || !mensaje.trim()}
              style={{ marginTop: '0.5rem' }}
            >
              {sending ? <span className="spinner-sm" /> : 'Enviar feedback'}
            </button>

            <p className="fb-legal">
              Enviando aceptás que usemos tu mensaje para mejorar la plataforma.
            </p>
          </div>
        )}

        {/* Historial de feedbacks propios (opcional, solo count) */}
      </div>
    </div>
  );
}
