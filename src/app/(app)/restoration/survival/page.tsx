import { Registry } from '@/components/modules/Registry';

export default function Page() {
  return (
    <Registry
      title="Survival Checks"
      description="Field inspections. Only verified checks count toward reported survival."
      table="survival_checks"
      columns={[{key:'reference',label:'Reference'},{key:'inspection_date',label:'Inspected',date:true},{key:'confirmed_alive',label:'Alive'},{key:'confirmed_dead',label:'Dead'},{key:'unresolved',label:'Unresolved'},{key:'uninspected',label:'Uninspected'},{key:'submission_status',label:'Status',badge:true}]}
    />
  );
}

export const instant = false;
