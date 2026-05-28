import { useState, useRef } from 'react';
import SubscriptionPage from './SubscriptionPage.jsx';

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Única'];

const HASHTAGS = [
  '#baggy', '#streetwear', '#bootcut', '#y2k', '#vintage', '#oversized',
  '#crop', '#grunge', '#minimalist', '#aesthetic', '#thrifted', '#cottagecore',
  '#preppy', '#coquette', '#denim', '#colorful', '#dark', '#casual',
  '#formal', '#retro', '#boho', '#sporty', '#cargo', '#floral',
];

const GARMENTS = [
  { key: 'remera',    label: 'Remera',    icon: '👕' },
  { key: 'buzo',      label: 'Buzo',      icon: '🧶' },
  { key: 'camisa',    label: 'Camisa',    icon: '👔' },
  { key: 'musculosa', label: 'Musculosa', icon: '🎽' },
  { key: 'jean',      label: 'Jean',      icon: '👖' },
  { key: 'pantalon',  label: 'Pantalón',  icon: '👗' },
  { key: 'short',     label: 'Short',     icon: '🩳' },
  { key: 'vestido',   label: 'Vestido',   icon: '👒' },
  { key: 'falda',     label: 'Falda',     icon: '🪭' },
  { key: 'campera',   label: 'Campera',   icon: '🧥' },
  { key: 'abrigo',    label: 'Abrigo',    icon: '🥼' },
  { key: 'blazer',    label: 'Blazer',    icon: '🤵' },
];

const CUTS = {
  remera:    ['Regular', 'Oversize', 'Crop', 'Slim', 'Fit'],
  buzo:      ['Regular', 'Oversize', 'Crop', 'Hoodie', 'Crewneck', 'Zip-up'],
  camisa:    ['Regular', 'Oversize', 'Slim', 'Crop', 'Oversized'],
  musculosa: ['Regular', 'Crop', 'Oversize', 'Fit'],
  jean:      ['Skinny', 'Slim', 'Regular', 'Baggy', 'Bootcut', 'Flared', 'Wide leg', 'Mom', 'Barrel'],
  pantalon:  ['Skinny', 'Slim', 'Regular', 'Baggy', 'Bootcut', 'Flared', 'Wide leg', 'Cargo', 'Chino'],
  short:     ['Regular', 'Baggy', 'Mini', 'Bermuda', 'Cargo'],
  vestido:   ['Mini', 'Midi', 'Maxi', 'Wrap', 'A-line', 'Bodycon', 'Slip'],
  falda:     ['Mini', 'Midi', 'Maxi', 'A-line', 'Pencil', 'Wrap', 'Plisada'],
  campera:   ['Regular', 'Oversize', 'Crop', 'Bomber', 'Denim', 'Puffer'],
  abrigo:    ['Regular', 'Oversize', 'Slim', 'Largo', 'Trench'],
  blazer:    ['Regular', 'Oversize', 'Slim', 'Crop'],
};

const MEASUREMENTS = {
  tops: [
    { key: 'largo',           label: 'Largo' },
    { key: 'ancho_hombros',   label: 'Ancho hombros' },
    { key: 'contorno_pecho',  label: 'Contorno pecho' },
    { key: 'manga',           label: 'Largo manga' },
  ],
  bottoms: [
    { key: 'cintura',         label: 'Cintura' },
    { key: 'cadera',          label: 'Cadera' },
    { key: 'largo',           label: 'Largo total' },
    { key: 'entrepierna',     label: 'Entrepierna' },
    { key: 'rodilla',         label: 'Ancho rodilla' },
    { key: 'bota',            label: 'Ancho bota' },
  ],
  dresses: [
    { key: 'cintura',         label: 'Cintura' },
    { key: 'cadera',          label: 'Cadera' },
    { key: 'busto',           label: 'Busto' },
    { key: 'largo',           label: 'Largo total' },
  ],
  skirts: [
    { key: 'cintura',         label: 'Cintura' },
    { key: 'cadera',          label: 'Cadera' },
    { key: 'largo',           label: 'Largo' },
  ],
  outerwear: [
    { key: 'largo',           label: 'Largo' },
    { key: 'ancho_hombros',   label: 'Ancho hombros' },
    { key: 'contorno_pecho',  label: 'Contorno pecho' },
    { key: 'manga',           label: 'Largo manga' },
  ],
};

