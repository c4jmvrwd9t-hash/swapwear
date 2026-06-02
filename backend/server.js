const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3001;

const dataDir = process.env.DATA_DIR || __dirname;
const uploadsDir = path.join(dataDir, 'uploads');
const dbFile = path.join(dataDir, 'db.json');

if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const PROMO_END     = new Date('2026-05-11T23:59:59-03:00');
const PROMO_LIMIT   = 40;
const DEFAULT_LIMIT = 35;

// tier: null = free, 'basic' = $1/mes, 'pro' = $5/mes
function getDailyLimit(user) {
  if (user.tier === 'pro')   return null; // ilimitado
  if (user.tier === 'basic') return 100;
  return user.promo ? PROMO_LIMIT : DEFAULT_LIMIT;
}

function getItemLimit(user) {
  if (user.tier === 'pro')   return null; // ilimitado
  if (user.tier === 'basic') return 10;
  return 5;
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// ── Simple JSON database ──────────────────────────────────────────────────────
function readDb() {
  try {
    return JSON.parse(fs.readFileSync(dbFile, 'utf8'));
  } catch {
    return { users: [], items: [], swipes: [] };
  }
}

function writeDb(data) {
  fs.writeFileSync(dbFile, JSON.stringify(data, null, 2));
}

function nextId(arr) {
  return arr.length === 0 ? 1 : Math.max(...arr.map(r => r.id)) + 1;
}

function getUserRating(db, userId) {
  const list = (db.ratings || []).filter(r => r.rated_id === userId);
  if (!list.length) return { avg: null, count: 0 };
  const avg = list.reduce((s, r) => s + r.stars, 0) / list.length;
  return { avg: Math.round(avg * 10) / 10, count: list.length };
}
// ─────────────────────────────────────────────────────────────────────────────

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Solo se permiten imágenes'));
  },
});

// ── Email transporter (Gmail SMTP via env vars) ───────────────────────────────
const mailer = process.env.GMAIL_USER && process.env.GMAIL_PASS
  ? nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASS },
    })
  : null;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
}

// Sync Firebase user with our database (called after OAuth login)
app.post('/api/sync', (req, res) => {
  const { firebase_uid, username } = req.body;
  if (!firebase_uid) return res.status(400).json({ error: 'firebase_uid requerido' });

  const db = readDb();
  const withinPromo = new Date() <= PROMO_END;
  let user = db.users.find(u => u.firebase_uid === firebase_uid);

  if (!user) {
    user = {
      id: nextId(db.users),
      firebase_uid,
      username: username || 'Usuario',
      promo: withinPromo,
      created_at: new Date().toISOString(),
    };
    db.users.push(user);
    writeDb(db);
  } else {
    let changed = false;
    if (withinPromo && !user.promo) { user.promo = true; changed = true; }
    if (username && user.username !== username) { user.username = username; changed = true; }
    if (changed) writeDb(db);
  }

  const items = db.items.filter(i => i.user_id === user.id);
  const daily_limit = getDailyLimit(user);
  const item_limit  = getItemLimit(user);
  res.json({ user: { ...user, daily_limit, item_limit }, items });
});

// Upload item (max 3 per user, up to 5 photos each)
app.post('/api/items', upload.array('images', 5), (req, res) => {
  const { user_id, name, size, description, garment_type, cut, measurements } = req.body;
  if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'No se subió ninguna imagen' });
  if (!user_id) return res.status(400).json({ error: 'user_id requerido' });

  const db = readDb();
  const uid = parseInt(user_id);
  const userRecord = db.users.find(u => u.id === uid);
  const itemLimit  = getItemLimit(userRecord || {});
  const count      = db.items.filter(i => i.user_id === uid).length;

  if (itemLimit !== null && count >= itemLimit) {
    req.files.forEach(f => fs.unlinkSync(f.path));
    return res.status(400).json({ error: 'Límite de prendas alcanzado', upgrade: true });
  }

  const { tipo, precio } = req.body;
  const image_paths = req.files.map(f => '/uploads/' + f.filename);
  const item = {
    id: nextId(db.items),
    user_id: uid,
    image_path: image_paths[0],
    image_paths,
    name: name || '',
    size: size || '',
    description: description || '',
    garment_type: garment_type || '',
    cut: cut || '',
    measurements: measurements || '{}',
    tipo: tipo || 'intercambio',
    precio: precio ? parseFloat(precio) : null,
    created_at: new Date().toISOString(),
  };
  db.items.push(item);
  writeDb(db);
  res.json(item);
});

