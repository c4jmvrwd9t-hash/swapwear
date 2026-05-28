import { useState, useRef } from 'react';

const ACCOUNT_TYPES = [
  {
    type: 'person',
    icon: '👤',
    label: 'Persona',
    desc: 'Intercambiá o vendé ropa de tu propio guardarropa',
  },
  {
    type: 'store',
    icon: '🏪',
    label: 'Tienda Vintage',
    desc: 'Tengo un negocio o vendo ropa de segunda mano de forma habitual',
  },
];

const GOALS = [
  { value: 'intercambio', icon: '↔', label: 'Intercambiar', desc: 'Quiero canjear prendas con otras personas' },
  { value: 'venta',       icon: '$', label: 'Vender',       desc: 'Quiero vender lo que ya no uso' },
  { value: 'ambos',       icon: '✦', label: 'Ambos',        desc: 'Me interesa intercambiar y también vender' },
];

export default function OnboardingPage({ user, firebaseUser, onDone }) {
  const [step, setStep]               = useState(1);
  const [accountType, setAccountType] = useState(null);
  const [goal, setGoal]               = useState(null);
  const [name, setName]               = useState(firebaseUser?.displayName?.split(' ')[0] || user?.username || '');
  const [preview, setPreview]         = useState(firebaseUser?.photoURL || null);
  const [file, setFile]               = useState(null);
  const [saving, setSaving]           = useState(false);
  const fileRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleFinish = async () => {
    if (!name.trim()) return;
    setSaving(true);
    const fd = new FormData();
    fd.append('user_id', user.id);
    fd.append('username', name.trim());
    fd.append('account_type', accountType);
    fd.append('goal', goal);
    if (file) fd.append('avatar', file);

    try {
      const r = await fetch('/api/profile', { method: 'PUT', body: fd });
      const d = await r.json();
      if (d.user) onDone(d.user);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="onb-page">
      <div className="onb-card">
        {/* Progress dots */}
        <div className="onb-dots">
          {[1, 2, 3].map(s => (
            <span key={s} className={`onb-dot ${step >= s ? 'active' : ''}`} />
          ))}
        </div>

        {/* Step 1: Tipo de cuenta */}
        {step === 1 && (
          <div className="onb-step">
            <p className="onb-eyebrow">Paso 1 de 3</p>
            <h2 className="onb-title">¿Qué sos?</h2>
            <p className="onb-subtitle">Esto nos ayuda a mostrarte el contenido más relevante</p>
            <div className="onb-options">
              {ACCOUNT_TYPES.map(opt => (
                <button
                  key={opt.type}
                  className={`onb-option ${accountType === opt.type ? 'selected' : ''}`}
                  onClick={() => setAccountType(opt.type)}
                >
                  <span className="onb-opt-icon">{opt.icon}</span>
                  <div className="onb-opt-text">
                    <span className="onb-opt-label">{opt.label}</span>
                    <span className="onb-opt-desc">{opt.desc}</span>
                  </div>
                  {accountType === opt.type && <span className="onb-check">✓</span>}
                </button>
              ))}
            </div>
            <button
              className="btn-primary btn-full"
              disabled={!accountType}
              onClick={() => setStep(2)}
            >
              Continuar
            </button>
          </div>
        )}

        {/* Step 2: Objetivo */}
        {step === 2 && (
          <div className="onb-step">
            <p className="onb-eyebrow">Paso 2 de 3</p>
            <h2 className="onb-title">¿Qué buscás?</h2>
            <p className="onb-subtitle">Podés cambiar esto cuando quieras desde tu perfil</p>
            <div className="onb-options">
              {GOALS.map(opt => (
                <button
                  key={opt.value}
                  className={`onb-option ${goal === opt.value ? 'selected' : ''}`}
                  onClick={() => setGoal(opt.value)}
                >
                  <span className="onb-opt-icon">{opt.icon}</span>
                  <div className="onb-opt-text">
                    <span className="onb-opt-label">{opt.label}</span>
                    <span className="onb-opt-desc">{opt.desc}</span>
                  </div>
                  {goal === opt.value && <span className="onb-check">✓</span>}
                </button>
              ))}
            </div>
            <div className="onb-row">
              <button className="btn-ghost" onClick={() => setStep(1)}>Atrás</button>
              <button
                className="btn-primary"
                style={{ flex: 1 }}
                disabled={!goal}
                onClick={() => setStep(3)}
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Nombre y foto */}
        {step === 3 && (
          <div className="onb-step">
            <p className="onb-eyebrow">Paso 3 de 3</p>
            <h2 className="onb-title">Tu perfil</h2>
            <p className="onb-subtitle">¿Cómo querés aparecer en SwapWear?</p>

            {/* Avatar picker */}
            <div className="onb-avatar-wrap" onClick={() => fileRef.current?.click()}>
              {preview
                ? <img src={preview} alt="avatar" className="onb-avatar-img" />
                : <div className="onb-avatar-placeholder">{name?.[0]?.toUpperCase() || '?'}</div>
              }
              <div className="onb-avatar-overlay">
                <span>📷</span>
              </div>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFile}
            />

            <div className="input-group" style={{ marginTop: '1.25rem', marginBottom: '1.5rem' }}>
              <label className="input-label">Tu nombre</label>
              <input
                className="input-field"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Como te llamas o el nombre de tu tienda"
                maxLength={30}
              />
            </div>

            <div className="onb-row">
              <button className="btn-ghost" onClick={() => setStep(2)}>Atrás</button>
              <button
                className="btn-primary"
                style={{ flex: 1 }}
                disabled={!name.trim() || saving}
                onClick={handleFinish}
              >
                {saving ? <span className="spinner-sm" /> : '¡Empezar!'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
