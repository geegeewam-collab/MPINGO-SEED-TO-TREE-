"use client";
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Plus, Search, MapPin, Navigation, AlertTriangle, CheckCircle2, CloudOff, CloudUpload, RefreshCw } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { queueOperation, getQueuedOperations, initOfflineDB } from '@/lib/offline/db';
import { syncOfflineQueue } from '@/lib/offline/sync';

export default function PlantingSitesPage() {
  const supabase = createClient();
  const [sites, setSites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  async function fetchSites() {
    setLoading(true);
    const { data, error } = await supabase
      .from('planting_sites')
      .select(`*, profiles(full_name)`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching sites:', error);
    } else {
      setSites(data || []);
    }
    setLoading(false);
  }

  async function updatePendingCount() {
    const queue = await getQueuedOperations();
    setPendingCount(queue.length);
  }

  useEffect(() => {
    fetchSites();
    updatePendingCount();

    const handleStatusChange = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleStatusChange);
      window.removeEventListener('offline', handleStatusChange);
    };
  }, []);

  async function handleSync() {
    const { synced, errors } = await syncOfflineQueue();
    await updatePendingCount();
    if (synced > 0) fetchSites();
    alert(`Sync complete. ${synced} items uploaded, ${errors} errors.`);
  }

  const filteredSites = sites.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            {!isOnline && (
              <div className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-600 rounded text-xs font-bold">
                <CloudOff size={12} /> Offline Mode
              </div>
            )}
            {pendingCount > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-600 rounded text-xs font-bold">
                <RefreshCw size={12} className="animate-spin" /> {pendingCount} Pending Sync
              </div>
            )}
          </div>
          <h1 className="text-2xl font-bold text-[#242C27]">Planting Sites</h1>
          <p className="text-[#68736B]">Registry of restoration sites and their coordinates.</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={handleSync} className="bg-white border-[#E0E5DE] text-[#68736B] flex items-center gap-2">
            <CloudUpload size={18} /> Sync Now
          </Button>
          <Button onClick={() => setIsModalOpen(true)} className="bg-[#214D38] text-white flex items-center gap-2">
            <Plus size={18} /> Register Site
          </Button>
        </div>
      </div>

      <Card className="p-4 border-[#E0E5DE] bg-white">
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#68736B]" size={18} />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, reference or grower..."
              className="pl-10 border-[#E0E5DE]"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#214D38]"></div>
          </div>
        ) : filteredSites.length === 0 ? (
          <div className="text-center py-12 text-[#68736B]">
            <MapPin size={48} className="mx-auto mb-4 opacity-20" />
            <p>No planting sites registered.</p>
          </div>
        ) : (
          <Table>
            <thead className="text-left text-[#68736B] border-b border-[#E0E5DE]">
              <tr>
                <th className="pb-3 font-medium">Reference</th>
                <th className="pb-3 font-medium">Site Name</th>
                <th className="pb-3 font-medium">Grower</th>
                <th className="pb-3 font-medium">Location</th>
                <th className="pb-3 font-medium">Coordinates</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSites.map((site) => (
                <tr key={site.id} className="border-b border-[#E0E5DE] hover:bg-[#F7F7F1] transition-colors">
                  <td className="py-4 font-medium text-[#242C27]">{site.reference}</td>
                  <td className="py-4">{site.name}</td>
                  <td className="py-4">{site.profiles?.full_name || 'Unknown'}</td>
                  <td className="py-4 text-sm text-[#68736B]">{site.general_location}</td>
                  <td className="py-4 text-xs font-mono text-[#68736B]">
                    {site.latitude ? `${site.latitude.toFixed(4)}, ${site.longitude.toFixed(4)}` : 'Not recorded'}
                  </td>
                  <td className="py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${site.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
                      {site.status}
                    </span>
                  </td>
                  <td className="py-4">
                    <Button variant="ghost" size="sm" className="text-[#214D38] hover:bg-[#E5EDE3]">Edit</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <SiteFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchSites}
        isOnline={isOnline}
        onQueueSuccess={updatePendingCount}
      />
    </div>
  );
}

