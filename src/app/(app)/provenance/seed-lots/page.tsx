import { Registry } from '@/components/modules/Registry';

export default function Page() {
  return (
    <Registry
      slug="seed-lots"
      title="Seed Lots"
      description="Collected seed lots with their provenance and quantities."
      table="seed_lots"
      columns={[{key:'reference',label:'Reference'},{key:'species',label:'Species'},{key:'collection_date',label:'Collected',date:true},{key:'initial_quantity',label:'Initial quantity',unit:'unit_of_measurement'},{key:'status',label:'Status',badge:true}]}
    />
  );
}

export const instant = false;