// Delete item
app.delete('/api/items/:id', (req, res) => {
  const { user_id } = req.body;
  const db = readDb();
  const itemId = parseInt(req.params.id);
  const uid = parseInt(user_id);
  const item = db.items.find(i => i.id === itemId && i.user_id === uid);

  if (!item) return res.status(404).json({ error: 'Prenda no encontrada' });

  const paths = item.image_paths || [item.image_path];
  paths.forEach(p => {
    const filePath = path.join(uploadsDir, path.basename(p));
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  });

  db.items = db.items.filter(i => i.id !== itemId);
  writeDb(db);
  res.json({ success: true });
});

// Get feed (up to 50 items not from user, not yet swiped, with optional filters)
app.get('/api/feed', (req, res) => {
  const uid = parseInt(req.query.user_id);
  if (!uid) return res.status(400).json({ error: 'user_id requerido' });

  const { garment_type, tags } = req.query;
  const tagList = tags ? tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean) : [];

  const db = readDb();
  const swipedIds = new Set(db.swipes.filter(s => s.user_id === uid).map(s => s.item_id));

  const feed = db.items
    .filter(i => {
      if (i.user_id === uid) return false;
      if (swipedIds.has(i.id)) return false;
      if (garment_type && i.garment_type !== garment_type) return false;
      if (tagList.length > 0) {
        const desc = (i.description || '').toLowerCase();
        const cut = (i.cut || '').toLowerCase();
        if (!tagList.some(t => desc.includes(t) || cut.includes(t))) return false;
      }
      return true;
    })
    .map(i => {
      const u = db.users.find(u => u.id === i.user_id);
      return { ...i, username: u?.username || '?', seller_rating: getUserRating(db, i.user_id) };
    })
    .sort(() => Math.random() - 0.5)
    .slice(0, 50);

  res.json(feed);
});

// Record swipe (enforces daily limit)
app.post('/api/swipe', (req, res) => {
  const { user_id, item_id, liked } = req.body;
  const db = readDb();
  const uid = parseInt(user_id);
  const iid = parseInt(item_id);

  const user = db.users.find(u => u.id === uid);
  const limit = user ? getDailyLimit(user) : DEFAULT_LIMIT;
  const today = todayStr();
  const todayCount = db.swipes.filter(s => s.user_id === uid && s.created_at.startsWith(today)).length;

  if (limit !== null && todayCount >= limit) {
    return res.status(429).json({ error: 'Límite diario alcanzado', upgrade: true });
  }

  const exists = db.swipes.find(s => s.user_id === uid && s.item_id === iid);
  if (!exists) {
    db.swipes.push({ id: nextId(db.swipes), user_id: uid, item_id: iid, liked: liked ? 1 : 0, created_at: new Date().toISOString() });
    writeDb(db);
  }
  res.json({ success: true });
});

// Get daily swipe stats
app.get('/api/stats', (req, res) => {
  const uid = parseInt(req.query.user_id);
  if (!uid) return res.status(400).json({ error: 'user_id requerido' });

  const db = readDb();
  const user = db.users.find(u => u.id === uid);
  const today = todayStr();
  const todaySwipes = db.swipes.filter(s => s.user_id === uid && s.created_at.startsWith(today));

  res.json({
    today: todaySwipes.length,
    liked: todaySwipes.filter(s => s.liked === 1).length,
    daily_limit: user ? getDailyLimit(user) : DEFAULT_LIMIT,
  });
});

// Get liked items
app.get('/api/likes', (req, res) => {
  const uid = parseInt(req.query.user_id);
  if (!uid) return res.status(400).json({ error: 'user_id requerido' });

  const db = readDb();
  const likedIds = new Set(db.swipes.filter(s => s.user_id === uid && s.liked === 1).map(s => s.item_id));

  const items = db.items
    .filter(i => likedIds.has(i.id))
    .map(i => {
      const u = db.users.find(u => u.id === i.user_id);
      return { ...i, username: u?.username || '?', seller_rating: getUserRating(db, i.user_id) };
    })
    .reverse();

  res.json(items);
});

