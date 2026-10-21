import { Registry } from '@/components/modules/Registry';

export default function Page() {
  return (
    <Registry
      title="Sponsor Groves"
      description="Internal view of grove pages. Only published groves are visible to the public."
      table="groves"
      columns={[{key:'title',label:'Title'},{key:'sponsor_name',label:'Sponsor'},{key:'slug',label:'Public address'},{key:'is_published',label:'Published'},{key:'published_at',label:'Published on',date:true}]}
    />
  );
}

export const instant = false;