function SiteFormModal({ isOpen, onClose, onSuccess, isOnline, onQueueSuccess }) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [profiles, setProfiles] = useState([]);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    general_location: '',
    county: '',
    country: 'Tanzania',
    latitude: '',
    longitude: '',
    location_accuracy: '',
    capture_method: 'manual',
    capture_timestamp: '',
    responsible_grower: '',
    habitat_notes: '',
  });

  useEffect(() => {
    if (isOpen) {
      async function loadGrowers() {
        const { data } = await supabase.from('profiles').select('id, full_name').eq('role', 'grower');
        setProfiles(data || []);
      }
      loadGrowers();
    }
  }, [isOpen]);

  async function captureGPS() {
    setGpsLoading(true);
    setGpsError(null);
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser');
      setGpsLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData({
          ...formData,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          location_accuracy: position.coords.accuracy,
          capture_method: 'gps',
          capture_timestamp: new Date().toISOString(),
        });
        setGpsLoading(false);
      },
      (error) => {
        setGpsError('Location capture failed. Please try again.');
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    const ref = `SITE-${Math.floor(100000 + Math.random() * 900000)}`;
    const payload = { ...formData, reference: ref };

    if (isOnline) {
      const { error } = await supabase.from('planting_sites').insert([payload]);
      if (error) {
        alert(error.message);
        setLoading(false);
        return;
      }
      onSuccess();
      onClose();
    } else {
      // OFFLINE MODE: Queue the operation
      const { data: { user } } = await supabase.auth.getUser();
      await queueOperation({
        entityType: 'planting_site',
        payload,
        userId: user?.id,
      });
      onQueueSuccess();
      alert('Saved locally. Site will be synchronized when connectivity returns.');
      onClose();
    }
    setLoading(false);
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Register Planting Site">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#242C27]">Site Name</label>
            <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="border-[#E0E5DE]" required />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#242C27]">Responsible Grower</label>
            <select
              className="w-full p-2 border border-[#E0E5DE] rounded-md bg-white text-sm"
              value={formData.responsible_grower}
              onChange={(e) => setFormData({...formData, responsible_grower: e.target.value})}
              required
            >
              <option value="">Select Grower</option>
              {profiles.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[#242C27]">General Location</label>
          <Input value={formData.general_location} onChange={(e) => setFormData({...formData, general_location: e.target.value})} className="border-[#E0E5DE]" required />
        </div>

        <div className="bg-[#F7F7F1] p-4 rounded-lg border border-[#E0E5DE] space-y-4">
          <div className="flex justify-between items-center">
            <label className="text-sm font-bold text-[#214D38] flex items-center gap-2">
              <MapPin size={16} /> Geographic Coordinates
            </label>
            <Button type="button" onClick={captureGPS} disabled={gpsLoading} className="bg-[#214D38] text-white text-xs flex items-center gap-2">
              {gpsLoading ? <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div> : <Navigation size={14} />}
              Use My Location
            </Button>
          </div>

          {gpsError && (
            <div className="flex items-start gap-2 text-red-600 bg-red-50 p-2 rounded text-xs border border-red-100">
              <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
              <p>{gpsError}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-[10px] uppercase text-[#68736B] font-bold">Latitude</span>
              <Input type="number" step="any" value={formData.latitude} onChange={(e) => setFormData({...formData, latitude: e.target.value, capture_method: 'manual'})} className="border-[#E0E5DE] h-8 text-sm" />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] uppercase text-[#68736B] font-bold">Longitude</span>
              <Input type="number" step="any" value={formData.longitude} onChange={(e) => setFormData({...formData, longitude: e.target.value, capture_method: 'manual'})} className="border-[#E0E5DE] h-8 text-sm" />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="ghost" onClick={onClose} className="text-[#68736B]">Cancel</Button>
          <Button type="submit" disabled={loading} className="bg-[#214D38] text-white px-6">
            {loading ? 'Saving...' : 'Save Planting Site'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
