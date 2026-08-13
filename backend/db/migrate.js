#!/usr/bin/env node
/**
 * Migra backend/db.json a Postgres (Supabase).
 *
 *   node db/migrate.js            # migra
 *   node db/migrate.js --dry-run  # sólo valida, no escribe
 *   node db/migrate.js --reset    # borra las tablas antes (¡destructivo!)
 *
 * Necesita DATABASE_URL en el entorno o en backend/.env
 *
 * Es idempotente sobre datos limpios: usa ON CONFLICT DO NOTHING, así que
 * volver a correrlo no duplica filas.
 */
const fs = require('fs');
const path = require('path');

// .env sin dependencias
const envFile = path.join(__dirname, '..', '.env');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/i);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const { Client } = require('pg');

const DRY   = process.argv.includes('--dry-run');
const RESET = process.argv.includes('--reset');
const TABLES = ['users', 'items', 'swipes', 'messages', 'ratings', 'feedback'];

function loadJson() {
  const p = path.join(__dirname, '..', 'db.json');
  if (!fs.existsSync(p)) throw new Error(`No existe ${p}`);
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

/** Comprueba lo que las FKs y UNIQUEs van a exigir, antes de escribir nada. */
function validate(d) {
  const problems = [];
  const uids = new Set((d.users || []).map(u => u.id));
  const iids = new Set((d.items || []).map(i => i.id));

  for (const i of d.items || []) {
    if (!uids.has(i.user_id)) problems.push(`item ${i.id}: user_id ${i.user_id} no existe`);
    if (!['intercambio', 'venta', 'ambos'].includes(i.tipo)) problems.push(`item ${i.id}: tipo "${i.tipo}" inválido`);
  }
  for (const u of d.users || []) {
    if (u.account_type && !['person', 'store'].includes(u.account_type)) {
      problems.push(`user ${u.id}: account_type "${u.account_type}" inválido`);
    }
  }
  for (const s of d.swipes || []) {
    if (!uids.has(s.user_id)) problems.push(`swipe ${s.id}: user_id ${s.user_id} no existe`);
    if (!iids.has(s.item_id)) problems.push(`swipe ${s.id}: item_id ${s.item_id} no existe`);
  }
  for (const m of d.messages || []) {
    if (!uids.has(m.sender_id) || !uids.has(m.receiver_id)) problems.push(`message ${m.id}: participante inexistente`);
    if (m.sender_id === m.receiver_id) problems.push(`message ${m.id}: emisor = receptor`);
  }
  for (const r of d.ratings || []) {
    if (!uids.has(r.rater_id) || !uids.has(r.rated_id)) problems.push(`rating ${r.id}: usuario inexistente`);
    if (r.rater_id === r.rated_id) problems.push(`rating ${r.id}: auto-calificación`);
    if (r.stars < 1 || r.stars > 5) problems.push(`rating ${r.id}: stars ${r.stars} fuera de rango`);
  }
  const dup = (rows, key) => {
    const seen = new Set(), out = [];
    for (const r of rows || []) { const k = key(r); if (seen.has(k)) out.push(k); seen.add(k); }
    return out;
  };
  for (const k of dup(d.swipes, s => `${s.user_id}:${s.item_id}`)) problems.push(`swipe duplicado (user,item)=${k}`);
  for (const k of dup(d.ratings, r => `${r.rater_id}:${r.rated_id}`)) problems.push(`rating duplicado (rater,rated)=${k}`);
  return problems;
}

async function main() {
  const d = loadJson();
  console.log('Origen:', TABLES.map(t => `${t}=${(d[t] || []).length}`).join(' '));

  const problems = validate(d);
  if (problems.length) {
    console.error(`\n✗ ${problems.length} problema(s) — no se migra nada:`);
    for (const p of problems.slice(0, 20)) console.error('   ' + p);
    process.exit(1);
  }
  console.log('✓ validación previa OK');
  if (DRY) return console.log('(--dry-run: no se escribió nada)');

  // Recién acá hace falta la conexión: --dry-run sólo valida el JSON.
  if (!process.env.DATABASE_URL) throw new Error('Falta DATABASE_URL (ponelo en backend/.env)');

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  try {
    await client.query('begin');

    if (RESET) {
      await client.query(`truncate ${['hidden_convos', ...TABLES].join(', ')} restart identity cascade`);
      console.log('⚠ tablas vaciadas (--reset)');
    }

    for (const u of d.users || []) {
      await client.query(
        `insert into users (id, firebase_uid, username, account_type, tier, promo, bio, goal,
                            avatar, subscribed, subscribed_at, created_at)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) on conflict (id) do nothing`,
        [u.id, u.firebase_uid, u.username, u.account_type ?? null, u.tier ?? null,
         u.promo ?? false, u.bio ?? null, u.goal ?? null, u.avatar ?? null,
         u.subscribed ?? false, u.subscribed_at ?? null, u.created_at]);
    }
    for (const i of d.items || []) {
      await client.query(
        `insert into items (id, user_id, name, size, garment_type, cut, tipo, precio,
                            description, measurements, image_path, image_paths, created_at)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) on conflict (id) do nothing`,
        [i.id, i.user_id, i.name || '', i.size ?? null, i.garment_type ?? null, i.cut ?? null,
         i.tipo, i.precio ?? null, i.description ?? null, i.measurements ?? null,
         i.image_path ?? null, i.image_paths ?? [], i.created_at]);
    }
    for (const s of d.swipes || []) {
      await client.query(
        `insert into swipes (id, user_id, item_id, liked, created_at)
         values ($1,$2,$3,$4,$5) on conflict (id) do nothing`,
        [s.id, s.user_id, s.item_id, !!s.liked, s.created_at]);
    }
    for (const m of d.messages || []) {
      await client.query(
        `insert into messages (id, sender_id, receiver_id, text, system, created_at)
         values ($1,$2,$3,$4,$5,$6) on conflict (id) do nothing`,
        [m.id, m.sender_id, m.receiver_id, m.text, !!m.system, m.created_at]);
    }
    for (const r of d.ratings || []) {
      await client.query(
        `insert into ratings (id, rater_id, rated_id, stars, comment, created_at, updated_at)
         values ($1,$2,$3,$4,$5,$6,$7) on conflict (id) do nothing`,
        [r.id, r.rater_id, r.rated_id, r.stars, r.comment ?? null, r.created_at, r.updated_at ?? null]);
    }
    for (const f of d.feedback || []) {
      await client.query(
        `insert into feedback (id, user_id, username, tipo, mensaje, created_at)
         values ($1,$2,$3,$4,$5,$6) on conflict (id) do nothing`,
        [f.id, f.user_id ?? null, f.username ?? null, f.tipo ?? null, f.mensaje, f.created_at]);
    }
    for (const h of d.hidden_convos || []) {
      await client.query(
        `insert into hidden_convos (by_user_id, other_user_id) values ($1,$2)
         on conflict do nothing`, [h.by, h.other]);
    }

    // IMPRESCINDIBLE: al insertar ids explícitos las secuencias quedan en 1 y
    // el primer insert automático choca contra una fila ya existente. Sin este
    // paso, el primer usuario o mensaje nuevo en producción falla.
    for (const t of TABLES) {
      await client.query(
        `select setval(pg_get_serial_sequence($1,'id'), coalesce((select max(id) from ${t}), 0) + 1, false)`,
        [t]);
    }

    await client.query('commit');

    console.log('\nDestino:');
    for (const t of TABLES) {
      const { rows } = await client.query(`select count(*)::int n from ${t}`);
      const src = (d[t] || []).length;
      console.log(`  ${t.padEnd(9)} ${String(rows[0].n).padStart(4)} / ${String(src).padStart(4)} origen  ${rows[0].n >= src ? '✓' : '✗'}`);
    }
    console.log('✓ migración completa');
  } catch (e) {
    await client.query('rollback');
    console.error('✗ rollback:', e.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main().catch(e => { console.error('✗', e.message); process.exit(1); });
