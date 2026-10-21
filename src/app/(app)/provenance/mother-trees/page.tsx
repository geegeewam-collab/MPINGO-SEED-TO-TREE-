import { Registry } from '@/components/modules/Registry';

export default function Page() {
  return (
    <Registry
      title="Mother Trees"
      description="Registry of source trees. Exact coordinates are private and are not shown here."
      table="mother_trees"
      columns={[{key:'reference',label:'Reference'},{key:'species',label:'Species'},{key:'general_location',label:'Location'},{key:'county',label:'County'},{key:'verification_status',label:'Verification',badge:true},{key:'date_recorded',label:'Recorded',date:true}]}
    />
  );
}

export const instant = false;
