import { Registry } from '@/components/modules/Registry';

export default function Page() {
  return (
    <Registry
      slug="events"
      title="Planting Events"
      description="Seedlings planted at specific sites."
      table="planting_events"
      columns={[{key:'reference',label:'Reference'},{key:'planting_date',label:'Planted',date:true},{key:'species',label:'Species'},{key:'quantity_planted',label:'Trees planted'}]}
    />
  );
}

export const instant = false;
