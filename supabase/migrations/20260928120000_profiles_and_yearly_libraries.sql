-- Profiles + yearly libraries
--
-- New model
--   profiles          one row per user (identity, preferences, delivery settings)
--   libraries         one row per (profile, calendar year), created lazily
--   recommendations   belongs to a library (year) and, denormalized, to a profile
--
-- Assumptions about the OLD schema (there was no schema in the repo):
--   * public.libraries(id uuid pk, name, email, genres int[], year_from int,
--     year_to int, frequency text, day_of_week int null, receives_emails bool,
--     created_at timestamptz)
--   * public.recommendations(id, library_id uuid -> libraries.id, ..., recommended_at timestamptz)
--   * recommendations.library_id is a uuid. If it is another type, adjust the
--     column types below before running.
--
-- Migration rules
--   * The old table is renamed to libraries_legacy and kept (drop it manually
--     once the migration is verified).
--   * Every legacy row becomes ONE profile that KEEPS THE SAME ID, so existing
--     identity cookies (which hold the legacy library id) keep working.
--     Several legacy rows sharing an email become several profiles.
--   * Emails are normalized to lower(trim(email)).
--   * Defaults for new fields: language 'es', country 'AR', provider_ids '{}'.
--   * day_of_week: only 0 (Sunday) and 6 (Saturday) are allowed now. Legacy
--     daily rows and weekly rows on other weekdays are mapped to 6 (Saturday).
--   * One library per (profile, year of recommendations.recommended_at, UTC)
--     is created for existing recommendations, and each recommendation is
--     re-pointed to it. recommendations.profile_id is filled from the old
--     library_id.
--   * Orphaned recommendations (library_id matching no library) are moved to
--     recommendations_orphaned; duplicate (profile, tmdb_id) rows are deleted
--     (earliest kept) before unique(profile_id, tmdb_id) is added.
--   * Legacy rows without an email get no-email-<id>@invalid.local, emails off.
--   * The script can be re-run: each step checks the current state first.
--
-- Run in the Supabase SQL editor (or `supabase db push`). Back up first.

begin;

-- 1. profiles -----------------------------------------------------------------

create table if not exists public.profiles (
	id uuid primary key default gen_random_uuid(),
	name text not null check (char_length(name) between 2 and 80),
	email text not null,
	language text not null default 'es' check (language in ('es', 'en')),
	country text not null default 'AR' check (country ~ '^[A-Z]{2}$'),
	genres integer[] not null default '{}',
	year_from integer not null default 1990 check (year_from >= 1900),
	year_to integer not null default extract(year from now())::integer,
	provider_ids integer[] not null default '{}',
	day_of_week smallint not null default 6 check (day_of_week in (0, 6)),
	receives_emails boolean not null default true,
	created_at timestamptz not null default now(),
	constraint profiles_year_range check (year_from <= year_to)
);

create index if not exists profiles_email_idx on public.profiles (email);
create index if not exists profiles_day_of_week_idx on public.profiles (day_of_week);

-- 2. set the legacy table aside ------------------------------------------------

do $$
declare
	r record;
begin
	if to_regclass('public.libraries_legacy') is null
		and exists (
			select 1
			from information_schema.columns
			where table_schema = 'public'
				and table_name = 'libraries'
				and column_name = 'email'
		)
	then
		-- FKs from recommendations to the old table must go; they are replaced below.
		for r in
			select c.conname
			from pg_constraint c
			where c.contype = 'f'
				and c.conrelid = 'public.recommendations'::regclass
				and c.confrelid = 'public.libraries'::regclass
		loop
			execute format('alter table public.recommendations drop constraint %I', r.conname);
		end loop;

		alter table public.libraries rename to libraries_legacy;

		-- Free the default constraint name for the new table.
		if exists (
			select 1 from pg_constraint
			where conname = 'libraries_pkey'
				and conrelid = 'public.libraries_legacy'::regclass
		) then
			alter table public.libraries_legacy
				rename constraint libraries_pkey to libraries_legacy_pkey;
		end if;
	end if;
end
$$;

-- 3. yearly libraries -----------------------------------------------------------

create table if not exists public.libraries (
	id uuid primary key default gen_random_uuid(),
	profile_id uuid not null references public.profiles (id) on delete cascade,
	year integer not null check (year between 1900 and 2200),
	created_at timestamptz not null default now(),
	constraint libraries_profile_year_key unique (profile_id, year)
);

-- 4. recommendations ------------------------------------------------------------

alter table public.recommendations
	add column if not exists profile_id uuid;

-- 5. data migration (only when the legacy table is present) ------------------------

