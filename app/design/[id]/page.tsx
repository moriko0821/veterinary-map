import { notFound } from 'next/navigation';
import { fetchSampleClinics } from '@/lib/fetch-clinics';
import Design1 from '@/components/designs/Design1';
import Design2 from '@/components/designs/Design2';
import Design3 from '@/components/designs/Design3';
import Design4 from '@/components/designs/Design4';
import Design5 from '@/components/designs/Design5';
import Design6 from '@/components/designs/Design6';
import Design7 from '@/components/designs/Design7';
import Design8 from '@/components/designs/Design8';
import Design9 from '@/components/designs/Design9';
import Design10 from '@/components/designs/Design10';

const DESIGNS = {
  '1': Design1, '2': Design2, '3': Design3, '4': Design4, '5': Design5,
  '6': Design6, '7': Design7, '8': Design8, '9': Design9, '10': Design10,
} as const;

export default async function DesignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // 本番では非公開 (開発時のデザイン検討用)
  if (process.env.NODE_ENV === 'production') notFound();

  const { id } = await params;
  const Comp = DESIGNS[id as keyof typeof DESIGNS];
  if (!Comp) notFound();

  const clinics = await fetchSampleClinics(50);
  return <Comp clinics={clinics} />;
}
