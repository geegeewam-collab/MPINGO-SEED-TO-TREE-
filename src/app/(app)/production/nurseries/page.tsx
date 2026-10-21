import { Registry } from '@/components/modules/Registry';

export default function Page() {
  return (
    <Registry
      title="Nurseries"
      description="Approved nursery partners."
      table="nurseries"
      columns={[{key:'reference',label:'Reference'},{key:'name',label:'Name'},{key:'general_location',label:'Location'},{key:'county',label:'County'},{key:'approval_status',label:'Approval',badge:true},{key:'verification_status',label:'Verification',badge:true}]}
    />
  );
}

export const instant = false;
