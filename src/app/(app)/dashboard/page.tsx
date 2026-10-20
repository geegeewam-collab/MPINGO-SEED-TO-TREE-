import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from '@/components/ui/Table';
import {
  TreeDeciduous,
  Package,
  Truck,
  CheckCircle2,
  Users,
  AlertCircle,
  Factory,
  FileText
} from 'lucide-react';
import { redirect } from 'next/navigation';

export const instant = false;

export default async function DashboardPage() {
  const supabase = await createClient();

  // Verify session
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/auth/login');
  }

  // Fetch profile to check role
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <AlertCircle size={48} className="text-muted-foreground mb-4" />
        <h2 className="text-xl font-bold">Profile initializing...</h2>
        <p className="text-muted-foreground">Please refresh the page in a few seconds.</p>
      </div>
    );
  }

  const stats = [
    { label: 'Active Seed Lots', value: '12', icon: Package, color: 'text-blue-600' },
    { label: 'Nursery Stock', value: '4,500', icon: Factory, color: 'text-green-600' },
    { label: 'Pending Requests', value: '8', icon: FileText, color: 'text-amber-600' },
    { label: 'Planting Cohorts', value: '24', icon: TreeDeciduous, color: 'text-emerald-600' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome, {profile.full_name || 'Operator'}</h1>
        <p className="text-muted-foreground">
          Role: <span className="capitalize font-medium text-foreground">{profile.role}</span> •
          Status: <span className="capitalize font-medium text-foreground">{profile.status}</span>
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-7">
        <Card className="md:col-span-4">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Activity</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Seed Lot SL-2026-001 Collected</TableCell>
                  <TableCell>Oct 18, 2026</TableCell>
                  <TableCell className="text-right">
                    <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">Approved</span>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Distribution DIS-442 Dispatched</TableCell>
                  <TableCell>Oct 19, 2026</TableCell>
                  <TableCell className="text-right">
                    <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700">In Transit</span>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Survival Check SC-102 Submitted</TableCell>
                  <TableCell>Oct 20, 2026</TableCell>
                  <TableCell className="text-right">
                    <span className="px-2 py-1 rounded-full text-xs bg-amber-100 text-amber-700">Pending</span>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Priority Tasks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30">
              <AlertCircle size={18} className="text-amber-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Review 3 Seed Requests</p>
                <p className="text-xs text-muted-foreground">Due by tomorrow</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30">
              <AlertCircle size={18} className="text-amber-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Verify 2 Survival Checks</p>
                <p className="text-xs text-muted-foreground">Site: Kilombero Valley</p>
              </div>
            </div>
            <Button className="w-full" variant="secondary">View All Tasks</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
