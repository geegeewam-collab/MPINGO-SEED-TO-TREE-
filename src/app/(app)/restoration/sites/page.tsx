import { Registry } from '@/components/modules/Registry';

export default function Page() {
  return (
    <Registry
      slug="sites"
      title="Planting Sites"
      description="Restoration sites. Coordinates are private and are not shown here."
      table="planting_sites"
      columns={[{key:'reference',label:'Reference'},{key:'name',label:'Name'},{key:'general_location',label:'Location'},{key:'county',label:'County'},{key:'status',label:'Status',badge:true},{key:'visibility_classification',label:'Visibility',badge:true}]}
    />
  );
}

export const instant = false;
