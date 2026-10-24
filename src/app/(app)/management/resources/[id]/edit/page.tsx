import { EditRecordPage } from '@/components/modules/EditRecordPage';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EditRecordPage slug="resources" id={id} />;
}

export const instant = false;
