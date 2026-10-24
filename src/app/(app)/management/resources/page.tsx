import { Registry } from '@/components/modules/Registry';

export default function Page() {
  return (
    <Registry
      slug="resources"
      title="Manage Resources"
      description="Guides and learning material. Only published resources appear in the library. Publish only guidance that MRI or a named expert has reviewed."
      table="resources"
      columns={[{key:'title',label:'Title'},{key:'category',label:'Category'},{key:'content_type',label:'Type'},{key:'language',label:'Language'},{key:'approval_status',label:'Status',badge:true},{key:'created_at',label:'Added',date:true}]}
    />
  );
}

export const instant = false;
