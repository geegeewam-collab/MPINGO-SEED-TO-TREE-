"use client";
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Plus, Globe, TreePine, Image as ImageIcon, Calendar, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function GrovesPage() {
  const supabase = createClient();
  const [groves, setGroves] = useState<Grove[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  async function fetchGroves() {
    setLoading(true);
    const { data, error } = await supabase
      .from('groves')
      .select(`*, planting_sites(name)`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching groves:', error);
    } else {
      setGroves(data || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchGroves();
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-[#242C27]">Sponsor Groves</h1>
          <p className="text-[#68736B]">Manage public restoration project pages for sponsors.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="bg-[#214D38] text-white flex items-center gap-2">
          <Plus size={18} /> Create Grove
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-3 flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#214D38]"></div>
          </div>
        ) : groves.length === 0 ? (
          <div className="col-span-3 text-center py-12 text-[#68736B]">
            <Globe size={48} className="mx-auto mb-4 opacity-20" />
            <p>No sponsor groves created yet.</p>
          </div>
        ) : (
          groves.map((grove) => (
            <Card key={grove.id} className="p-6 border-[#E0E5DE] bg-white hover:shadow-md transition-shadow cursor-pointer group">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-[#E5EDE3] rounded-lg text-[#214D38]">
                  <TreePine size={24} />
                </div>
                {grove.is_published ? (
                  <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-green-100 text-green-600 uppercase">Published</span>
                ) : (
                  <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600 uppercase">Draft</span>
                )}
              </div>
              <h3 className="text-lg font-bold text-[#242C27] mb-1 group-hover:text-[#214D38] transition-colors">
                {grove.title}
              </h3>
              <p className="text-sm text-[#68736B] mb-4 line-clamp-2">{grove.description}</p>
              <div className="flex items-center justify-between pt-4 border-t border-[#E0E5DE]">
                <span className="text-xs font-medium text-[#68736B]">
                  {grove.planting_sites?.name || 'No site linked'}
                </span>
                <Button variant="ghost" size="sm" className="text-[#214D38] text-xs font-bold">View Page</Button>
              </div>
            </Card>
          ))
        )}
      </div>

      <GroveFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchGroves}
      />
    </div>
  );
}

function GroveFormModal({
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
  const [sites, setSites] = useState<PlantingSite[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    sponsor_name: '',
    slug: '',
    planting_site_id: '',
    is_published: false,
  });

  useEffect(() => {
    if (isOpen) {
      async function loadSites() {
        const { data } = await supabase.from('planting_sites').select('id, name, reference');
        setSites(data || []);
      }
      loadSites();
    }
  }, [isOpen]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from('groves').insert([{
      ...formData,
      created_by: (await supabase.auth.getUser()).data.user?.id,
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
    <Modal isOpen={isOpen} onClose={onClose} title="Create Sponsor Grove">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-[#242C27]">Grove Title</label>
          <Input
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            placeholder="e.g. The Unity Forest Grove"
            className="border-[#E0E5DE]"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#242C27]">Sponsor Name</label>
            <Input
              value={formData.sponsor_name}
              onChange={(e) => setFormData({...formData, sponsor_name: e.target.value})}
              placeholder="Company or Donor Name"
              className="border-[#E0E5DE]"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#242C27]">Public URL Slug</label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#68736B]">/groves/</span>
              <Input
                value={formData.slug}
                onChange={(e) => setFormData({...formData, slug: e.target.value})}
                placeholder="my-mpingo-grove"
                className="border-[#E0E5DE]"
                required
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[#242C27]">Description</label>
          <textarea
            className="w-full p-2 border border-[#E0E5DE] rounded-md bg-white text-sm h-24"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[#242C27]">Linked Planting Site</label>
          <select
            className="w-full p-2 border border-[#E0E5DE] rounded-md bg-white text-sm"
            value={formData.planting_site_id}
            onChange={(e) => setFormData({...formData, planting_site_id: e.target.value})}
          >
            <option value="">No site linked</option>
            {sites.map(s => <option key={s.id} value={s.id}>{s.name} ({s.reference})</option>)}
          </select>
        </div>

        <div className="flex items-center gap-2 py-2">
          <input
            type="checkbox"
            id="is_published"
            checked={formData.is_published}
            onChange={(e) => setFormData({...formData, is_published: e.target.checked})}
            className="rounded border-gray-300 text-[#214D38] focus:ring-[#214D38]"
          />
          <label htmlFor="is_published" className="text-sm font-medium text-[#242C27]">Publish page immediately</label>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="ghost" onClick={onClose} className="text-[#68736B]">Cancel</Button>
          <Button type="submit" disabled={loading} className="bg-[#214D38] text-white px-6">
            {loading ? 'Creating...' : 'Create Grove'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
