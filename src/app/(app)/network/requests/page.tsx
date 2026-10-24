import { Registry } from '@/components/modules/Registry';

export default function Page() {
  return (
    <Registry
      slug="requests"
      title="Seed Requests"
      description="Requests for seed or seedlings. Contact details are not shown in this list."
      table="seed_requests"
      columns={[{key:'reference',label:'Reference'},{key:'requester_name',label:'Requester'},{key:'request_type',label:'Type'},{key:'requested_quantity',label:'Quantity',unit:'unit'},{key:'county',label:'County'},{key:'status',label:'Status',badge:true},{key:'created_at',label:'Received',date:true}]}
    />
  );
}

export const instant = false;
