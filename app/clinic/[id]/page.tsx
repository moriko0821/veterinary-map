import ClinicDetail from '@/components/ClinicDetail';

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ClinicDetail id={id} />;
}
