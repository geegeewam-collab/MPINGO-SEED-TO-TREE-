import { ResourceList } from '@/components/modules/ResourceList';
import { PageHeader } from '@/components/ui/PageHeader';

export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string; lang?: string }> }) {
  const { q, lang } = await searchParams;
  return (
    <div>
      <PageHeader title="Resource library" description="Guides and learning material published by the network team, in English and Kiswahili." />
      <ResourceList q={q} lang={lang} />
    </div>
  );
}

export const instant = false;
