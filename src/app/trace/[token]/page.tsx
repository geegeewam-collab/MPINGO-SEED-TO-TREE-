import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Package, CheckCircle2, MapPin, Calendar } from 'lucide-react';
import { notFound } from 'next/navigation';


export default async function PublicTracePage({ params }: { params: { token: string } }) {
  const { token } = await params;
  const supabase = await createClient();

  // Resolve public token to a seed lot
  const { data: lot, error } = await supabase
    .from('seed_lots')
    .select('reference, species, collection_date, collection_location, initial_quantity, unit_of_measurement, status')
    .eq('public_token', token)
    .single();

  if (error || !lot) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white">
              <Package size={32} />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Provenance Trace</h1>
          <p className="text-muted-foreground">Verified record for Mpingo seed lot</p>
        </div>

        <Card className="border-2 border-primary/20">
          <CardHeader className="text-center border-b bg-muted/30">
            <CardTitle className="text-2xl font-bold">{lot.reference}</CardTitle>
            <div className="flex items-center justify-center gap-2 mt-2">
              <CheckCircle2 size={16} className="text-green-600" />
              <span className="text-sm font-medium text-green-700">Verified Provenance Record</span>
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            <div className="grid gap-8 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase">Species</p>
                <p className="text-lg font-medium">{lot.species}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase">Collection Date</p>
                <p className="text-lg font-medium">{new Date(lot.collection_date).toLocaleDateString()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase">Origin</p>
                <div className="flex items-start gap-2">
                  <MapPin size={16} className="text-muted-foreground mt-1" />
                  <p className="text-lg font-medium">{lot.collection_location}</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase">Quantity</p>
                <p className="text-lg font-medium">{lot.initial_quantity} {lot.unit_of_measurement}</p>
              </div>
            </div>

            <div className="pt-6 border-t flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  lot.status === 'collected' ? 'bg-blue-100 text-blue-700' :
                  lot.status === 'processed' ? 'bg-green-100 text-green-700' :
                  'bg-slate-100 text-slate-700'
                }`}>
                  Current Status: {lot.status}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                Token: {token.substring(0, 8)}...
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            This record is part of the Mpingo Seed-to-Tree Network,
            ensuring that every seedling planted can be traced back to its original source.
          </p>
          <Button variant="outline" onClick={() => window.location.href = '/'}>
            Learn More About MRI
          </Button>
        </div>
      </div>
    </div>
  );
}
