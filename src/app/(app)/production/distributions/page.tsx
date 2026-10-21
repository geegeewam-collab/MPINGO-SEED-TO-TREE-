import { Registry } from '@/components/modules/Registry';

export default function Page() {
  return (
    <Registry
      title="Distributions"
      description="Seedling transfers from nurseries to growers."
      table="distributions"
      columns={[{key:'reference',label:'Reference'},{key:'quantity',label:'Quantity',unit:'unit'},{key:'intended_purpose',label:'Purpose'},{key:'status',label:'Status',badge:true},{key:'request_date',label:'Requested',date:true}]}
    />
  );
}

export const instant = false;
