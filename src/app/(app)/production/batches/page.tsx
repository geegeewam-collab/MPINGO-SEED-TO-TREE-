import { Registry } from '@/components/modules/Registry';

export default function Page() {
  return (
    <Registry
      slug="batches"
      title="Nursery Batches"
      description="Sowing, germination and current stock for each batch."
      table="nursery_batches"
      columns={[{key:'reference',label:'Reference'},{key:'seeds_sown',label:'Seeds sown'},{key:'seedlings_produced',label:'Seedlings produced'},{key:'current_stock',label:'Current stock'},{key:'propagation_stage',label:'Stage',badge:true},{key:'last_inspection',label:'Last inspection',date:true}]}
    />
  );
}

export const instant = false;
