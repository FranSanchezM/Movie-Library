-- Books (media_type 'book') and a generic external id
--
-- Run AFTER 20260930120000_media_types.sql.
--
--   * profile_preferences.options (jsonb): media-specific preferences. Books:
--     {"length": "short|medium|long|any", "language": "es|en|any",
--      "min_rating": 3 | 3.5 | 4}. Validated strictly by the app (whitelist).
--   * recommendations.external_id (text): id in the source catalog (TMDB id,
--     Open Library work id...). Backfilled from tmdb_id. Dedupe becomes
--     unique(profile_id, media_type, external_id) and replaces the tmdb_id one.
--     tmdb_id stays (now nullable) for TMDB-backed types.
--   * recommendations: creator (author), pages, rating (0-5 from the source)
--     and rating_count, used by books.
--   * media_type checks (recommendations and profile_preferences) accept 'book'.
--
-- Safe to re-run. RLS policies on both tables already cover the new columns.

begin;

-- 1. profile_preferences.options ------------------------------------------------------

alter table public.profile_preferences
	add column if not exists options jsonb not null default '{}'::jsonb;

alter table public.profile_preferences
	drop constraint if exists profile_preferences_media_type_check;
alter table public.profile_preferences
	add constraint profile_preferences_media_type_check
	check (media_type in ('movie', 'tv', 'book'));

-- 2. recommendations ------------------------------------------------------------------

alter table public.recommendations
	add column if not exists external_id text,
	add column if not exists creator text,
	add column if not exists pages integer,
	add column if not exists rating numeric(3, 2),
	add column if not exists rating_count integer;

update public.recommendations
set external_id = tmdb_id::text
where external_id is null and tmdb_id is not null;

alter table public.recommendations alter column tmdb_id drop not null;

do $$
begin
	if not exists (select 1 from public.recommendations where external_id is null) then
		alter table public.recommendations alter column external_id set not null;
	end if;

	alter table public.recommendations
		drop constraint if exists recommendations_media_type_check;
	alter table public.recommendations
		add constraint recommendations_media_type_check
		check (media_type in ('movie', 'tv', 'book'));

	alter table public.recommendations
		drop constraint if exists recommendations_profile_media_tmdb_key;

	if not exists (
		select 1 from pg_constraint
		where conname = 'recommendations_profile_media_external_key'
	) then
		alter table public.recommendations
			add constraint recommendations_profile_media_external_key
			unique (profile_id, media_type, external_id);
	end if;
end
$$;

commit;
