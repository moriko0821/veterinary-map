-- ============================================================
-- 全国動物病院マップ: 初期スキーマ
-- Supabase SQL Editor で 1 回だけ実行してください
-- ============================================================

-- ---------- 拡張 ----------
create extension if not exists postgis;
-- pgroonga があれば日本語全文検索を高速化。なくても ILIKE で動作。
do $$
begin
  create extension if not exists pgroonga;
exception when others then
  raise notice 'pgroonga extension unavailable, falling back to ILIKE search';
end $$;

-- ---------- clinics ----------
create table if not exists public.clinics (
  id                  text primary key,           -- Google Place ID
  name                text not null,
  address             text,
  postal_code         text,
  prefecture          text,
  city                text,
  area                text,                       -- 取得エリア（市区町村より詳細）
  rating              numeric(2,1),               -- 評価平均（0.0〜5.0）
  review_count        integer default 0,
  phone               text,
  website             text,
  google_maps_url     text,
  business_hours_raw  text,                       -- 元テキスト
  business_hours      jsonb,                      -- 構造化版（曜日→時間帯配列）
  is_24h              boolean default false,      -- 24時間営業フラグ
  open_sunday         boolean default false,
  open_saturday       boolean default false,
  closed_days         text[],                     -- 定休日リスト
  lat                 double precision,
  lng                 double precision,
  location            geography(Point, 4326),     -- PostGIS空間検索用
  reviews_text        text,                       -- 口コミ全文連結（検索用）
  geocoded_at         timestamptz,                -- ジオコーディング実施日時
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

-- 検索用インデックス
create index if not exists clinics_prefecture_idx on public.clinics (prefecture);
create index if not exists clinics_city_idx       on public.clinics (city);
create index if not exists clinics_rating_idx     on public.clinics (rating desc);
create index if not exists clinics_review_count_idx on public.clinics (review_count desc);
create index if not exists clinics_location_gix   on public.clinics using gist (location);
create index if not exists clinics_is_24h_idx     on public.clinics (is_24h) where is_24h = true;

-- pgroonga が使えれば高速日本語検索、ダメなら trigram ベース
do $$
begin
  execute 'create index if not exists clinics_reviews_pgroonga_idx
           on public.clinics using pgroonga (reviews_text)';
  execute 'create index if not exists clinics_name_pgroonga_idx
           on public.clinics using pgroonga (name)';
exception when others then
  raise notice 'pgroonga indexes skipped, using btree fallbacks';
end $$;

-- ---------- reviews ----------
create table if not exists public.reviews (
  id          bigserial primary key,
  clinic_id   text references public.clinics(id) on delete cascade,
  author      text,
  rating      integer check (rating between 1 and 5),
  text        text,
  posted_rel  text,                               -- 「1 年前」など相対表記
  posted_at   date,                               -- 推定日付（任意）
  position    smallint                            -- 0〜4: 何件目の口コミか
);

create index if not exists reviews_clinic_idx on public.reviews (clinic_id);
create index if not exists reviews_rating_idx on public.reviews (rating);

-- ---------- 位置情報自動更新トリガー ----------
create or replace function public.set_location_from_latlng()
returns trigger language plpgsql as $$
begin
  if new.lat is not null and new.lng is not null then
    new.location := st_setsrid(st_makepoint(new.lng, new.lat), 4326)::geography;
  end if;
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists trg_clinics_location on public.clinics;
create trigger trg_clinics_location
  before insert or update of lat, lng on public.clinics
  for each row execute function public.set_location_from_latlng();

-- ---------- 半径検索用 RPC ----------
-- フロントから呼ぶ用: 緯度経度と半径(m)を指定して近隣病院を取得
create or replace function public.nearby_clinics(
  center_lat double precision,
  center_lng double precision,
  radius_m   double precision default 5000,
  min_rating numeric default 0,
  min_reviews integer default 0
)
returns table (
  id text, name text, address text, prefecture text, city text,
  rating numeric, review_count integer, lat double precision, lng double precision,
  distance_m double precision
)
language sql stable as $$
  select c.id, c.name, c.address, c.prefecture, c.city,
         c.rating, c.review_count, c.lat, c.lng,
         st_distance(c.location, st_setsrid(st_makepoint(center_lng, center_lat), 4326)::geography) as distance_m
  from public.clinics c
  where c.location is not null
    and st_dwithin(c.location, st_setsrid(st_makepoint(center_lng, center_lat), 4326)::geography, radius_m)
    and (c.rating is null or c.rating >= min_rating)
    and c.review_count >= min_reviews
  order by distance_m
  limit 500;
$$;

-- ---------- Row Level Security: 一般公開（読み取りのみ） ----------
alter table public.clinics enable row level security;
alter table public.reviews enable row level security;

drop policy if exists "public read clinics" on public.clinics;
create policy "public read clinics" on public.clinics for select using (true);

drop policy if exists "public read reviews" on public.reviews;
create policy "public read reviews" on public.reviews for select using (true);

-- 書き込みは service_role キー（バックエンドスクリプト）のみに任せる
-- （anon キーで insert/update/delete はできない）

-- ---------- 完了メッセージ ----------
do $$ begin raise notice 'Schema created. Run import script next.'; end $$;
