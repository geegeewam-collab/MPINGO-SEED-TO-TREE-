import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Package, Plus, Search, Filter, QrCode } from 'lucide-react';
import { redirect } from 'next/navigation';

export default async function SeedLotsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || (profile.role !== 'admin' && profile.role !== 'coordinator' && profile.role !== 'verifier')) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <h2 className="text-xl font-bold">Access Denied</h2>
        <p className="text-muted-foreground">You do not have permission to access the Seed Lot registry.</p>
      </div>
    );
  }

  const { data: seedLots, error } = await supabase
    .from('seed_lots')
    .select('id, reference, species, collection_date, initial_quantity, unit_of_measurement, status')
    .order('created_at', { ascending: false });

  if (error) {
    return <div className="p-6 text-red-600">Error loading seed lots: {error.message}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Package className="text-primary" /> Seed Lots
          </h1>
          <p className="text-muted-foreground">
            Manage collected seed lots and their provenance.
          </p>
        </div>
        <Button className="w-fit" onClick={() => window.location.href = '/app/seed-lots/new'}>
          <Plus size={18} className="mr-2" /> New Seed Lot
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input placeholder="Search by reference or species..." className="pl-10" />
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" className="flex items-center gap-2">
                <Filter size={18} /> Filter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {seedLots && seedLots.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Species</TableHead>
                  <TableHead>Collected</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {seedLots.map((lot) => (
                  <TableRow key={lot.id}>
                    <TableCell className="font-medium">{lot.reference}</TableCell>
                    <TableCell>{lot.species}</TableCell>
                    <TableCell>{new Date(lot.collection_date).toLocaleDateString()}</TableCell>
                    <TableCell>{lot.initial_quantity} {lot.unit_of_measurement}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        lot.status === 'collected' ? 'bg-blue-100 text-blue-700' :
                        lot.status === 'processed' ? 'bg-green-100 text-green-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {lot.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="sm" asChild>
                        <a href={`/app/seed-lots/${lot.id}`}>Details</a>
                      </Button>
                      <Button variant="outline" size="sm" className="flex items-center gap-2">
                        <QrCode size={14} /> QR
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-12 text-center space-y-4">
              <Package size={48} className="mx-auto text-muted-foreground" />
              <div>
                <p className="text-lg font-medium">No seed lots registered yet</p>
                <p className="text-muted-foreground">Start by recording a new seed collection.</p>
              </div>
              <Button onClick={() => window.location.href = '/app/seed-lots/new'}>
                Create Seed Lot
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
