-- ============================================================
-- セキュリティ強化マイグレーション
-- Supabase SQL Editor で実行してください
-- ============================================================
--
-- 内容:
-- 1) nearby_clinics RPC の radius_m に 150km 上限 (関東全域カバー、DoS/負荷攻撃の予防)
-- 2) 実行権限を明示的に anon, authenticated に付与
-- ============================================================

create or replace function public.nearby_clinics(
  center_lat  double precision,
  center_lng  double precision,
  radius_m    double precision default 5000,
  min_rating  numeric default 0,
  min_reviews integer default 0
)
returns table (
  id text, name text, address text, prefecture text, city text,
  rating numeric, review_count integer, lat double precision, lng double precision,
  distance_m double precision
)
language sql stable as $$
  -- radius_m は 100m 〜 150000m (=150km) にクランプ
  -- 上限を超える値が来ても勝手に 150km として扱う (エラーにはしない)
  -- 150km にしたのは「関東全域カバー」のため (東京駅起点で水戸・宇都宮・前橋まで届く)
  select c.id, c.name, c.address, c.prefecture, c.city,
         c.rating, c.review_count, c.lat, c.lng,
         st_distance(c.location, st_setsrid(st_makepoint(center_lng, center_lat), 4326)::geography) as distance_m
  from public.clinics c
  where c.location is not null
    and st_dwithin(
      c.location,
      st_setsrid(st_makepoint(center_lng, center_lat), 4326)::geography,
      least(greatest(coalesce(radius_m, 5000), 100), 150000)  -- 100m 〜 150km
    )
    and (c.rating is null or c.rating >= min_rating)
    and c.review_count >= min_reviews
  order by distance_m
  limit 500;
$$;

-- 実行権限を明示
revoke all on function public.nearby_clinics(
  double precision, double precision, double precision, numeric, integer
) from public;

grant execute on function public.nearby_clinics(
  double precision, double precision, double precision, numeric, integer
) to anon, authenticated;

-- 完了メッセージ
do $$ begin
  raise notice 'Security hardening migration applied: nearby_clinics now clamps radius to 150km (covers all of Kanto)';
end $$;
