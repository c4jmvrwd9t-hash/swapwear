-- SwapWear · esquema Postgres (Supabase)
--
-- Reemplaza el db.json plano. Los tipos y CHECKs salen de lo que server.js
-- ya validaba a mano; los valores se verificaron contra los datos reales
-- antes de agregar restricciones (sin huérfanos ni duplicados).
--
-- Nota: db.json tenía un array `matches` que ningún endpoint escribe nunca —
-- /api/matches los calcula al vuelo cruzando swipes. No se migra.

create table if not exists users (
  id            bigserial primary key,
  firebase_uid  text        not null unique,
  username      text        not null,
  -- server.js:327 sólo acepta estos dos valores
  account_type  text        check (account_type in ('person', 'store')),
  tier          text        not null default 'free' check (tier in ('free', 'basic', 'pro')),
  promo         boolean     not null default false,
  bio           text        check (char_length(bio) <= 120),
  avatar        text,
  created_at    timestamptz not null default now()
);

create table if not exists items (
  id            bigserial   primary key,
  user_id       bigint      not null references users(id) on delete cascade,
  name          text        not null,
  size          text,
  garment_type  text,
  cut           text,
  tipo          text        not null check (tipo in ('intercambio', 'venta', 'ambos')),
  precio        integer     check (precio is null or precio >= 0),
  description   text,
  measurements  text,
  -- image_path es la principal; image_paths son todas (hasta 5)
  image_path    text,
  image_paths   text[]      not null default '{}',
  created_at    timestamptz not null default now()
);

create table if not exists swipes (
  id          bigserial   primary key,
  user_id     bigint      not null references users(id) on delete cascade,
  item_id     bigint      not null references items(id) on delete cascade,
  -- era 0/1 en JSON
  liked       boolean     not null,
  created_at  timestamptz not null default now(),
  -- un usuario no puede swipear dos veces la misma prenda
  unique (user_id, item_id)
);

create table if not exists messages (
  id           bigserial   primary key,
  sender_id    bigint      not null references users(id) on delete cascade,
  receiver_id  bigint      not null references users(id) on delete cascade,
  text         text        not null,
  created_at   timestamptz not null default now(),
  check (sender_id <> receiver_id)
);

create table if not exists ratings (
  id          bigserial   primary key,
  rater_id    bigint      not null references users(id) on delete cascade,
  rated_id    bigint      not null references users(id) on delete cascade,
  stars       smallint    not null check (stars between 1 and 5),
  comment     text,
  created_at  timestamptz not null default now(),
  -- una calificación por par; /api/rate hace upsert sobre esto
  unique (rater_id, rated_id),
  check (rater_id <> rated_id)
);

create table if not exists feedback (
  id          bigserial   primary key,
  -- si el usuario se borra, el feedback queda pero anónimo
  user_id     bigint      references users(id) on delete set null,
  username    text,
  tipo        text,
  mensaje     text        not null,
  created_at  timestamptz not null default now()
);

-- Índices para las consultas que ya hace server.js
create index if not exists items_user_id_idx       on items(user_id);
create index if not exists items_created_at_idx    on items(created_at desc);
create index if not exists swipes_user_id_idx      on swipes(user_id);
create index if not exists swipes_item_id_idx      on swipes(item_id);
-- /api/stats cuenta los swipes del día
create index if not exists swipes_user_created_idx on swipes(user_id, created_at desc);
-- /api/messages levanta la conversación entre dos usuarios en ambos sentidos
create index if not exists messages_pair_idx       on messages(sender_id, receiver_id, created_at desc);
create index if not exists messages_receiver_idx   on messages(receiver_id, created_at desc);
create index if not exists ratings_rated_id_idx    on ratings(rated_id);
