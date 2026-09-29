-- Supabase Auth (Google) for profiles
--
-- Run AFTER 20260928120000_profiles_and_yearly_libraries.sql.
--
--   * profiles.user_id (uuid, unique, references auth.users): one profile per
--     auth user. NULL for legacy profiles until they are claimed.
--   * A partial unique index on email for claimed profiles (one email, one
--     profile). Legacy rows may still share an email until claimed.
--   * claim_legacy_profile(): called after the first Google sign-in. Claims the
--     oldest unclaimed profile whose email equals the account's VERIFIED email.
--     SECURITY DEFINER because the caller cannot see unclaimed rows through RLS.
--   * RLS policies so user-facing code can use the anon key + user JWT. The
--     service-role key is then only needed by cron/Inngest.
--   * RLS is also enabled on recommendations and on the leftover tables
--     (libraries_legacy, recommendations_orphaned) so the public anon key
--     cannot read or write them.
--
-- Legacy profiles that share one email: only the oldest one is claimed; the
-- rest stay unclaimed (they keep receiving the weekly email until removed).

begin;

-- 1. profiles.user_id --------------------------------------------------------------

alter table public.profiles
	add column if not exists user_id uuid unique
	references auth.users (id) on delete cascade;

create unique index if not exists profiles_email_claimed_key
	on public.profiles (email)
	where user_id is not null;

-- 2. claim a legacy profile ------------------------------------------------------------

create or replace function public.claim_legacy_profile()
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
	uid uuid := auth.uid();
	claimed uuid;
begin
	if uid is null then
		return null;
	end if;

	-- Already has a profile: nothing to claim.
	if exists (select 1 from public.profiles where user_id = uid) then
		return null;
	end if;

	update public.profiles p
	set user_id = uid
	from auth.users u
	where p.id = (
			select p2.id
			from public.profiles p2
			where p2.user_id is null
				and p2.email = lower(btrim(u.email))
			order by p2.created_at
			limit 1
		)
		and u.id = uid
		and u.email is not null
		and u.email_confirmed_at is not null
	returning p.id into claimed;

	return claimed;
end
$$;

revoke all on function public.claim_legacy_profile() from public, anon;
grant execute on function public.claim_legacy_profile() to authenticated;

-- 3. RLS policies ------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.libraries enable row level security;
alter table public.recommendations enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
	for select to authenticated using (user_id = auth.uid());

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
	for insert to authenticated with check (user_id = auth.uid());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
	for update to authenticated
	using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists profiles_delete_own on public.profiles;
create policy profiles_delete_own on public.profiles
	for delete to authenticated using (user_id = auth.uid());

drop policy if exists libraries_own on public.libraries;
create policy libraries_own on public.libraries
	for all to authenticated
	using (exists (
		select 1 from public.profiles p
		where p.id = libraries.profile_id and p.user_id = auth.uid()
	))
	with check (exists (
		select 1 from public.profiles p
		where p.id = libraries.profile_id and p.user_id = auth.uid()
	));

drop policy if exists recommendations_own on public.recommendations;
create policy recommendations_own on public.recommendations
	for all to authenticated
	using (exists (
		select 1 from public.profiles p
		where p.id = recommendations.profile_id and p.user_id = auth.uid()
	))
	with check (
		exists (
			select 1 from public.profiles p
			where p.id = recommendations.profile_id and p.user_id = auth.uid()
		)
		and exists (
			select 1 from public.libraries l
			where l.id = recommendations.library_id
				and l.profile_id = recommendations.profile_id
		)
	);

-- Leftover tables: no policies = no access for anon/authenticated.
do $$
begin
	if to_regclass('public.libraries_legacy') is not null then
		alter table public.libraries_legacy enable row level security;
	end if;
	if to_regclass('public.recommendations_orphaned') is not null then
		alter table public.recommendations_orphaned enable row level security;
	end if;
end
$$;

commit;
