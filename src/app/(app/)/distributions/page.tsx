"use client";
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Plus, Search, Filter, Package, User } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Distribution, Profile, Nursery, NurseryBatch } from '@/types';

export default function DistributionsPage() {
  const supabase = createClient();
  const [distributions, setDistributions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  async function fetchDistributions() {
    setLoading(true);
    const { data, error } = await supabase
      .from('distributions')
      .select(`
        *,
        profiles(full_name),
        nurseries(name),
        nursery_batches(reference)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching distributions:', error);
    } else {
      setDistributions(data || []);
    }
    setLoading(false);
  }

  React.useEffect(() => {
    fetchDistributions();
  }, []);

  const filteredDistributions = distributions.filter(d =>
    d.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-600',
      approved: 'bg-blue-100 text-blue-600',
      dispatched: 'bg-yellow-100 text-yellow-600',
      received: 'bg-green-100 text-green-600',
      cancelled: 'bg-red-100 text-red-600',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.draft}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-[#242C27]">Distributions</h1>
          <p className="text-[#68736B]">Manage the transfer of seedlings from nurseries to growers.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="bg-[#214D38] text-white flex items-center gap-2">
          <Plus size={18} /> Create Distribution
        </Button>
      </div>

      <Card className="p-4 border-[#E0E5DE] bg-white">
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#68736B]" size={18} />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by reference or recipient..."
              className="pl-10 border-[#E0E5DE]"
            />
          </div>
          <Button variant="outline" className="border-[#E0E5DE] text-[#68736B] flex items-center gap-2">
            <Filter size={18} /> Filter
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#214D38]"></div>
          </div>
        ) : filteredDistributions.length === 0 ? (
          <div className="text-center py-12 text-[#68736B]">
            <Package size={48} className="mx-auto mb-4 opacity-20" />
            <p>No distributions found.</p>
          </div>
        ) : (
          <Table>
            <thead>
              <tr className="text-left text-[#68736B] border-b border-[#E0E5DE]">
                <th className="pb-3 font-medium">Reference</th>
                <th className="pb-3 font-medium">Recipient</th>
                <th className="pb-3 font-medium">Source Batch</th>
                <th className="pb-3 font-medium">Quantity</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Dates</th>
                <th className="pb-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDistributions.map((d) => (
                <tr key={d.id} className="border-b border-[#E0E5DE] hover:bg-[#F7F7F1] transition-colors">
                  <td className="py-4 font-medium text-[#242C27]">{d.reference}</td>
                  <td className="py-4">
                    <div className="flex items-center gap-2">
                      <User size={14} className="text-[#68736B]" />
                      {d.profiles?.full_name || 'Unknown'}
                    </div>
                  </td>
                  <td className="py-4 text-[#68736B]">{d.nursery_batches?.reference || 'N/A'}</td>
                  <td className="py-4">{d.quantity} {d.unit}</td>
                  <td className="py-4">{getStatusBadge(d.status)}</td>
                  <td className="py-4 text-xs text-[#68736B]">
                    {d.dispatch_date ? new Date(d.dispatch_date).toLocaleDateString() : 'Not dispatched'}
                  </td>
                  <td className="py-4">
                    <Button variant="ghost" size="sm" className="text-[#214D38] hover:bg-[#E5EDE3]">Details</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <DistributionFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchDistributions}
      />
    </div>
  );
}

function DistributionFormModal({
  isOpen,
  onClose,
  onSuccess
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [batches, setBatches] = useState<NurseryBatch[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [nurseries, setNurseries] = useState<Nursery[]>([]);
  const [formData, setFormData] = useState({
    recipient_id: '',
    source_nursery_id: '',
    source_batch_id: '',
    quantity: '',
    destination_site_id: '',
    notes: '',
  });

  React.useEffect(() => {
    if (isOpen) {
      async function loadOptions() {
        const [bRes, pRes, nRes] = await Promise.all([
          supabase.from('nursery_batches').select('id, reference'),
          supabase.from('profiles').select('id, full_name').eq('role', 'grower'),
          supabase.from('nurseries').select('id, name'),
        ]);
        setBatches(bRes.data || []);
        setProfiles(pRes.data || []);
        setNurseries(nRes.data || []);
      }
      loadOptions();
    }
  }, [isOpen]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    // Generate a readable reference (simple version for now)
    const ref = `DIST-${Math.floor(100000 + Math.random() * 900000)}`;

    const { error } = await supabase.from('distributions').insert([{
      ...formData,
      reference: ref,
      created_by: (await supabase.auth.getUser()).data.user?.id,
      status: 'draft'
    }]);

    if (error) {
      alert(error.message);
    } else {
      onSuccess();
      onClose();
    }
    setLoading(false);
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Distribution">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#242C27]">Recipient</label>
            <select
              className="w-full p-2 border border-[#E0E5DE] rounded-md bg-white text-sm"
              value={formData.recipient_id}
              onChange={(e) => setFormData({...formData, recipient_id: e.target.value})}
              required
            >
              <option value="">Select Grower</option>
              {profiles.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#242C27]">Source Nursery</label>
            <select
              className="w-full p-2 border border-[#E0E5DE] rounded-md bg-white text-sm"
              value={formData.source_nursery_id}
              onChange={(e) => setFormData({...formData, source_nursery_id: e.target.value})}
              required
            >
              <option value="">Select Nursery</option>
              {nurseries.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#242C27]">Source Batch</label>
            <select
              className="w-full p-2 border border-[#E0E5DE] rounded-md bg-white text-sm"
              value={formData.source_batch_id}
              onChange={(e) => setFormData({...formData, source_batch_id: e.target.value})}
              required
            >
              <option value="">Select Batch</option>
              {batches.map(b => <option key={b.id} value={b.id}>{b.reference}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#242C27]">Quantity (Seedlings)</label>
            <Input
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value)})}
              className="border-[#E0E5DE]"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[#242C27]">Notes</label>
          <textarea
            className="w-full p-2 border border-[#E0E5DE] rounded-md bg-white text-sm h-24"
            value={formData.notes}
            onChange={(e) => setFormData({...formData, notes: e.target.value})}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="ghost" onClick={onClose} className="text-[#68736B]">Cancel</Button>
          <Button type="submit" disabled={loading} className="bg-[#214D38] text-white px-6">
            {loading ? 'Creating...' : 'Create Distribution'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
