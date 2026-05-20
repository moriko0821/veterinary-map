import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(url, anon, {
  auth: { persistSession: false },
});

export type Clinic = {
  id: string;
  name: string;
  address: string | null;
  prefecture: string | null;
  city: string | null;
  rating: number | null;
  review_count: number | null;
  phone: string | null;
  website: string | null;
  google_maps_url: string | null;
  business_hours_raw: string | null;
  is_24h: boolean;
  open_saturday: boolean;
  open_sunday: boolean;
  lat: number | null;
  lng: number | null;
};

export type Review = {
  id: number;
  clinic_id: string;
  author: string | null;
  rating: number | null;
  text: string | null;
  posted_rel: string | null;
  position: number | null;
};
