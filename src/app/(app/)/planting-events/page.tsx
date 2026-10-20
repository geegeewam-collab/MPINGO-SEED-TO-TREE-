"use client";
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Plus, Search, TreePine, MapPin, Package, User, Calendar, Camera, CloudOff, CloudUpload, RefreshCw } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { PlantingEvent, PlantingSite, Distribution, Profile } from '@/types';
import { queueOperation, getQueuedOperations } from '@/lib/offline/db';
import { syncOfflineQueue } from '@/lib/offline/sync';

export default function PlantingEventsPage() {
  const supabase = createClient();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  async function fetchEvents() {
    setLoading(true);
    const { data, error } = await supabase
      .from('planting_events')
      .select(`
        *,
        planting_sites(name, reference),
        distributions(reference, quantity),
        profiles:responsible_grower(full_name),
        recorder:recorder_id(full_name)
      `)
      .order('planting_date', { ascending: false });

    if (error) {
      console.error('Error fetching events:', error);
    } else {
      setEvents(data || []);
    }
    setLoading(false);
  }

  async function updatePendingCount() {
    const queue = await getQueuedOperations();
    setPendingCount(queue.length);
  }

  useEffect(() => {
    fetchEvents();
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
    if (synced > 0) fetchEvents();
    alert(`Sync complete. ${synced} items uploaded, ${errors} errors.`);
  }

  const filteredEvents = events.filter(e =>
    e.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.planting_sites?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.species.toLowerCase().includes(searchQuery.toLowerCase())
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
          <h1 className="text-2xl font-bold text-[#242C27]">Planting Events</h1>
          <p className="text-[#68736B]">Records of seedlings planted at registered sites.</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={handleSync} className="bg-white border-[#E0E5DE] text-[#68736B] flex items-center gap-2">
            <CloudUpload size={18} /> Sync Now
          </Button>
          <Button onClick={() => setIsModalOpen(true)} className="bg-[#214D38] text-white flex items-center gap-2">
            <Plus size={18} /> Record Planting
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
              placeholder="Search by reference, site, grower or species..."
              className="pl-10 border-[#E0E5DE]"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#214D38"></div>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-12 text-[#68736B]">
            <TreePine size={48} className="mx-auto mb-4 opacity-20" />
            <p>No planting events recorded.</p>
          </div>
        ) : (
          <Table>
            <thead className="text-left text-[#68736B] border-b border-[#E0E5DE]">
              <tr className="text-sm">
                <th className="pb-3 font-medium">Reference</th>
                <th className="pb-3 font-medium">Date</th>
                <th className="pb-3 font-medium">Site</th>
                <th className="pb-3 font-medium">Species</th>
                <th className="pb-3 font-medium">Qty</th>
                <th className="pb-3 font-medium">Grower</th>
                <th className="pb-3 font-medium">Source</th>
                <th className="pb-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map((event) => (
                <tr key={event.id} className="border-b border-[#E0E5DE] hover:bg-[#F7F7F1] transition-colors">
                  <td className="py-4 font-medium text-[#242C27]">{event.reference}</td>
                  <td className="py-4 text-sm">{event.planting_date}</td>
                  <td className="py-4">
                    <div className="flex flex-col">
                      <span className="font-medium">{event.planting_sites?.name}</span>
                      <span className="text-xs text-[#68736B]">{event.planting_sites?.reference}</span>
                    </div>
                  </td>
                  <td className="py-4 text-sm">{event.species}</td>
                  <td className="py-4 font-medium">{event.quantity_planted}</td>
                  <td className="py-4 text-sm">{event.profiles?.full_name || 'Unknown'}</td>
                  <td className="py-4 text-xs text-[#68736B]">
                    {event.distributions?.reference || 'Direct/Unknown'}
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

      <PlantingEventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchEvents}
        isOnline={isOnline}
        onQueueSuccess={updatePendingCount}
      />
    </div>
  );
}

