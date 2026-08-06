-- Rollback zu 0001_init.
--
-- Achtung: löscht alle Daten dieser Migration, inklusive Analytics.
-- Nur nach ausdrücklicher Entscheidung und mit vorherigem Backup ausführen:
--   pg_dump "$DATABASE_URL" > backup.sql

drop table if exists admin_audit_log;
drop table if exists admin_sessions;
drop table if exists analytics_daily_aggregates;
drop table if exists analytics_events;
drop table if exists room_events;
drop table if exists player_private_notes;
drop table if exists whoami_assignments;

alter table if exists rooms drop constraint if exists rooms_host_player_fk;
drop table if exists room_players;
drop table if exists rooms;

drop table if exists rate_limit_hits;
drop table if exists term_suggestions;
drop table if exists impostor_terms;
drop table if exists categories;

drop type if exists room_phase;
drop type if exists suggestion_status;
drop type if exists review_status;
