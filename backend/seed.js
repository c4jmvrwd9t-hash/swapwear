/**
 * Seed script
 * node backend/seed.js          → agrega bots
 * node backend/seed.js --clean  → elimina todos los bots
 */

const fs    = require('fs');
const path  = require('path');
const https = require('https');
const http  = require('http');

const dataDir    = process.env.DATA_DIR || __dirname;
const uploadsDir = path.join(dataDir, 'uploads');
const dbFile     = path.join(dataDir, 'db.json');

if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

function readDb() {
  try { return JSON.parse(fs.readFileSync(dbFile, 'utf8')); }
  catch { return { users: [], items: [], swipes: [], messages: [], ratings: [] }; }
}
function writeDb(data) { fs.writeFileSync(dbFile, JSON.stringify(data, null, 2)); }
function nextId(arr)   { return arr.length === 0 ? 1 : Math.max(...arr.map(r => r.id)) + 1; }

function downloadImage(url, dest, redirects = 0) {
  return new Promise((resolve, reject) => {
    if (redirects > 8) return reject(new Error('Too many redirects'));
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      if (res.statusCode >= 300 && res.headers.location) {
        res.resume();
        return downloadImage(res.headers.location, dest, redirects + 1).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
      file.on('error', reject);
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

// ── Unsplash photo IDs (ropa real) ────────────────────────────────────────────
// Formato: https://images.unsplash.com/photo-{ID}?w=400&h=600&fit=crop&q=80
const U = id => `https://images.unsplash.com/photo-${id}?w=400&h=600&fit=crop&q=80`;

const IMGS = {
  // Jeans baggy / denim
  jean_baggy_1:    U('1541099649105-f69ad21f3246'),  // ✓
  jean_baggy_2:    U('1512436991641-6745cdb1723f'),  // ✓
  jean_bootcut_1:  U('1618354691373-d851c5c3a990'),  // wide-leg denim ✓
  jean_bootcut_2:  U('1576995853123-5a10305d93c0'),  // denim jacket vibe ✓
  jean_wide:       U('1618354691373-d851c5c3a990'),  // ✓

  // Streetwear / hoodies
  hoodie_1:        U('1591047139829-d91aecb6caea'),  // ✓
  hoodie_2:        U('1475180098004-ca77a66827be'),  // ✓
  streetwear_1:    U('1529720317453-c8da503f2051'),  // ✓
  streetwear_2:    U('1529720317453-c8da503f2051'),  // ✓
  streetwear_3:    U('1475180098004-ca77a66827be'),  // ✓
  cargo_pants:     U('1541099649105-f69ad21f3246'),  // dark jeans alt ✓

  // Y2K
  y2k_1:           U('1583744946564-b52ac1c389c8'),  // ✓
  y2k_2:           U('1515886657613-9f3515b0c78f'),  // ✓
  y2k_crop:        U('1583744946564-b52ac1c389c8'),  // ✓
  y2k_jacket:      U('1512436991641-6745cdb1723f'),  // ✓

  // Remeras / tops
  tee_oversized:   U('1591047139829-d91aecb6caea'),  // ✓
  crop_top:        U('1583744946564-b52ac1c389c8'),  // ✓
  musculosa:       U('1469334031218-e382a71b716b'),  // ✓

  // Camperas / outerwear
  bomber:          U('1576995853123-5a10305d93c0'),  // ✓
  denim_jacket:    U('1576995853123-5a10305d93c0'),  // ✓
  puffer:          U('1507003211169-0a1dd7228f2d'),  // ✓
  trench:          U('1490481651871-ab68de25d43d'),  // ✓

  // Vestidos / faldas
  vestido_midi:    U('1490481651871-ab68de25d43d'),  // ✓
  vestido_mini:    U('1515886657613-9f3515b0c78f'),  // ✓
  falda_plisada:   U('1469334031218-e382a71b716b'),  // ✓
  falda_mini:      U('1434389677669-e08b4cac3105'),  // ✓

  // Blazers
  blazer_oversize: U('1507003211169-0a1dd7228f2d'),  // ✓
  blazer_negro:    U('1507003211169-0a1dd7228f2d'),  // ✓
};

// ── Bots ──────────────────────────────────────────────────────────────────────
const BOTS = [
  // Originales
  { uid: 'bot_marti',  username: 'marti_styles',   promo: true  },
  { uid: 'bot_nacho',  username: 'nacho_vintage',   promo: true  },
  { uid: 'bot_caro',   username: 'caro_fashion',    promo: false },
  { uid: 'bot_luci',   username: 'luci_closet',     promo: true  },
  { uid: 'bot_fede',   username: 'fede_swap',       promo: false },
  { uid: 'bot_vale',   username: 'vale_outfits',    promo: true  },
  { uid: 'bot_sofi',   username: 'sofi_thrift',     promo: false },
  // Nuevos
  { uid: 'bot_juli',   username: 'juli_y2k',        promo: true  },
  { uid: 'bot_nico',   username: 'nico_street',     promo: false },
  { uid: 'bot_pau',    username: 'pau_denim',       promo: true  },
  { uid: 'bot_mati',   username: 'mati_baggy',      promo: false },
  { uid: 'bot_roma',   username: 'roma_vintage',    promo: true  },
  { uid: 'bot_tomi',   username: 'tomi_drops',      promo: false },
  { uid: 'bot_flor',   username: 'flor_aesthetic',  promo: true  },
  { uid: 'bot_gonza',  username: 'gonza_skate',     promo: false },
];

// ── Items ─────────────────────────────────────────────────────────────────────
const BOT_ITEMS = [
  // ── JEANS BAGGY ──
  { bot: 'bot_pau',   name: 'Jean baggy negro tiro alto',      size: 'M',  garment_type: 'jean',    cut: 'Baggy',    tipo: 'intercambio', precio: null,  description: '#baggy #denim #dark #y2k',                    img: IMGS.jean_baggy_1 },
  { bot: 'bot_mati',  name: 'Jean baggy azul desgastado',      size: 'L',  garment_type: 'jean',    cut: 'Baggy',    tipo: 'ambos',       precio: 7500,  description: '#baggy #denim #vintage #thrifted',            img: IMGS.jean_baggy_2 },
  { bot: 'bot_gonza', name: 'Jean baggy cargo con bolsillos',  size: 'M',  garment_type: 'jean',    cut: 'Baggy',    tipo: 'venta',       precio: 9000,  description: '#baggy #cargo #streetwear #y2k',              img: IMGS.jean_baggy_1 },
  { bot: 'bot_tomi',  name: 'Baggy jeans gris lavado',         size: 'XL', garment_type: 'jean',    cut: 'Baggy',    tipo: 'intercambio', precio: null,  description: '#baggy #denim #oversized #grunge',            img: IMGS.jean_baggy_2 },

  // ── JEANS BOOTCUT ──
  { bot: 'bot_marti', name: 'Jean bootcut azul medio',         size: 'S',  garment_type: 'jean',    cut: 'Bootcut',  tipo: 'ambos',       precio: 8500,  description: '#bootcut #denim #retro #y2k',                 img: IMGS.jean_bootcut_1 },
  { bot: 'bot_flor',  name: 'Jean bootcut negro stretch',      size: 'M',  garment_type: 'jean',    cut: 'Bootcut',  tipo: 'venta',       precio: 10000, description: '#bootcut #denim #dark #formal',               img: IMGS.jean_bootcut_2 },
  { bot: 'bot_caro',  name: 'Bootcut flare destroyed',         size: 'S',  garment_type: 'jean',    cut: 'Bootcut',  tipo: 'intercambio', precio: null,  description: '#bootcut #flared #y2k #vintage #denim',       img: IMGS.jean_bootcut_1 },
  { bot: 'bot_roma',  name: 'Jean wide leg azul oscuro',       size: 'M',  garment_type: 'jean',    cut: 'Wide leg', tipo: 'ambos',       precio: 11000, description: '#bootcut #denim #retro #boho #y2k',           img: IMGS.jean_wide },

  // ── STREETWEAR ──
  { bot: 'bot_nico',  name: 'Hoodie oversized negra',          size: 'XL', garment_type: 'buzo',    cut: 'Hoodie',   tipo: 'intercambio', precio: null,  description: '#streetwear #oversized #dark #casual',        img: IMGS.hoodie_1 },
  { bot: 'bot_nico',  name: 'Hoodie gráfica collab drop',      size: 'L',  garment_type: 'buzo',    cut: 'Hoodie',   tipo: 'venta',       precio: 15000, description: '#streetwear #dark #aesthetic #oversized',    img: IMGS.hoodie_2 },
  { bot: 'bot_gonza', name: 'Remera gráfica skate brand',      size: 'L',  garment_type: 'remera',  cut: 'Oversize', tipo: 'ambos',       precio: 6000,  description: '#streetwear #grunge #thrifted #casual',       img: IMGS.streetwear_1 },
  { bot: 'bot_tomi',  name: 'Cargo pants negros 6 bolsillos',  size: 'M',  garment_type: 'pantalon',cut: 'Cargo',    tipo: 'venta',       precio: 12000, description: '#streetwear #cargo #dark #y2k #baggy',        img: IMGS.cargo_pants },
  { bot: 'bot_nacho', name: 'Campera de nylon streetwear',     size: 'M',  garment_type: 'campera', cut: 'Regular',  tipo: 'ambos',       precio: 18000, description: '#streetwear #y2k #retro #aesthetic',         img: IMGS.streetwear_2 },
  { bot: 'bot_fede',  name: 'Buzo crewneck gráfico',           size: 'L',  garment_type: 'buzo',    cut: 'Crewneck', tipo: 'intercambio', precio: null,  description: '#streetwear #oversized #aesthetic #casual',   img: IMGS.streetwear_3 },

  // ── Y2K ──
  { bot: 'bot_juli',  name: 'Top de malla y2k cromado',        size: 'XS', garment_type: 'musculosa',cut: 'Crop',    tipo: 'ambos',       precio: 5500,  description: '#y2k #aesthetic #coquette #colorful',        img: IMGS.y2k_1 },
  { bot: 'bot_juli',  name: 'Jean low rise y2k flare',         size: 'S',  garment_type: 'jean',    cut: 'Flared',   tipo: 'intercambio', precio: null,  description: '#y2k #retro #flared #denim #vintage',        img: IMGS.y2k_2 },
  { bot: 'bot_flor',  name: 'Crop top mariposa y2k',           size: 'XS', garment_type: 'remera',  cut: 'Crop',     tipo: 'venta',       precio: 4000,  description: '#y2k #colorful #coquette #aesthetic',        img: IMGS.y2k_crop },
  { bot: 'bot_vale',  name: 'Campera anorak y2k colores',      size: 'S',  garment_type: 'campera', cut: 'Regular',  tipo: 'ambos',       precio: 14000, description: '#y2k #colorful #streetwear #retro',          img: IMGS.y2k_jacket },
  { bot: 'bot_roma',  name: 'Vestido mini y2k plateado',       size: 'S',  garment_type: 'vestido', cut: 'Mini',     tipo: 'venta',       precio: 9500,  description: '#y2k #aesthetic #dark #coquette',            img: IMGS.vestido_mini },

  // ── REMERAS / TOPS ──
  { bot: 'bot_marti', name: 'Remera crop blanca básica',       size: 'S',  garment_type: 'remera',  cut: 'Crop',     tipo: 'ambos',       precio: 3500,  description: '#minimalist #crop #aesthetic #casual',       img: IMGS.crop_top },
  { bot: 'bot_caro',  name: 'Remera oversized vintage wash',   size: 'M',  garment_type: 'remera',  cut: 'Oversize', tipo: 'intercambio', precio: null,  description: '#vintage #oversized #thrifted #grunge',      img: IMGS.tee_oversized },
  { bot: 'bot_luci',  name: 'Musculosa satén beige',           size: 'S',  garment_type: 'musculosa',cut: 'Regular', tipo: 'ambos',       precio: 4500,  description: '#coquette #minimalist #aesthetic #formal',   img: IMGS.musculosa },

  // ── OUTERWEAR ──
  { bot: 'bot_nacho', name: 'Bomber plateada oversize',        size: 'L',  garment_type: 'campera', cut: 'Bomber',   tipo: 'venta',       precio: 22000, description: '#y2k #streetwear #aesthetic #retro',         img: IMGS.bomber },
  { bot: 'bot_sofi',  name: 'Campera de jean oversized',       size: 'M',  garment_type: 'campera', cut: 'Denim',    tipo: 'intercambio', precio: null,  description: '#denim #vintage #thrifted #casual #baggy',   img: IMGS.denim_jacket },
  { bot: 'bot_mati',  name: 'Puffer negro corto',              size: 'M',  garment_type: 'campera', cut: 'Puffer',   tipo: 'ambos',       precio: 19000, description: '#streetwear #dark #casual #oversized',       img: IMGS.puffer },
  { bot: 'bot_roma',  name: 'Trench coat beige clásico',       size: 'S',  garment_type: 'abrigo',  cut: 'Trench',   tipo: 'venta',       precio: 28000, description: '#formal #minimalist #aesthetic #preppy',     img: IMGS.trench },

  // ── VESTIDOS / FALDAS ──
  { bot: 'bot_flor',  name: 'Vestido midi floral boho',        size: 'S',  garment_type: 'vestido', cut: 'Midi',     tipo: 'ambos',       precio: 13000, description: '#boho #cottagecore #floral #aesthetic',      img: IMGS.vestido_midi },
  { bot: 'bot_juli',  name: 'Falda plisada rosa pastel',       size: 'XS', garment_type: 'falda',   cut: 'Plisada',  tipo: 'venta',       precio: 8000,  description: '#coquette #aesthetic #y2k #colorful',        img: IMGS.falda_plisada },
  { bot: 'bot_vale',  name: 'Mini falda cuero negra',          size: 'S',  garment_type: 'falda',   cut: 'Mini',     tipo: 'intercambio', precio: null,  description: '#dark #grunge #streetwear #y2k',             img: IMGS.falda_mini },

  // ── BLAZERS ──
  { bot: 'bot_luci',  name: 'Blazer oversize verde',           size: 'M',  garment_type: 'blazer',  cut: 'Oversize', tipo: 'venta',       precio: 16000, description: '#formal #aesthetic #preppy #minimalist',     img: IMGS.blazer_oversize },
  { bot: 'bot_sofi',  name: 'Blazer negro slim fit',           size: 'S',  garment_type: 'blazer',  cut: 'Slim',     tipo: 'ambos',       precio: 14000, description: '#formal #dark #minimalist #preppy',          img: IMGS.blazer_negro },
];

// ── Ratings entre bots ────────────────────────────────────────────────────────
const BOT_RATINGS = [
  { rater: 'bot_nacho', rated: 'bot_marti', stars: 5, comment: 'Super confiable 👌' },
  { rater: 'bot_caro',  rated: 'bot_marti', stars: 4, comment: 'Muy buena prenda' },
  { rater: 'bot_marti', rated: 'bot_nacho', stars: 5, comment: 'Excelente vendedor' },
  { rater: 'bot_luci',  rated: 'bot_caro',  stars: 3, comment: 'Tardó en responder' },
  { rater: 'bot_vale',  rated: 'bot_luci',  stars: 5, comment: '¡Todo impecable!' },
  { rater: 'bot_fede',  rated: 'bot_vale',  stars: 4, comment: 'Muy buena' },
  { rater: 'bot_sofi',  rated: 'bot_fede',  stars: 5, comment: 'Perfecto intercambio' },
  { rater: 'bot_juli',  rated: 'bot_nico',  stars: 5, comment: 'Re copado, buena ropa' },
  { rater: 'bot_nico',  rated: 'bot_pau',   stars: 4, comment: 'Jeans como dijeron' },
  { rater: 'bot_pau',   rated: 'bot_mati',  stars: 5, comment: 'Rápido y honesto' },
  { rater: 'bot_roma',  rated: 'bot_tomi',  stars: 3, comment: 'Bien, podría ser más detallista' },
  { rater: 'bot_gonza', rated: 'bot_flor',  stars: 5, comment: 'Increíble ropa, recomiendo' },
  { rater: 'bot_flor',  rated: 'bot_gonza', stars: 4, comment: 'Todo ok' },
];

// ── Swipes entre bots ────────────────────────────────────────────────────────
// { liker, item_owner } → el bot "liker" da like a todas las prendas de "item_owner"
const BOT_SWIPES = [
  { liker: 'bot_nico',   owner: 'bot_pau'   },
  { liker: 'bot_nico',   owner: 'bot_marti' },
  { liker: 'bot_juli',   owner: 'bot_flor'  },
  { liker: 'bot_juli',   owner: 'bot_vale'  },
  { liker: 'bot_mati',   owner: 'bot_gonza' },
  { liker: 'bot_mati',   owner: 'bot_tomi'  },
  { liker: 'bot_gonza',  owner: 'bot_nico'  },
  { liker: 'bot_gonza',  owner: 'bot_mati'  },
  { liker: 'bot_flor',   owner: 'bot_juli'  },
  { liker: 'bot_vale',   owner: 'bot_roma'  },
  { liker: 'bot_caro',   owner: 'bot_luci'  },
  { liker: 'bot_luci',   owner: 'bot_caro'  },
  { liker: 'bot_marti',  owner: 'bot_sofi'  },
  { liker: 'bot_sofi',   owner: 'bot_nacho' },
  { liker: 'bot_nacho',  owner: 'bot_fede'  },
  { liker: 'bot_fede',   owner: 'bot_marti' },
  { liker: 'bot_tomi',   owner: 'bot_nico'  },
  { liker: 'bot_roma',   owner: 'bot_pau'   },
  { liker: 'bot_pau',    owner: 'bot_mati'  },
];

// ── Conversaciones entre bots ─────────────────────────────────────────────────
// Pares que ya tienen chat iniciado
const BOT_CHATS = [
  {
    a: 'bot_nico', b: 'bot_pau',
    msgs: [
      { from: 'bot_nico', text: 'Buenas! vi que tenés los jeans baggy, siguen disponibles?' },
      { from: 'bot_pau',  text: 'Si! están en perfecto estado, los usé como 3 veces' },
      { from: 'bot_nico', text: 'Copado, estarías para un intercambio? tengo una hoodie talle L' },
      { from: 'bot_pau',  text: 'Me interesa! mandame foto' },
      { from: 'bot_nico', text: 'Te mando por acá, son los que tengo publicados' },
    ],
  },
  {
    a: 'bot_juli', b: 'bot_flor',
    msgs: [
      { from: 'bot_flor', text: 'Holaa! me encantó el top y2k' },
      { from: 'bot_juli', text: 'Aww gracias! lo conseguí en un thrift' },
      { from: 'bot_flor', text: 'Qué talle es? en las fotos no se ve bien' },
      { from: 'bot_juli', text: 'XS, yo uso 34/36 y me queda perfecto' },
      { from: 'bot_flor', text: 'Perfecto eso uso yo! estarías para venderlo?' },
      { from: 'bot_juli', text: 'Prefiero intercambio, vi tu crop top que está hermoso' },
      { from: 'bot_flor', text: 'Dale! coordinamos?' },
    ],
  },
  {
    a: 'bot_mati', b: 'bot_gonza',
    msgs: [
      { from: 'bot_gonza', text: 'Eyyy vi el puffer negro, cuánto pedís?' },
      { from: 'bot_mati',  text: '19000, pero si tenés algo para intercambiar también escucho' },
      { from: 'bot_gonza', text: 'Tengo unos cargo pants, los viste?' },
      { from: 'bot_mati',  text: 'Si los vi! qué talle son?' },
      { from: 'bot_gonza', text: 'M, como el puffer' },
      { from: 'bot_mati',  text: 'Perfecto, me tienta el intercambio' },
    ],
  },
  {
    a: 'bot_caro', b: 'bot_luci',
    msgs: [
      { from: 'bot_luci', text: 'Hola! el blazer oversize, de qué color es exactamente?' },
      { from: 'bot_caro', text: 'Es un verde oliva, muy lindo con jeans' },
      { from: 'bot_luci', text: 'Ay me encanta esa combinación. Qué talle?' },
      { from: 'bot_caro', text: 'M pero oversize, a mí que uso S me quedaba bien' },
      { from: 'bot_luci', text: 'Yo uso M/L, capaz me queda grande. Puedo pagarlo?' },
      { from: 'bot_caro', text: '16000, negociable!' },
    ],
  },
  {
    a: 'bot_marti', b: 'bot_sofi',
    msgs: [
      { from: 'bot_marti', text: 'Buenas! vi el blazer negro, está impecable?' },
      { from: 'bot_sofi',  text: 'Sí! lo usé dos veces, como nuevo' },
      { from: 'bot_marti', text: 'Perfecto, estarías para intercambio por la remera crop?' },
      { from: 'bot_sofi',  text: 'La vi y me gustó! coordinamos el intercambio' },
    ],
  },
];

// ── Clean ─────────────────────────────────────────────────────────────────────
function clean() {
  const db = readDb();
  const botUids    = new Set(BOTS.map(b => b.uid));
  const botUserIds = new Set(db.users.filter(u => botUids.has(u.firebase_uid)).map(u => u.id));

  const botItems = db.items.filter(i => botUserIds.has(i.user_id));
  for (const item of botItems) {
    const paths = item.image_paths || [item.image_path];
    for (const p of paths) {
      const full = path.join(uploadsDir, path.basename(p));
      if (fs.existsSync(full)) { fs.unlinkSync(full); console.log(`  🗑  ${path.basename(p)}`); }
    }
  }

  const before = { users: db.users.length, items: db.items.length };
  db.users    = db.users.filter(u => !botUids.has(u.firebase_uid));
  db.items    = db.items.filter(i => !botUserIds.has(i.user_id));
  db.swipes   = (db.swipes   || []).filter(s => !botUserIds.has(s.user_id));
  db.ratings  = (db.ratings  || []).filter(r => !botUserIds.has(r.rater_id) && !botUserIds.has(r.rated_id));
  db.messages = (db.messages || []).filter(m => !botUserIds.has(m.sender_id) && !botUserIds.has(m.receiver_id));
  writeDb(db);

  console.log(`✅ Bots eliminados — usuarios ${before.users}→${db.users.length}, items ${before.items}→${db.items.length}`);
}

// ── Seed ─────────────────────────────────────────────────────────────────────
async function seed() {
  const db = readDb();
  if (!db.ratings) db.ratings = [];

  // Users
  for (const bot of BOTS) {
    if (db.users.find(u => u.firebase_uid === bot.uid)) continue;
    // account_type y tier son obligatorios: App.jsx manda a onboarding a
    // cualquier usuario sin account_type, así que sin esto los 15 bots
    // quedaban atrapados en esa pantalla y no se podía entrar con ellos.
    db.users.push({ id: nextId(db.users), firebase_uid: bot.uid, username: bot.username, promo: bot.promo, account_type: 'user', tier: 'free', created_at: new Date().toISOString() });
    console.log(`✓ Usuario: ${bot.username}`);
  }
  writeDb(db);

  // Items
  let added = 0, skipped = 0, failed = 0;
  for (const itemData of BOT_ITEMS) {
    const user = db.users.find(u => u.firebase_uid === itemData.bot);
    if (!user) continue;
    if (db.items.find(i => i.user_id === user.id && i.name === itemData.name)) { skipped++; continue; }

    const filename = `bot_${Date.now()}_${Math.random().toString(36).slice(2,7)}.jpg`;
    const dest     = path.join(uploadsDir, filename);

    process.stdout.write(`  ↓  "${itemData.name}"... `);
    try {
      await downloadImage(itemData.img, dest);
      // Verify file size (at least 5KB)
      const stat = fs.statSync(dest);
      if (stat.size < 5000) { fs.unlinkSync(dest); throw new Error('Imagen muy pequeña'); }
      console.log(`✓ ${(stat.size/1024).toFixed(0)}KB`);
    } catch (err) {
      console.log(`✗ (${err.message})`);
      if (fs.existsSync(dest)) fs.unlinkSync(dest);
      failed++;
      continue;
    }

    db.items.push({
      id: nextId(db.items),
      user_id: user.id,
      image_path: `/uploads/${filename}`,
      image_paths: [`/uploads/${filename}`],
      name: itemData.name,
      size: itemData.size,
      garment_type: itemData.garment_type,
      cut: itemData.cut,
      tipo: itemData.tipo,
      precio: itemData.precio,
      description: itemData.description,
      measurements: '{}',
      created_at: new Date().toISOString(),
    });
    writeDb(db);
    added++;
  }

  // Ratings
  let ratingsAdded = 0;
  for (const r of BOT_RATINGS) {
    const rater = db.users.find(u => u.firebase_uid === r.rater);
    const rated  = db.users.find(u => u.firebase_uid === r.rated);
    if (!rater || !rated) continue;
    if (db.ratings.find(x => x.rater_id === rater.id && x.rated_id === rated.id)) continue;
    db.ratings.push({ id: nextId(db.ratings), rater_id: rater.id, rated_id: rated.id, stars: r.stars, comment: r.comment, created_at: new Date().toISOString() });
    ratingsAdded++;
  }
  writeDb(db);

  // Swipes entre bots
  if (!db.swipes) db.swipes = [];
  let swipesAdded = 0;
  for (const sw of BOT_SWIPES) {
    const liker = db.users.find(u => u.firebase_uid === sw.liker);
    const owner = db.users.find(u => u.firebase_uid === sw.owner);
    if (!liker || !owner) continue;
    const ownerItems = db.items.filter(i => i.user_id === owner.id);
    for (const item of ownerItems) {
      if (db.swipes.find(s => s.user_id === liker.id && s.item_id === item.id)) continue;
      db.swipes.push({
        id: nextId(db.swipes),
        user_id: liker.id,
        item_id: item.id,
        liked: 1,
        created_at: new Date().toISOString(),
      });
      swipesAdded++;
    }
  }
  writeDb(db);

  // Chats entre bots
  if (!db.messages) db.messages = [];
  let msgsAdded = 0;
  // Space messages a few minutes apart so they feel natural
  for (const chat of BOT_CHATS) {
    const userA = db.users.find(u => u.firebase_uid === chat.a);
    const userB = db.users.find(u => u.firebase_uid === chat.b);
    if (!userA || !userB) continue;
    const pairExists = db.messages.find(m =>
      (m.sender_id === userA.id && m.receiver_id === userB.id) ||
      (m.sender_id === userB.id && m.receiver_id === userA.id)
    );
    if (pairExists) continue;
    let tsOffset = Date.now() - chat.msgs.length * 4 * 60 * 1000; // start N*4min ago
    for (const msg of chat.msgs) {
      const sender = db.users.find(u => u.firebase_uid === msg.from);
      const receiver = msg.from === chat.a ? userB : userA;
      if (!sender) continue;
      db.messages.push({
        id: nextId(db.messages),
        sender_id: sender.id,
        receiver_id: receiver.id,
        text: msg.text,
        created_at: new Date(tsOffset).toISOString(),
      });
      tsOffset += Math.floor(Math.random() * 3 + 2) * 60 * 1000; // 2-5 min entre mensajes
      msgsAdded++;
    }
  }
  writeDb(db);

  const botUserIds = new Set(db.users.filter(u => BOTS.find(b => b.uid === u.firebase_uid)).map(u => u.id));
  console.log(`\n✅ Seed completado`);
  console.log(`   ${BOTS.length} usuarios · ${added} prendas nuevas · ${skipped} ya existían · ${failed} fallaron`);
  console.log(`   ${ratingsAdded} calificaciones · ${swipesAdded} swipes · ${msgsAdded} mensajes agregados`);
  console.log(`   Total en db: ${db.items.filter(i => botUserIds.has(i.user_id)).length} prendas bot`);
}

if (process.argv.includes('--clean')) clean();
else seed().catch(err => { console.error('Error:', err); process.exit(1); });