function PlantingEventModal({
  isOpen,
  onClose,
  onSuccess,
  isOnline,
  onQueueSuccess
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  isOnline: boolean;
  onQueueSuccess: () => void;
}) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [sites, setSites] = useState<PlantingSite[]>([]);
  const [distributions, setDistributions] = useState<Distribution[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState(null);

  const [formData, setFormData] = useState({
    site_id: '',
    distribution_id: '',
    planting_date: new Date().toISOString().split('T')[0],
    species: 'Dalbergia melanoxylon',
    quantity_planted: '',
    responsible_grower: '',
    latitude: '',
    longitude: '',
    location_accuracy: '',
    capture_method: 'manual',
    capture_timestamp: '',
    notes: '',
  });

  useEffect(() => {
    if (isOpen) {
      async function loadOptions() {
        const [sRes, dRes, pRes] = await Promise.all([
          supabase.from('planting_sites').select('id, name, reference'),
          supabase.from('distributions').select('id, reference, quantity').eq('status', 'received'),
          supabase.from('profiles').select('id, full_name').eq('role', 'grower'),
        ]);
        setSites(sRes.data || []);
        setDistributions(dRes.data || []);
        setProfiles(pRes.data || []);
      }
      loadOptions();
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

    const ref = `PLANT-${Math.floor(100000 + Math.random() * 900000)}`;
    const payload = { ...formData, reference: ref };

    if (isOnline) {
      const { error } = await supabase.from('planting_events').insert([{
        ...payload,
        recorder_id: (await supabase.auth.getUser()).data.user?.id,
      }]);

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
        entityType: 'planting_event',
        payload: { ...payload, recorder_id: user?.id },
        userId: user?.id,
      });
      onQueueSuccess();
      alert('Saved locally. Event will be synchronized when connectivity returns.');
      onClose();
    }
    setLoading(false);
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record Planting Event">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#242C27]">Planting Site</label>
            <select
              className="w-full p-2 border border-[#E0E5DE] rounded-md bg-white text-sm"
              value={formData.site_id}
              onChange={(e) => setFormData({...formData, site_id: e.target.value})}
              required
            >
              <option value="">Select Site</option>
              {sites.map(s => <option key={s.id} value={s.id}>{s.name} ({s.reference})</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#242C27]">Source Distribution</label>
            <select
              className="w-full p-2 border border-[#E0E5DE] rounded-md bg-white text-sm"
              value={formData.distribution_id}
              onChange={(e) => setFormData({...formData, distribution_id: e.target.value})}
            >
              <option value="">No Distribution (Historical/Unknown)</option>
              {distributions.map(d => <option key={d.id} value={d.id}>{d.reference} ({d.quantity} qty)</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#242C27]">Planting Date</label>
            <Input
              type="date"
              value={formData.planting_date}
              onChange={(e) => setFormData({...formData, planting_date: e.target.value})}
              className="border-[#E0E5DE]"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#242C27]">Quantity Planted</label>
            <Input
              type="number"
              value={formData.quantity_planted}
              onChange={(e) => setFormData({...formData, quantity_planted: parseInt(e.target.value)})}
              className="border-[#E0E5DE]"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#242C27]">Species</label>
            <Input
              value={formData.species}
              onChange={(e) => setFormData({...formData, species: e.target.value})}
              className="border-[#E0E5DE]"
              required
            />
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

        <div className="bg-[#F7F7F1] p-4 rounded-lg border border-[#E0E5DE] space-y-4">
          <div className="flex justify-between items-center">
            <label className="text-sm font-bold text-[#214D38] flex items-center gap-2">
              <MapPin size={16} /> Event Location
            </label>
            <Button
              type="button"
              onClick={captureGPS}
              disabled={gpsLoading}
              className="bg-[#214D38] text-white text-xs flex items-center gap-2"
            >
              {gpsLoading ? <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div> : <Navigation size={14} />}
              Capture Current Location
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
              <Input
                type="number" step="any"
                value={formData.latitude}
                onChange={(e) => setFormData({...formData, latitude: e.target.value, capture_method: 'manual'})}
                className="border-[#E0E5DE] h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] uppercase text-[#68736B] font-bold">Longitude</span>
              <Input
                type="number" step="any"
                value={formData.longitude}
                onChange={(e) => setFormData({...formData, longitude: e.target.value, capture_method: 'manual'})}
                className="border-[#E0E5DE] h-8 text-sm"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[#242C27]">Notes</label>
          <textarea
            className="w-full p-2 border border-[#E0E5DE] rounded-md bg-white text-sm h-20"
            value={formData.notes}
            onChange={(e) => setFormData({...formData, notes: e.target.value})}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="ghost" onClick={onClose} className="text-[#68736B]">Cancel</Button>
          <Button type="submit" disabled={loading} className="bg-[#214D38] text-white px-6">
            {loading ? 'Saving...' : 'Record Planting'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