// Update user profile (name, bio, goal, account_type, avatar)
app.put('/api/profile', upload.single('avatar'), (req, res) => {
  const { user_id, username, bio, goal, account_type } = req.body;
  if (!user_id) return res.status(400).json({ error: 'user_id requerido' });

  const db = readDb();
  const user = db.users.find(u => u.id === parseInt(user_id));
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

  if (username && username.trim()) user.username = username.trim().slice(0, 30);
  if (bio !== undefined) user.bio = bio.trim().slice(0, 120);
  if (['intercambio', 'venta', 'ambos'].includes(goal)) user.goal = goal;
  if (['person', 'store'].includes(account_type)) user.account_type = account_type;

  if (req.file) {
    if (user.avatar) {
      const old = path.join(uploadsDir, path.basename(user.avatar));
      if (fs.existsSync(old)) fs.unlinkSync(old);
    }
    user.avatar = '/uploads/' + req.file.filename;
  }

  writeDb(db);
  const daily_limit = getDailyLimit(user);
  const item_limit = getItemLimit(user);
  res.json({ user: { ...user, daily_limit, item_limit } });
});

// Activate subscription (called after payment confirmation)
// tier: 'basic' | 'pro' | null (cancel)
app.post('/api/subscribe', (req, res) => {
  const { user_id, tier } = req.body;
  if (!['basic', 'pro', null].includes(tier)) {
    return res.status(400).json({ error: 'Tier inválido' });
  }
  const db = readDb();
  const user = db.users.find(u => u.id === parseInt(user_id));
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  user.tier         = tier;
  user.subscribed   = !!tier;
  user.subscribed_at = tier ? new Date().toISOString() : null;
  writeDb(db);
  const daily_limit = getDailyLimit(user);
  const item_limit  = getItemLimit(user);
  res.json({ user: { ...user, daily_limit, item_limit } });
});

// Rate a user (upsert)
app.post('/api/rate', (req, res) => {
  const { rater_id, rated_id, stars, comment } = req.body;
  const rid = parseInt(rater_id), uid = parseInt(rated_id), s = parseInt(stars);
  if (!rid || !uid || !s || rid === uid || s < 1 || s > 5) {
    return res.status(400).json({ error: 'Datos inválidos' });
  }
  const db = readDb();
  if (!db.ratings) db.ratings = [];
  const existing = db.ratings.find(r => r.rater_id === rid && r.rated_id === uid);
  if (existing) {
    existing.stars = s;
    existing.comment = comment || '';
    existing.updated_at = new Date().toISOString();
  } else {
    db.ratings.push({ id: nextId(db.ratings), rater_id: rid, rated_id: uid, stars: s, comment: comment || '', created_at: new Date().toISOString() });
  }
  writeDb(db);
  res.json(getUserRating(db, uid));
});

// Get my existing rating for a user
app.get('/api/rate', (req, res) => {
  const rater_id = parseInt(req.query.rater_id);
  const rated_id = parseInt(req.query.rated_id);
  const db = readDb();
  const r = (db.ratings || []).find(r => r.rater_id === rater_id && r.rated_id === rated_id);
  res.json(r || null);
});

// Who liked my items (matches inbox)
app.get('/api/matches', (req, res) => {
  const uid = parseInt(req.query.user_id);
  if (!uid) return res.status(400).json({ error: 'user_id requerido' });

  const db = readDb();
  const myItemIds = new Set(db.items.filter(i => i.user_id === uid).map(i => i.id));

  const seen = new Set();
  const result = [];
  const likes = [...db.swipes].reverse(); // most recent first
  for (const s of likes) {
    if (s.liked !== 1) continue;
    if (!myItemIds.has(s.item_id)) continue;
    if (s.user_id === uid) continue;
    if (seen.has(s.user_id)) continue;
    seen.add(s.user_id);
    const liker = db.users.find(u => u.id === s.user_id);
    const item  = db.items.find(i => i.id === s.item_id);
    if (liker && item) result.push({
      user: { id: liker.id, username: liker.username, rating: getUserRating(db, liker.id) },
      liked_item: item,
    });
  }

  res.json(result);
});

// Public profile (items of another user)
app.get('/api/profile/:user_id', (req, res) => {
  const uid = parseInt(req.params.user_id);
  const db = readDb();
  const user = db.users.find(u => u.id === uid);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  const items = db.items.filter(i => i.user_id === uid);
  res.json({ user: { id: user.id, username: user.username, rating: getUserRating(db, uid) }, items });
});

