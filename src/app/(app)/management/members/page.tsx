import { Registry } from '@/components/modules/Registry';

export default function Page() {
  return (
    <Registry
      slug="members"
      title="Network Members"
      description="Applications to join the network. Contact details are not shown in this list."
      table="member_applications"
      columns={[{key:'full_name',label:'Name'},{key:'applicant_type',label:'Type'},{key:'county',label:'County'},{key:'status',label:'Status',badge:true},{key:'created_at',label:'Applied',date:true}]}
    />
  );
}

export const instant = false;