do $$
begin
	if to_regclass('public.libraries_legacy') is null then
		return;
	end if;

	-- Names are clamped to 2..80 chars, years to [1900, current year] with
	-- year_from <= year_to. Legacy rows without an email get a placeholder
	-- address and emails turned off (profiles.email is NOT NULL).
	insert into public.profiles (
		id, name, email, language, country, genres, year_from, year_to,
		provider_ids, day_of_week, receives_emails, created_at
	)
	select
		l.id,
		case when char_length(nm.n) < 2 then nm.n || '_' else nm.n end,
		coalesce(nullif(lower(btrim(l.email)), ''), 'no-email-' || l.id::text || '@invalid.local'),
		'es',
		'AR',
		coalesce(l.genres, '{}'),
		least(yr.y_from, yr.y_to),
		yr.y_to,
		'{}',
		case when l.day_of_week in (0, 6) then l.day_of_week else 6 end,
		case when nullif(btrim(l.email), '') is null then false else coalesce(l.receives_emails, true) end,
		coalesce(l.created_at, now())
	from public.libraries_legacy l
	cross join lateral (
		select left(coalesce(nullif(btrim(l.name), ''), 'Perfil'), 80) as n
	) nm
	cross join lateral (
		select
			least(greatest(coalesce(l.year_from, 1990), 1900), extract(year from now())::integer) as y_from,
			least(greatest(coalesce(l.year_to, extract(year from now())::integer), 1900), extract(year from now())::integer) as y_to
	) yr
	on conflict (id) do nothing;

	-- Recommendations still pointing at a legacy library id.
	update public.recommendations r
	set profile_id = r.library_id
	where r.profile_id is null
		and exists (select 1 from public.libraries_legacy l where l.id = r.library_id);

	-- One library per (profile, year of the recommendation). The year comes
	-- from recommended_at, then created_at (if the column exists), then now().
	insert into public.libraries (profile_id, year)
	select distinct
		r.profile_id,
		extract(year from coalesce(r.recommended_at, (to_jsonb(r) ->> 'created_at')::timestamptz, now()) at time zone 'UTC')::integer
	from public.recommendations r
	where r.profile_id is not null
	on conflict (profile_id, year) do nothing;

	-- Re-point recommendations to the yearly library. Rows already migrated
	-- (library_id is a new library id) are left alone.
	update public.recommendations r
	set library_id = nl.id
	from public.libraries nl
	where nl.profile_id = r.profile_id
		and nl.year = extract(year from coalesce(r.recommended_at, (to_jsonb(r) ->> 'created_at')::timestamptz, now()) at time zone 'UTC')::integer
		and r.library_id is distinct from nl.id
		and exists (select 1 from public.libraries_legacy l where l.id = r.library_id);
end
$$;

-- 6. constraints on recommendations -----------------------------------------------

do $$
begin
	-- Recommendations whose library_id matches no library (orphans) would make
	-- the FK below fail. Move them to recommendations_orphaned instead of
	-- deleting them.
	if not exists (
		select 1 from pg_constraint where conname = 'recommendations_library_id_fkey'
	) then
		create table if not exists public.recommendations_orphaned
			(like public.recommendations);

		with moved as (
			delete from public.recommendations r
			where not exists (select 1 from public.libraries l where l.id = r.library_id)
			returning r.*
		)
		insert into public.recommendations_orphaned select * from moved;
	end if;

	-- One row per (profile, movie). Existing duplicates are removed first,
	-- keeping the earliest recommendation.
	if not exists (
		select 1 from pg_constraint where conname = 'recommendations_profile_tmdb_key'
	) then
		delete from public.recommendations
		where ctid in (
			select ctid from (
				select ctid,
					row_number() over (
						partition by profile_id, tmdb_id
						order by recommended_at nulls last, ctid
					) as rn
				from public.recommendations
				where profile_id is not null
			) d
			where d.rn > 1
		);

		alter table public.recommendations
			add constraint recommendations_profile_tmdb_key unique (profile_id, tmdb_id);
	end if;

	if not exists (
		select 1 from pg_constraint where conname = 'recommendations_profile_id_fkey'
	) then
		alter table public.recommendations
			add constraint recommendations_profile_id_fkey
			foreign key (profile_id) references public.profiles (id) on delete cascade;
	end if;

	if not exists (
		select 1 from pg_constraint where conname = 'recommendations_library_id_fkey'
	) then
		alter table public.recommendations
			add constraint recommendations_library_id_fkey
			foreign key (library_id) references public.libraries (id) on delete cascade;
	end if;

	-- Only enforce NOT NULL when every row is migrated.
	if not exists (select 1 from public.recommendations where profile_id is null) then
		alter table public.recommendations alter column profile_id set not null;
	end if;
end
$$;

create index if not exists recommendations_profile_id_idx
	on public.recommendations (profile_id);
create index if not exists recommendations_library_id_idx
	on public.recommendations (library_id);

-- 7. access ---------------------------------------------------------------------
-- The app uses the service role key only, which bypasses RLS. Enabling RLS
-- without policies denies the anon/authenticated roles.

alter table public.profiles enable row level security;
alter table public.libraries enable row level security;

commit;
