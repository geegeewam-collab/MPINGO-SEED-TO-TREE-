import { RecordDetail } from '@/components/modules/RecordDetail';

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  return <RecordDetail slug="mother-trees" id={id} saved={sp.saved === '1'} />;
}

export const instant = false;
