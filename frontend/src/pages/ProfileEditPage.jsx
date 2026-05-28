import { useState, useRef } from 'react';

const GOALS = [
  { value: 'intercambio', label: '↔ Intercambiar' },
  { value: 'venta',       label: '$ Vender'       },
  { value: 'ambos',       label: '✦ Ambos'        },
];

const ACCOUNT_LABELS = {
  person: '👤 Persona',
  store:  '🏪 Tienda Vintage',
};

export default function ProfileEditPage({ user, firebaseUser, onClose, onSaved }) {
  const [name, setName]       = useState(user.username || '');
  const [bio, setBio]         = useState(user.bio || '');
  const [goal, setGoal]       = useState(user.goal || 'ambos');
  const [accountType, setAccountType] = useState(user.account_type || 'person');
  const [preview, setPreview] = useState(user.avatar || firebaseUser?.photoURL || null);
  const [file, setFile]       = useState(null);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');
  const fileRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSave = async () => {
    if (!name.trim()) { setError('El nombre no puede estar vacío'); return; }
    setSaving(true);
    setError('');
    const fd = new FormData();
    fd.append('user_id', user.id);
    fd.append('username', name.trim());
    fd.append('bio', bio.trim());
    fd.append('goal', goal);
    fd.append('account_type', accountType);
    if (file) fd.append('avatar', file);

    try {
      const r = await fetch('/api/profile', { method: 'PUT', body: fd });
      const d = await r.json();
      if (!r.ok) { setError(d.error || 'Error al guardar'); return; }
      onSaved(d.user);
      onClose();
    } catch {
      setError('Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="sub-overlay" onClick={onClose}>
      <div className="sub-sheet profile-edit-sheet" onClick={e => e.stopPropagation()}>
        <button className="sub-close" onClick={onClose}>✕</button>

        <p className="sub-eyebrow">Tu cuenta</p>
        <h2 className="sub-title" style={{ marginBottom: '1.5rem' }}>Editar perfil</h2>

        {/* Avatar */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <div className="onb-avatar-wrap" style={{ width: 80, height: 80 }} onClick={() => fileRef.current?.click()}>
            {preview
              ? <img src={preview} alt="avatar" className="onb-avatar-img" />
              : <div className="onb-avatar-placeholder" style={{ fontSize: '2rem' }}>{name?.[0]?.toUpperCase() || '?'}</div>
            }
            <div className="onb-avatar-overlay"><span>📷</span></div>
          </div>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFile}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'left' }}>
          <div className="input-group">
            <label className="input-label">Nombre</label>
            <input
              className="input-field"
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={30}
              placeholder="Tu nombre o el de tu tienda"
            />
          </div>

          <div className="input-group">
            <label className="input-label">Bio <span className="label-optional">(opcional)</span></label>
            <textarea
              className="input-field textarea"
              value={bio}
              onChange={e => setBio(e.target.value)}
              maxLength={120}
              rows={2}
              placeholder="Contá algo sobre vos o tu tienda..."
            />
          </div>

          <div className="input-group">
            <label className="input-label">Tipo de cuenta</label>
            <div className="tipo-grid">
              {[
                { value: 'person', label: '👤 Persona' },
                { value: 'store',  label: '🏪 Tienda Vintage' },
              ].map(opt => (
                <button
                  key={opt.value}
                  className={`tipo-btn ${accountType === opt.value ? 'selected' : ''}`}
                  onClick={() => setAccountType(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">¿Qué buscás?</label>
            <div className="tipo-grid">
              {GOALS.map(opt => (
                <button
                  key={opt.value}
                  className={`tipo-btn ${goal === opt.value ? 'selected' : ''}`}
                  onClick={() => setGoal(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="form-error">{error}</p>}

          <button
            className="btn-primary btn-full"
            onClick={handleSave}
            disabled={saving}
            style={{ marginTop: '0.25rem' }}
          >
            {saving ? <span className="spinner-sm" /> : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  );
}
