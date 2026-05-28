import { useState, useEffect } from 'react';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase.js';

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
    <svg width="20" height="20" viewBox="0 0 24 24">
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

export default function LoginPage() {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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

  return (
    <div className="login-page">
      <div className="login-bg">
        <div className="login-blob blob1" />
        <div className="login-blob blob2" />
      </div>

      <div className="login-content">
        <div className="login-hero">
          <div className="login-icon">👗</div>
          <h1 className="login-title">SwapWear</h1>
          <p className="login-subtitle">Deslizá, descubrí y conseguí las prendas que querés</p>
        </div>

        {promoActive && (
          <div className="promo-banner">
            <div className="promo-header">
              <span className="promo-gift">🎁</span>
              <span className="promo-title">Oferta de lanzamiento</span>
            </div>
            <p className="promo-desc">
              Entra ahora y obtén <strong>40 swaps diarios para siempre</strong>
            </p>
            <div className="promo-countdown">
              <div className="countdown-unit">
                <span className="countdown-num">{d}</span>
                <span className="countdown-label">días</span>
              </div>
              <span className="countdown-sep">:</span>
              <div className="countdown-unit">
                <span className="countdown-num">{h}</span>
                <span className="countdown-label">horas</span>
              </div>
              <span className="countdown-sep">:</span>
              <div className="countdown-unit">
                <span className="countdown-num">{m}</span>
                <span className="countdown-label">min</span>
              </div>
              <span className="countdown-sep">:</span>
              <div className="countdown-unit">
                <span className="countdown-num">{s}</span>
                <span className="countdown-label">seg</span>
              </div>
            </div>
          </div>
        )}

        <div className="login-card">
          <div className="auth-tabs">
            <button
              className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
              onClick={() => { setMode('login'); setError(''); }}
            >
              Iniciar sesión
            </button>
            <button
              className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
              onClick={() => { setMode('register'); setError(''); }}
            >
              Registrarse
            </button>
          </div>

          <div className="social-buttons">
            <button
              className="social-btn google-btn"
              onClick={signInWithGoogle}
              disabled={loading}
            >
              {loading === true && !email ? <span className="spinner-sm spinner-dark" /> : <GoogleIcon />}
              Continuar con Google
            </button>
          </div>

          <div className="auth-divider">
            <span>o</span>
          </div>

          <form className="email-form" onSubmit={handleEmailSubmit}>
            <div className="input-group">
              <label className="input-label">Email</label>
              <input
                className="input-field"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                disabled={loading}
                autoComplete="email"
              />
            </div>
            <div className="input-group">
              <label className="input-label">Contraseña</label>
              <input
                className="input-field"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                disabled={loading}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </div>

            {error && <p className="form-error">{error}</p>}

            <button
              type="submit"
              className="social-btn email-submit-btn"
              disabled={loading}
            >
              {loading && email
                ? <span className="spinner-sm" />
                : mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'
              }
            </button>
          </form>

          <p className="login-legal">
            Al continuar aceptás que SwapWear use tus datos básicos de perfil.
          </p>
        </div>
      </div>
    </div>
  );
}
