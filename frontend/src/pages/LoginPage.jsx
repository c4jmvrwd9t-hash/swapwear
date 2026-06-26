import { useState, useEffect, useRef } from 'react';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase.js';
import { Logo } from '../components/Icons.jsx';
import '../login.css';

const PROMO_END = new Date('2026-05-11T23:59:59-03:00');

function useCountdown() {
  const [ms, setMs] = useState(() => Math.max(0, PROMO_END - Date.now()));
  useEffect(() => {
    const id = setInterval(() => setMs(Math.max(0, PROMO_END - Date.now())), 1000);
    return () => clearInterval(id);
  }, []);
  return ms;
}

function fmt(ms) {
  const d = Math.floor(ms / 86400000);
  const h = String(Math.floor((ms % 86400000) / 3600000)).padStart(2, '0');
  const m = String(Math.floor((ms % 3600000) / 60000)).padStart(2, '0');
  const s = String(Math.floor((ms % 60000) / 1000)).padStart(2, '0');
  return { d, h, m, s };
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

const FIREBASE_ERRORS = {
  'auth/user-not-found': 'No existe una cuenta con ese email.',
  'auth/wrong-password': 'Contraseña incorrecta.',
  'auth/invalid-credential': 'Email o contraseña incorrectos.',
  'auth/invalid-email': 'El email no es válido.',
  'auth/email-already-in-use': 'Ya existe una cuenta con ese email.',
  'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
  'auth/too-many-requests': 'Demasiados intentos. Esperá unos minutos.',
};

const STEPS = [
  { icon: '👆', title: 'Deslizá', desc: 'Descubrí prendas con un gesto' },
  { icon: '💬', title: 'Conectá', desc: 'Chateá con quien las tiene' },
  { icon: '🔄', title: 'Intercambiá', desc: 'Cerrá el swap o la compra' },
];

// Cartas decorativas para la previsualización del swipe
const PREVIEW_CARDS = [
  { emoji: '👖', name: 'Jean baggy y2k', tag: '↔ Intercambio', grad: 'linear-gradient(160deg,#2A3F63,#16223C)' },
  { emoji: '🧥', name: 'Campera oversize', tag: '$ 18.000', grad: 'linear-gradient(160deg,#4A4036,#2A2018)' },
  { emoji: '👗', name: 'Vestido vintage', tag: '↔ Intercambio', grad: 'linear-gradient(160deg,#3A4A5E,#1B2A3C)' },
];

export default function LoginPage() {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const tablistRef = useRef(null);
  const timeLeft = useCountdown();
  const promoActive = timeLeft > 0;
  const { d, h, m, s } = fmt(timeLeft);

  const handleError = (err) => {
    setError(FIREBASE_ERRORS[err.code] || 'Error al iniciar sesión. Intentá de nuevo.');
    setLoading(false);
  };

  const signInWithGoogle = async () => {
    if (loading) return;
    setLoading(true);
    setError('');
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') handleError(err);
      else setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) { setError('Escribí tu email para recuperar la contraseña.'); return; }
    setLoading(true);
    setError('');
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
    } catch (err) {
      setError(FIREBASE_ERRORS[err.code] || 'No se pudo enviar el email. Verificá que el email sea correcto.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError('');
    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      handleError(err);
    }
  };

  const switchMode = (next) => { setMode(next); setError(''); setResetSent(false); };

  // Navegación con flechas entre pestañas (WCAG 4.1.2 / patrón ARIA tabs)
  const onTabKeyDown = (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    const next = mode === 'login' ? 'register' : 'login';
    switchMode(next);
    requestAnimationFrame(() => {
      tablistRef.current?.querySelector(`#tab-${next}`)?.focus();
    });
  };

  return (
    <div className="lx">
      {/* Fondo de auroras animadas */}
      <div className="lx-aurora" aria-hidden="true">
        <span className="lx-blob b1" />
        <span className="lx-blob b2" />
        <span className="lx-blob b3" />
      </div>

      <div className="lx-grid">
        {/* ── Columna izquierda: historia de producto ── */}
        <section className="lx-story">
          <div className="lx-brand">
            <span className="lx-logo" aria-hidden="true">
              <Logo mono size={24} />
            </span>
            <h1 className="lx-wordmark">SwapWear</h1>
          </div>

          <h2 className="lx-headline">Tu vestidor del futuro</h2>
          <p className="lx-lede">Deslizá, descubrí y conseguí las prendas que querés.</p>

          <ul className="lx-steps">
            {STEPS.map(step => (
              <li key={step.title} className="lx-step">
                <span className="lx-step-ic" aria-hidden="true">{step.icon}</span>
                <span className="lx-step-tx">
                  <strong>{step.title}</strong>
                  <span>{step.desc}</span>
                </span>
              </li>
            ))}
          </ul>

          {/* Previsualización del gesto de swipe (decorativa) */}
          <div className="lx-preview" aria-hidden="true">
            {PREVIEW_CARDS.map((c, i) => (
              <article
                key={c.name}
                className={`lx-pcard ${i === 0 ? 'is-top' : ''}`}
                style={{ '--i': i, background: c.grad }}
              >
                <span className="lx-pcard-emoji">{c.emoji}</span>
                <div className="lx-pcard-meta">
                  <strong>{c.name}</strong>
                  <span className="lx-pcard-tag">{c.tag}</span>
                </div>
              </article>
            ))}
          </div>

          {/* Señales de confianza (sin métricas inventadas) */}
          <ul className="lx-trust">
            <li><span aria-hidden="true">🔒</span> Intercambio seguro</li>
            <li><span aria-hidden="true">✨</span> Comunidad en crecimiento</li>
            <li><span aria-hidden="true">🎁</span> Empezar es gratis</li>
          </ul>
        </section>

        {/* ── Columna derecha: panel de auth en vidrio ── */}
        <section className="lx-auth">
          <div className="lx-card">
            {promoActive && (
              <div className="lx-promo">
                <span className="lx-promo-gift" aria-hidden="true">🎁</span>
                <span className="lx-promo-tx">
                  <strong>Oferta de lanzamiento</strong>
                  <span>40 swaps diarios para siempre</span>
                </span>
                <span className="lx-promo-time" aria-label={`Quedan ${d} días, ${h} horas, ${m} minutos`}>
                  {d}d {h}:{m}:{s}
                </span>
              </div>
            )}

            <div className="lx-tabs" role="tablist" aria-label="Acceder o registrarse" ref={tablistRef} onKeyDown={onTabKeyDown}>
              <button
                id="tab-login"
                role="tab"
                aria-selected={mode === 'login'}
                aria-controls="panel-auth"
                tabIndex={mode === 'login' ? 0 : -1}
                className={`lx-tab ${mode === 'login' ? 'active' : ''}`}
                onClick={() => switchMode('login')}
              >
                Iniciar sesión
              </button>
              <button
                id="tab-register"
                role="tab"
                aria-selected={mode === 'register'}
                aria-controls="panel-auth"
                tabIndex={mode === 'register' ? 0 : -1}
                className={`lx-tab ${mode === 'register' ? 'active' : ''}`}
                onClick={() => switchMode('register')}
              >
                Registrarse
              </button>
            </div>

            <div id="panel-auth" role="tabpanel" aria-labelledby={`tab-${mode}`} className="lx-panel">
              <button className="lx-google" onClick={signInWithGoogle} disabled={loading}>
                {loading && !email ? <span className="lx-spin" /> : <GoogleIcon />}
                Continuar con Google
              </button>

              <div className="lx-divider"><span>o</span></div>

              <form className="lx-form" onSubmit={handleEmailSubmit}>
                <div className="lx-field">
                  <label htmlFor="lx-email">Email</label>
                  <input
                    id="lx-email"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    autoComplete="email"
                  />
                </div>

                <div className="lx-field">
                  <label htmlFor="lx-pw">Contraseña</label>
                  <div className="lx-pw-wrap">
                    <input
                      id="lx-pw"
                      type={showPw ? 'text' : 'password'}
                      placeholder="Mínimo 6 caracteres"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      disabled={loading}
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                      aria-describedby={error ? 'lx-error' : undefined}
                    />
                    <button
                      type="button"
                      className="lx-pw-toggle"
                      onClick={() => setShowPw(v => !v)}
                      aria-pressed={showPw}
                      aria-label={showPw ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showPw ? (
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                          <line x1="1" y1="1" x2="23" y2="23"/>
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {mode === 'login' && (
                  <button type="button" className="lx-forgot" onClick={handleForgotPassword} disabled={loading}>
                    ¿Olvidaste tu contraseña?
                  </button>
                )}

                <div className="lx-feedback" id="lx-error" role="status" aria-live="polite">
                  {error && <p className="lx-error">{error}</p>}
                  {resetSent && <p className="lx-success">Te enviamos un email para recuperar tu contraseña.</p>}
                </div>

                <button type="submit" className="lx-submit" disabled={loading}>
                  {loading && email
                    ? <span className="lx-spin" />
                    : mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
                </button>
              </form>

              <p className="lx-legal">
                Al continuar aceptás que SwapWear use tus datos básicos de perfil.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