const GARMENT_MEASURE_GROUP = {
  remera: 'tops', buzo: 'tops', camisa: 'tops', musculosa: 'tops',
  jean: 'bottoms', pantalon: 'bottoms', short: 'bottoms',
  vestido: 'dresses', falda: 'skirts',
  campera: 'outerwear', abrigo: 'outerwear', blazer: 'outerwear',
};

export default function UploadPage({ user, items, onItemsChange }) {
  const itemLimit  = user.item_limit;          // null = ilimitado (Pro)
  const unlimited  = itemLimit === null;
  const [form, setForm] = useState({
    name: '', size: '', description: '',
    garment_type: '', cut: '', measurements: {},
    tipo: 'intercambio', precio: '',
  });
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [showSub, setShowSub] = useState(false);
  const fileRef = useRef();

  const measureGroup = GARMENT_MEASURE_GROUP[form.garment_type];
  const measureFields = measureGroup ? MEASUREMENTS[measureGroup] : [];
  const cutOptions = CUTS[form.garment_type] || [];

  const setGarmentType = (key) => {
    setForm(f => ({ ...f, garment_type: f.garment_type === key ? '' : key, cut: '', measurements: {} }));
  };

  const setMeasurement = (key, value) => {
    setForm(f => ({ ...f, measurements: { ...f.measurements, [key]: value } }));
  };

  const addFiles = (newFiles) => {
    const imgs = Array.from(newFiles).filter(f => f.type.startsWith('image/'));
    if (!imgs.length) { setError('Solo se permiten imágenes'); return; }
    const combined = [...files, ...imgs].slice(0, 5);
    setFiles(combined);
    setPreviews(combined.map(f => URL.createObjectURL(f)));
    setError('');
  };

  const removePreview = (i) => {
    const nf = files.filter((_, x) => x !== i);
    setFiles(nf);
    setPreviews(nf.map(f => URL.createObjectURL(f)));
  };

  const toggleHashtag = (tag) => {
    setForm(f => {
      const d = f.description;
      if (d.includes(tag)) return { ...f, description: d.replace(tag, '').replace(/\s+/g, ' ').trim() };
      return { ...f, description: d ? `${d} ${tag}` : tag };
    });
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!files.length) { setError('Selecciona al menos una foto'); return; }
    if (!unlimited && items.length >= itemLimit) { setShowSub(true); return; }

    if (!form.garment_type) { setError('Seleccioná el tipo de prenda'); return; }
    if (!form.size) { setError('Seleccioná el talle'); return; }

    setLoading(true);
    setError('');
    const fd = new FormData();
    files.forEach(f => fd.append('images', f));
    fd.append('user_id', user.id);
    fd.append('name', form.name);
    fd.append('size', form.size);
    fd.append('description', form.description);
    fd.append('garment_type', form.garment_type);
    fd.append('cut', form.cut);
    fd.append('measurements', JSON.stringify(form.measurements));
    fd.append('tipo', form.tipo);
    if (form.precio) fd.append('precio', form.precio);

    try {
      const res = await fetch('/api/items', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onItemsChange([data, ...items]);
      setForm({ name: '', size: '', description: '', garment_type: '', cut: '', measurements: {}, tipo: 'intercambio', precio: '' });
      setFiles([]); setPreviews([]);
      setSuccessMsg('¡Prenda publicada! Ya la pueden ver tus amigos');
      setTimeout(() => setSuccessMsg(''), 3500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (itemId) => {
    if (!confirm('¿Eliminar esta prenda?')) return;
    try {
      const res = await fetch(`/api/items/${itemId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id }),
      });
      if (!res.ok) throw new Error('Error al eliminar');
      onItemsChange(items.filter(i => i.id !== itemId));
    } catch (err) { alert(err.message); }
  };

  const canUpload = unlimited || items.length < itemLimit;

  return (
    <div className="upload-page">
      {showSub && <SubscriptionPage user={user} onClose={() => setShowSub(false)} />}
      {successMsg && <div className="upload-success-toast">✅ {successMsg}</div>}
      <div className="page-header">
        <h2 className="page-title">Mis Prendas</h2>
        <p className="page-subtitle">
          {unlimited ? `${items.length} prendas · ⚡ ilimitadas` : `${items.length}/${itemLimit} prendas`}
        </p>
      </div>

      <div className="upload-grid">
        {canUpload && (
          <div className="upload-form-card">
            <h3 className="card-title">Agregar prenda</h3>
            <form onSubmit={handleUpload}>

              {/* Photos */}
              <div
                className={`drop-zone ${dragOver ? 'drag-over' : ''} ${previews.length ? 'has-preview' : ''}`}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
                onClick={() => fileRef.current?.click()}
              >
                {previews.length === 0 ? (
                  <div className="drop-placeholder">
                    <span className="drop-icon">📷</span>
                    <p>Arrastra fotos o haz clic</p>
                    <span className="drop-hint">Hasta 5 fotos · JPG, PNG, WEBP · Máx 15MB c/u</span>
                  </div>
                ) : (
                  <div className="preview-grid" onClick={e => e.stopPropagation()}>
                    {previews.map((src, i) => (
                      <div key={i} className="preview-thumb">
                        <img src={src} alt={`foto ${i + 1}`} />
                        <button type="button" className="preview-remove" onClick={() => removePreview(i)}>×</button>
                        {i === 0 && <span className="preview-main-badge">Principal</span>}
                      </div>
                    ))}
                    {previews.length < 5 && (
                      <div className="preview-add" onClick={() => fileRef.current?.click()}><span>+</span></div>
                    )}
                  </div>
                )}
                <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }}
                  onChange={e => addFiles(e.target.files)} />
              </div>

              <div className="form-fields">

                {/* Name */}
                <div className="input-group">
                  <label className="input-label">Nombre</label>
                  <input className="input-field" type="text" placeholder="Ej: Camisa de lino azul"
                    value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} maxLength={60} />
                </div>

                {/* Garment type */}
                <div className="input-group">
                  <label className="input-label">Tipo de prenda <span className="label-required">*</span></label>
                  <div className="garment-grid">
                    {GARMENTS.map(g => (
                      <button key={g.key} type="button"
                        className={`garment-btn ${form.garment_type === g.key ? 'selected' : ''}`}
                        onClick={() => setGarmentType(g.key)}>
                        <span className="garment-icon">{g.icon}</span>
                        <span className="garment-label">{g.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cut — only if garment selected */}
                {cutOptions.length > 0 && (
                  <div className="input-group">
                    <label className="input-label">Corte</label>
                    <div className="size-grid">
                      {cutOptions.map(c => (
                        <button key={c} type="button"
                          className={`size-btn ${form.cut === c ? 'selected' : ''}`}
                          onClick={() => setForm(f => ({ ...f, cut: f.cut === c ? '' : c }))}>
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Size */}
                <div className="input-group">
                  <label className="input-label">Talle <span className="label-required">*</span></label>
                  <div className="size-grid">
                    {SIZES.map(s => (
                      <button key={s} type="button"
                        className={`size-btn ${form.size === s ? 'selected' : ''}`}
                        onClick={() => setForm(f => ({ ...f, size: f.size === s ? '' : s }))}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Measurements — only if garment selected */}
                {measureFields.length > 0 && (
                  <div className="input-group">
                    <label className="input-label">Medidas (cm) <span className="label-optional">opcional</span></label>
                    <div className="measures-grid">
                      {measureFields.map(m => (
                        <div key={m.key} className="measure-field">
                          <label className="measure-label">{m.label}</label>
                          <div className="measure-input-wrap">
                            <input
                              className="input-field measure-input"
                              type="number"
                              min="0"
                              max="999"
                              placeholder="—"
                              value={form.measurements[m.key] || ''}
                              onChange={e => setMeasurement(m.key, e.target.value)}
                            />
                            <span className="measure-unit">cm</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Modalidad */}
                <div className="input-group">
                  <label className="input-label">Modalidad <span className="label-required">*</span></label>
                  <div className="tipo-grid">
                    {[
                      { key: 'intercambio', label: '↔ Intercambio' },
                      { key: 'venta',       label: '$ Venta' },
                      { key: 'ambos',       label: '↔$ Ambos' },
                    ].map(t => (
                      <button key={t.key} type="button"
                        className={`tipo-btn ${form.tipo === t.key ? 'selected' : ''}`}
                        onClick={() => setForm(f => ({ ...f, tipo: t.key, precio: t.key === 'intercambio' ? '' : f.precio }))}>
                        {t.label}
                      </button>
                    ))}
                  </div>
                  {(form.tipo === 'venta' || form.tipo === 'ambos') && (
                    <div className="precio-wrap">
                      <span className="precio-symbol">$</span>
                      <input
                        className="input-field precio-input"
                        type="number"
                        min="0"
                        placeholder="Precio en pesos"
                        value={form.precio}
                        onChange={e => setForm(f => ({ ...f, precio: e.target.value }))}
                      />
                    </div>
                  )}
                </div>

                {/* Description + hashtags */}
                <div className="input-group">
                  <label className="input-label">Descripción y hashtags</label>
                  <textarea className="input-field textarea"
                    placeholder="Estado, material, precio estimado..."
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    maxLength={300} rows={3} />
                  <div className="hashtag-suggestions">
                    {HASHTAGS.map(tag => (
                      <button key={tag} type="button"
                        className={`hashtag-btn ${form.description.includes(tag) ? 'active' : ''}`}
                        onClick={() => toggleHashtag(tag)}>{tag}</button>
                    ))}
                  </div>
                </div>
              </div>

              {error && <p className="form-error">{error}</p>}
              <button className="btn-primary btn-full" type="submit" disabled={loading || !files.length}>
                {loading ? <span className="spinner-sm" /> : `+ Publicar prenda${files.length > 1 ? ` (${files.length} fotos)` : ''}`}
              </button>
            </form>
          </div>
        )}

        {/* Items list */}
        <div className="items-list">
          {items.length === 0 ? (
            <div className="empty-state"><span>👗</span><p>Aún no has subido ninguna prenda</p></div>
          ) : (
            items.map(item => {
              const photos = item.image_paths?.length ? item.image_paths : [item.image_path];
              const gLabel = GARMENTS.find(g => g.key === item.garment_type);
              const measures = (() => { try { return JSON.parse(item.measurements || '{}'); } catch { return {}; } })();
              const hasMeasures = Object.values(measures).some(v => v);
              return (
                <div key={item.id} className="item-card">
                  <div className="item-img-stack">
                    <img src={photos[0]} alt={item.name} className="item-img" />
                    {photos.length > 1 && <span className="item-photo-count">{photos.length} 📸</span>}
                  </div>
                  <div className="item-info">
                    <h4 className="item-name">{item.name || 'Sin nombre'}</h4>
                    <div className="item-tags-row">
                      {gLabel && <span className="item-tag">{gLabel.icon} {gLabel.label}</span>}
                      {item.cut && <span className="item-tag">{item.cut}</span>}
                      {item.size && <span className="item-size">Talle {item.size}</span>}
                    </div>
                    {hasMeasures && (
                      <p className="item-desc">
                        {Object.entries(measures).filter(([,v]) => v).map(([k, v]) => `${k.replace('_', ' ')}: ${v}cm`).join(' · ')}
                      </p>
                    )}
                    {item.description && <p className="item-desc">{item.description}</p>}
                  </div>
                  <button className="btn-delete" onClick={() => handleDelete(item.id)} title="Eliminar">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/>
                    </svg>
                  </button>
                </div>
              );
            })
          )}
          {!canUpload && (
            <div className="upload-full-notice">
              <span>✅</span>
              <p>Alcanzaste el límite de {itemLimit} prendas.</p>
              <button className="sub-inline-btn" onClick={() => setShowSub(true)}>⚡ Publicar más con Pro</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
