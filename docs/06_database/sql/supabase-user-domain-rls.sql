-- Supabase user domain / profile / membership RLS baseline
-- 適用前提: public.user_profiles, public.user_state_snapshots, public.member_content テーブルが存在すること

alter table if exists public.user_profiles enable row level security;
alter table if exists public.user_state_snapshots enable row level security;
alter table if exists public.member_content enable row level security;

-- 自分の profile 参照/更新
create policy if not exists "user_profiles_select_own"
  on public.user_profiles for select
  using (auth.uid() = auth_user_id);

create policy if not exists "user_profiles_update_own"
  on public.user_profiles for update
  using (auth.uid() = auth_user_id)
  with check (auth.uid() = auth_user_id);

-- state snapshot は本人参照のみ。更新は backend service role 経由
create policy if not exists "user_state_snapshots_select_own"
  on public.user_state_snapshots for select
  using (auth.uid() = auth_user_id);

create policy if not exists "user_state_snapshots_deny_client_write"
  on public.user_state_snapshots for all
  using (false)
  with check (false);

-- member content: 会員 or grace のみ参照
create policy if not exists "member_content_select_member"
  on public.member_content for select
  using (
    exists (
      select 1
      from public.user_state_snapshots s
      where s.auth_user_id = auth.uid()
        and s.membership_status in ('member', 'grace')
        and s.account_status = 'active'
    )
  );
