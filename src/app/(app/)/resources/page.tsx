"use client";
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Plus, Search, BookOpen, FileText, Video, ExternalLink } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Resource } from '@/types';

export default function AdminResourcesPage() {
  const supabase = createClient();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  async function fetchResources() {
    setLoading(true);
    const { data, error } = await supabase
      .from('resources')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching resources:', error);
    } else {
      setResources(data || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchResources();
  }, []);

  const filteredResources = resources.filter(r =>
    r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-[#242C27]">Knowledge Library</h1>
          <p className="text-[#68736B]">Manage approved restoration guides and educational materials.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="bg-[#214D38] text-white flex items-center gap-2">
          <Plus size={18} /> Add Resource
        </Button>
      </div>

      <Card className="p-4 border-[#E0E5DE] bg-white">
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#68736B]" size={18} />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title or category..."
              className="pl-10 border-[#E0E5DE]"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#214D38]"></div>
          </div>
        ) : filteredResources.length === 0 ? (
          <div className="text-center py-12 text-[#68736B]">
            <BookOpen size={48} className="mx-auto mb-4 opacity-20" />
            <p>No resources found.</p>
          </div>
        ) : (
          <Table>
            <thead className="text-left text-[#68736B] border-b border-[#E0E5DE]">
              <tr className="text-sm">
                <th className="pb-3 font-medium">Title</th>
                <th className="pb-3 font-medium">Category</th>
                <th className="pb-3 font-medium">Type</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredResources.map((r) => (
                <tr key={r.id} className="border-b border-[#E0E5DE] hover:bg-[#F7F7F1] transition-colors">
                  <td className="py-4 font-medium text-[#242C27]">{r.title}</td>
                  <td className="py-4 text-sm text-[#68736B]">{r.category || 'Uncategorized'}</td>
                  <td className="py-4 text-sm text-[#68736B]">{r.content_type}</td>
                  <td className="py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${r.approval_status === 'approved' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                      {r.approval_status}
                    </span>
                  </td>
                  <td className="py-4">
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" className="text-[#214D38] hover:bg-[#E5EDE3]">Edit</Button>
                      <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50">Delete</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <ResourceFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchResources}
      />
    </div>
  );
}

function ResourceFormModal({ isOpen, onClose, onSuccess }) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    content_type: 'article',
    body: '',
    file_url: '',
    external_url: '',
    approval_status: 'draft',
  });

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from('resources').insert([{
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
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Resource">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-[#242C27]">Title</label>
          <Input
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            placeholder="Resource title..."
            className="border-[#E0E5DE]"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#242C27]">Category</label>
            <Input
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              placeholder="e.g. Propagation, Soil, Legal"
              className="border-[#E0E5DE]"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#242C27]">Resource Type</label>
            <select
              className="w-full p-2 border border-[#E0E5DE] rounded-md bg-white text-sm"
              value={formData.content_type}
              onChange={(e) => setFormData({...formData, content_type: e.target.value})}
            >
              <option value="article">Article</option>
              <option value="guide">Guide</option>
              <option value="pdf">PDF Document</option>
              <option value="video">Video</option>
              <option value="external">External Link</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[#242C27]">Content / Body</label>
          <textarea
            className="w-full p-2 border border-[#E0E5DE] rounded-md bg-white text-sm h-32"
            value={formData.body}
            onChange={(e) => setFormData({...formData, body: e.target.value})}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#242C27]">File URL</label>
            <Input
              value={formData.file_url}
              onChange={(e) => setFormData({...formData, file_url: e.target.value})}
              placeholder="https://..."
              className="border-[#E0E5DE]"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#242C27]">External Link</label>
            <Input
              value={formData.external_url}
              onChange={(e) => setFormData({...formData, external_url: e.target.value})}
              placeholder="https://..."
              className="border-[#E0E5DE]"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 py-2">
          <input
            type="checkbox"
            id="approval_status"
            checked={formData.approval_status === 'approved'}
            onChange={(e) => setFormData({...formData, approval_status: e.target.checked ? 'approved' : 'draft'})}
            className="rounded border-gray-300 text-[#214D38] focus:ring-[#214D38]"
          />
          <label htmlFor="approval_status" className="text-sm font-medium text-[#242C27]">Publish immediately</label>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="ghost" onClick={onClose} className="text-[#68736B]">Cancel</Button>
          <Button type="submit" disabled={loading} className="bg-[#214D38] text-white px-6">
            {loading ? 'Saving...' : 'Save Resource'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