// Get messages between two users
app.get('/api/messages', (req, res) => {
  const uid     = parseInt(req.query.user_id);
  const otherId = parseInt(req.query.other_id);
  const db = readDb();
  if (!db.messages) db.messages = [];
  const msgs = db.messages
    .filter(m =>
      (m.sender_id === uid && m.receiver_id === otherId) ||
      (m.sender_id === otherId && m.receiver_id === uid)
    )
    .sort((a, b) => a.id - b.id);
  res.json(msgs);
});

// Send a message
app.post('/api/messages', (req, res) => {
  const { sender_id, receiver_id, text } = req.body;
  if (!sender_id || !receiver_id || !text?.trim()) {
    return res.status(400).json({ error: 'Faltan datos' });
  }
  const db = readDb();
  if (!db.messages) db.messages = [];
  const msg = {
    id: db.messages.length === 0 ? 1 : Math.max(...db.messages.map(m => m.id)) + 1,
    sender_id: parseInt(sender_id),
    receiver_id: parseInt(receiver_id),
    text: text.trim(),
    created_at: new Date().toISOString(),
  };
  db.messages.push(msg);
  writeDb(db);
  res.json(msg);
});

// Send user feedback via email + store in DB
app.post('/api/feedback', (req, res) => {
  const { user_id, username, tipo, mensaje } = req.body;
  if (!mensaje?.trim()) return res.status(400).json({ error: 'El mensaje no puede estar vacío' });

  const db = readDb();
  if (!db.feedback) db.feedback = [];
  db.feedback.push({
    id: nextId(db.feedback),
    user_id: user_id || null,
    username: username || 'Anónimo',
    tipo: tipo || 'Otro',
    mensaje: mensaje.trim(),
    created_at: new Date().toISOString(),
  });
  writeDb(db);

  console.log('Feedback recibido. Mailer:', mailer ? 'configurado' : 'NO configurado', '| GMAIL_USER:', process.env.GMAIL_USER || 'NO SET');
  if (mailer) {
    const accountType = db.users.find(u => u.id === parseInt(user_id))?.account_type;
    const accountLabel = accountType === 'store' ? '🏪 Tienda Vintage' : accountType === 'person' ? '👤 Persona' : '—';
    const html = `
      <div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;background:#f7f8fc;padding:24px;border-radius:16px">
        <h2 style="color:#FF4458;margin:0 0 4px">👗 SwapWear — Nuevo Feedback</h2>
        <p style="color:#8890a4;font-size:13px;margin:0 0 20px">${new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}</p>
        <table style="width:100%;border-collapse:collapse;background:white;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)">
          <tr><td style="padding:12px 16px;border-bottom:1px solid #e8eaf0;font-size:13px;color:#8890a4;width:140px">Usuario</td><td style="padding:12px 16px;border-bottom:1px solid #e8eaf0;font-size:14px;font-weight:600">${username || 'Anónimo'}</td></tr>
          <tr><td style="padding:12px 16px;border-bottom:1px solid #e8eaf0;font-size:13px;color:#8890a4">Tipo de cuenta</td><td style="padding:12px 16px;border-bottom:1px solid #e8eaf0;font-size:14px">${accountLabel}</td></tr>
          <tr><td style="padding:12px 16px;border-bottom:1px solid #e8eaf0;font-size:13px;color:#8890a4">Categoría</td><td style="padding:12px 16px;border-bottom:1px solid #e8eaf0;font-size:14px;font-weight:600;color:#6C63FF">${tipo}</td></tr>
          <tr><td style="padding:12px 16px;font-size:13px;color:#8890a4;vertical-align:top">Mensaje</td><td style="padding:12px 16px;font-size:14px;line-height:1.6;white-space:pre-wrap">${mensaje.trim()}</td></tr>
        </table>
      </div>`;

    mailer.sendMail({
      from: `"SwapWear Feedback" <${process.env.GMAIL_USER}>`,
      to: 'n8nautomatizacionesnacho@gmail.com',
      subject: `[SwapWear] ${tipo} de ${username || 'Anónimo'}`,
      html,
    }).then(() => console.log('Email enviado OK')).catch(err => console.error('Error enviando email:', err.message));
  }

  res.json({ success: true });
});

if (fs.existsSync(frontendDist)) {
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

app.listen(PORT, () => console.log(`SwapWear backend corriendo en http://localhost:${PORT}`));
