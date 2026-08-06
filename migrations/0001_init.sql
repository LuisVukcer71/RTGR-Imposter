-- 0001_init: Grundschema für „komm 10te“.
--
-- Rein additiv: es werden ausschließlich neue Objekte angelegt, keine
-- bestehenden Tabellen verändert oder gelöscht. Rollback siehe
-- migrations/0001_init.down.sql.

create extension if not exists pgcrypto;

/* ------------------------------------------------------------------ *
 * Kategorien und Wortpool
 * ------------------------------------------------------------------ */

create table if not exists categories (
  id           serial primary key,
  name         text not null unique,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now()
);

do $$ begin
  create type review_status as enum ('approved', 'needs_human_review', 'rejected');
exception when duplicate_object then null;
end $$;

create table if not exists impostor_terms (
  id             uuid primary key default gen_random_uuid(),
  -- Stabile Kennung der gelieferten Startdaten; macht den Import idempotent.
  seed_id        text unique,
  display_term   text not null check (length(btrim(display_term)) between 1 and 60),
  canonical_term text not null check (length(btrim(canonical_term)) between 1 and 120),
  hint_term      text not null check (length(btrim(hint_term)) between 1 and 60),
  category_id    integer not null references categories (id) on delete restrict,
  enabled        boolean not null default true,
  review_status  review_status not null default 'needs_human_review',
  tags           text[] not null default '{}',
  note           text,
  draw_count     bigint not null default 0,
  last_used_at   timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- Duplikatschutz beim Import und im Admin: gleicher Begriff je Kategorie nur einmal.
create unique index if not exists impostor_terms_display_unique
  on impostor_terms (lower(display_term), category_id);

create index if not exists impostor_terms_active_idx
  on impostor_terms (category_id) where enabled;

/* ------------------------------------------------------------------ *
 * Wortvorschläge
 * ------------------------------------------------------------------ */

do $$ begin
  create type suggestion_status as enum ('new', 'in_review', 'accepted', 'rejected', 'duplicate');
exception when duplicate_object then null;
end $$;

create table if not exists term_suggestions (
  id                uuid primary key default gen_random_uuid(),
  display_term      text not null,
  canonical_term    text not null,
  hint_term         text not null,
  category_id       integer not null references categories (id) on delete restrict,
  explanation       text,
  status            suggestion_status not null default 'new',
  -- Nur Hashes: die anonyme Browserkennung und die IP werden nie im Klartext gespeichert.
  submitter_hash    text not null,
  ip_hash           text,
  converted_term_id uuid references impostor_terms (id) on delete set null,
  review_note       text,
  reviewed_at       timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists term_suggestions_status_idx on term_suggestions (status, created_at desc);

/* ------------------------------------------------------------------ *
 * Rate-Limit (gleitendes Fenster über einzelne Treffer)
 * ------------------------------------------------------------------ */

create table if not exists rate_limit_hits (
  id          bigserial primary key,
  bucket      text not null,
  subject     text not null,
  occurred_at timestamptz not null default now()
);

create index if not exists rate_limit_hits_lookup_idx
  on rate_limit_hits (bucket, subject, occurred_at desc);

/* ------------------------------------------------------------------ *
 * Wer bin ich: Räume
 * ------------------------------------------------------------------ */

do $$ begin
  create type room_phase as enum ('lobby', 'assigning', 'playing', 'closed');
exception when duplicate_object then null;
end $$;

create table if not exists rooms (
  id                 uuid primary key default gen_random_uuid(),
  code               text not null unique,
  phase              room_phase not null default 'lobby',
  -- Monoton steigend; Grundlage für Polling und optimistisches Locking.
  version            bigint not null default 1,
  locked             boolean not null default false,
  round_number       integer not null default 0,
  host_player_id     uuid,
  host_offline_since timestamptz,
  round_started_at   timestamptz,
  created_at         timestamptz not null default now(),
  last_activity_at   timestamptz not null default now()
);

create index if not exists rooms_inactivity_idx on rooms (last_activity_at) where phase <> 'playing';

create table if not exists room_players (
  id                uuid primary key default gen_random_uuid(),
  room_id           uuid not null references rooms (id) on delete cascade,
  name              text not null,
  -- Kleingeschriebene Fassung für die Duplikatprüfung ohne Groß-/Kleinschreibung.
  name_key          text not null,
  seat              integer not null check (seat >= 1),
  rejoin_token_hash text not null,
  joined_at         timestamptz not null default now(),
  last_seen_at      timestamptz not null default now(),
  constraint room_players_name_unique unique (room_id, name_key),
  -- Beim Umsortieren tauschen mehrere Zeilen ihre Nummer; die Prüfung darf
  -- deshalb erst am Transaktionsende greifen.
  constraint room_players_seat_unique unique (room_id, seat) deferrable initially deferred
);

create index if not exists room_players_room_idx on room_players (room_id, seat);

alter table rooms
  drop constraint if exists rooms_host_player_fk;
alter table rooms
  add constraint rooms_host_player_fk
  foreign key (host_player_id) references room_players (id) on delete set null;

create table if not exists whoami_assignments (
  id               uuid primary key default gen_random_uuid(),
  room_id          uuid not null references rooms (id) on delete cascade,
  round_number     integer not null,
  author_player_id uuid not null references room_players (id) on delete cascade,
  target_player_id uuid not null references room_players (id) on delete cascade,
  term             text not null check (length(btrim(term)) between 1 and 60),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  -- Genau eine Zuweisung je Autor und je Ziel pro Runde.
  constraint whoami_assignments_author_unique unique (room_id, round_number, author_player_id),
  constraint whoami_assignments_target_unique unique (room_id, round_number, target_player_id),
  constraint whoami_assignments_not_self check (author_player_id <> target_player_id)
);

create table if not exists player_private_notes (
  room_id      uuid not null references rooms (id) on delete cascade,
  player_id    uuid not null references room_players (id) on delete cascade,
  round_number integer not null,
  content      text not null default '',
  updated_at   timestamptz not null default now(),
  primary key (room_id, player_id, round_number)
);

-- Revisionsprotokoll des Raums. Bewusst ohne Inhalte: keine Begriffe, keine Notizen.
create table if not exists room_events (
  id              bigserial primary key,
  room_id         uuid not null references rooms (id) on delete cascade,
  version         bigint not null,
  kind            text not null,
  actor_player_id uuid,
  created_at      timestamptz not null default now()
);

create index if not exists room_events_room_idx on room_events (room_id, version desc);

/* ------------------------------------------------------------------ *
 * Analytics – überlebt das Löschen von Räumen bewusst
 * ------------------------------------------------------------------ */

create table if not exists analytics_events (
  id           bigserial primary key,
  name         text not null,
  device_hash  text not null,
  session_hash text not null,
  payload      jsonb not null default '{}'::jsonb,
  occurred_at  timestamptz not null,
  received_at  timestamptz not null default now()
);

create index if not exists analytics_events_time_idx on analytics_events (occurred_at desc);
create index if not exists analytics_events_name_idx on analytics_events (name, occurred_at desc);

create table if not exists analytics_daily_aggregates (
  day       date not null,
  metric    text not null,
  dimension text not null default '',
  value     numeric not null default 0,
  primary key (day, metric, dimension)
);

/* ------------------------------------------------------------------ *
 * Admin
 * ------------------------------------------------------------------ */

create table if not exists admin_sessions (
  -- Nur der Hash des Tokens liegt in der Datenbank; das Klartext-Token kennt
  -- ausschließlich der Browser im HTTP-only-Cookie.
  token_hash  text primary key,
  username    text not null,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null,
  revoked_at  timestamptz
);

create index if not exists admin_sessions_expiry_idx on admin_sessions (expires_at);

create table if not exists admin_audit_log (
  id         bigserial primary key,
  actor      text not null,
  action     text not null,
  target     text,
  details    jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_log_time_idx on admin_audit_log (created_at desc);

/* ------------------------------------------------------------------ *
 * Stammdaten: die sieben Kategorien der ersten Version
 * ------------------------------------------------------------------ */

insert into categories (name, sort_order) values
  ('Alltag', 1),
  ('Internet & Social Media', 2),
  ('Berufe', 3),
  ('Promis', 4),
  ('Filme & Serien', 5),
  ('Gaming', 6),
  ('Gegenstände', 7)
on conflict (name) do nothing;
