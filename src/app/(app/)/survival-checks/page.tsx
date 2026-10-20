"use client";
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Plus, Search, ClipboardCheck, AlertCircle, CheckCircle2, Clock, CloudOff, CloudUpload, RefreshCw, MapPin, Navigation, AlertTriangle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { calculateSurvivalMetrics } from '@/lib/calculations/survival';
import { queueOperation, getQueuedOperations } from '@/lib/offline/db';
import { syncOfflineQueue } from '@/lib/offline/sync';

export default function SurvivalChecksPage() {
  const supabase = createClient();
  const [checks, setChecks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  async function fetchChecks() {
    setLoading(true);
    const { data, error } = await supabase
      .from('survival_checks')
      .select(`
        *,
        planting_events(
          reference,
          quantity_planted,
          planting_sites(name)
        ),
        observer_id(full_name),
        verifier_id(full_name)
      `)
      .order('inspection_date', { ascending: false });

    if (error) {
      console.error('Error fetching checks:', error);
    } else {
      setChecks(data || []);
    }
    setLoading(false);
  }

  async function updatePendingCount() {
    const queue = await getQueuedOperations();
    setPendingCount(queue.length);
  }

  useEffect(() => {
    fetchChecks();
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
    if (synced > 0) fetchChecks();
    alert(`Sync complete. ${synced} items uploaded, ${errors} errors.`);
  }

  const filteredChecks = checks.filter(c =>
    c.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.planting_events?.planting_sites?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status) => {
    const styles = {
      submitted: 'bg-blue-100 text-blue-600',
      verified: 'bg-green-100 text-green-600',
      rejected: 'bg-red-100 text-red-600',
      requires_correction: 'bg-yellow-100 text-yellow-600',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.submitted}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

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
          <h1 className="text-2xl font-bold text-[#242C27]">Survival Monitoring</h1>
          <p className="text-[#68736B]">Verify seedling survival and calculate restoration outcomes.</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={handleSync} className="bg-white border-[#E0E5DE] text-[#68736B] flex items-center gap-2">
            <CloudUpload size={18} /> Sync Now
          </Button>
          <Button onClick={() => setIsModalOpen(true)} className="bg-[#214D38] text-white flex items-center gap-2">
            <Plus size={18} /> Record Inspection
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
              placeholder="Search by reference or site..."
              className="pl-10 border-[#E0E5DE]"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#214D38]"></div>
          </div>
        ) : filteredChecks.length === 0 ? (
          <div className="text-center py-12 text-[#68736B]">
            <ClipboardCheck size={48} className="mx-auto mb-4 opacity-20" />
            <p>No survival checks recorded.</p>
          </div>
        ) : (
          <Table>
            <thead className="text-left text-[#68736B] border-b border-[#E0E5DE]">
              <tr className="text-sm">
                <th className="pb-3 font-medium">Reference</th>
                <th className="pb-3 font-medium">Site</th>
                <th className="pb-3 font-medium">Date</th>
                <th className="pb-3 font-medium">Metrics</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredChecks.map((check) => {
                const metrics = calculateSurvivalMetrics(
                  check.planting_events?.quantity_planted || 0,
                  check.confirmed_alive,
                  check.confirmed_dead,
                  check.unresolved,
                  check.uninspected
                );

                return (
                  <tr key={check.id} className="border-b border-[#E0E5DE] hover:bg-[#F7F7F1] transition-colors">
                    <td className="py-4 font-medium text-[#242C27]">{check.reference}</td>
                    <td className="py-4">
                      <div className="flex flex-col">
                        <span className="font-medium">{check.planting_events?.planting_sites?.name}</span>
                        <span className="text-xs text-[#68736B]">{check.planting_events?.reference}</span>
                      </div>
                    </td>
                    <td className="py-4 text-sm">{check.inspection_date}</td>
                    <td className="py-4">
                      <div className="flex flex-col gap-1 text-xs">
                        <div className="flex justify-between gap-4">
                          <span className="text-[#68736B]">Survival:</span>
                          <span className="font-bold">{metrics.survivalAmongClassified?.toFixed(1) || 'N/A'}%</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-[#68736B]">Alive:</span>
                          <span className="font-bold">{metrics.confirmedAliveShare?.toFixed(1) || 'N/A'}%</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-[#68736B]">Coverage:</span>
                          <span className="font-bold">{metrics.assessmentCoverage?.toFixed(1) || 'N/A'}%</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4">{getStatusBadge(check.submission_status)}</td>
                    <td className="py-4">
                      <Button variant="ghost" size="sm" className="text-[#214D38] hover:bg-[#E5EDE3]">Review</Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>

      <SurvivalFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchChecks}
        isOnline={isOnline}
        onQueueSuccess={updatePendingCount}
      />
    </div>
  );
}

function SurvivalFormModal({
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
  onQueueSucceeded: () => void;
}) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState([]);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState(null);
  const [formData, setFormData] = useState({
    planting_event_id: '',
    inspection_date: new Date().toISOString().split('T')[0],
    confirmed_alive: '',
    confirmed_dead: '',
    unresolved: '',
    uninspected: '',
    sample_size: '',
    inspection_method: 'full_census',
    latitude: '',
    longitude: '',
    location_accuracy: '',
    capture_method: 'manual',
    capture_timestamp: '',
    notes: '',
  });

  useEffect(() => {
    if (isOpen) {
      async function loadEvents() {
        const { data } = await supabase
          .from('planting_events')
          .select('id, reference, quantity_planted');
        setEvents(data || []);
      }
      loadEvents();
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

    const ref = `SURV-${Math.floor(100000 + Math.random() * 900000)}`;
    const payload = { ...formData, reference: ref };

    if (isOnline) {
      const { error } = await supabase.from('survival_checks').insert([{
        ...payload,
        created_by: (await supabase.auth.getUser()).data.user?.id,
      }]);

      if (error) {
        alert(error.message);
        setLoading(false);
        return;
      }
      onSuccess();
      onClose();
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      await queueOperation({
        entityType: 'survival_check',
        payload,
        userId: user?.id,
      });
      onQueueSuccess();
      alert('Saved locally. Inspection will be synchronized when connectivity returns.');
      onClose();
    }
    setLoading(false);
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record Survival Check">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-[#242C27]">Planting Event</label>
          <select
            className="w-full p-2 border border-[#E0E5DE] rounded-md bg-white text-sm"
            value={formData.planting_event_id}
            onChange={(e) => setFormData({...formData, planting_event_id: e.target.value})}
            required
          >
            <option value="">Select Event</option>
            {events.map(e => <option key={e.id} value={e.id}>{e.reference} (Planted: {e.quantity_planted})</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#242C27]">Inspection Date</label>
            <Input
              type="date"
              value={formData.inspection_date}
              onChange={(e) => setFormData({...formData, inspection_date: e.target.value})}
              className="border-[#E0E5DE]"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#242C27]">Inspection Method</label>
            <select
              className="w-full p-2 border border-[#E0E5DE] rounded-md bg-white text-sm"
              value={formData.inspection_method}
              onChange={(e) => setFormData({...formData, inspection_method: e.target.value})}
            >
              <option value="full_census">Full Census</option>
              <option value="random_sample">Random Sample</option>
            </select>
          </div>
        </div>

        <div className="bg-[#F7F7F1] p-4 rounded-lg border border-[#E0E5DE] space-y-4">
          <label className="text-sm font-bold text-[#214D38] block">Observations</label>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-[10px] uppercase text-[#68736B] font-bold">Confirmed Alive</span>
              <Input type="number" value={formData.confirmed_alive} onChange={(e) => setFormData({...formData, confirmed_alive: parseInt(e.target.value) || 0})} className="border-[#E0E5DE] h-8 text-sm" required />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] uppercase text-[#68736B] font-bold">Confirmed Dead</span>
              <Input type="number" value={formData.confirmed_dead} onChange={(e) => setFormData({...formData, confirmed_dead: parseInt(e.target.value) || 0})} className="border-[#E0E5DE] h-8 text-sm" required />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] uppercase text-[#68736B] font-bold">Unresolved</span>
              <Input type="number" value={formData.unresolved} onChange={(e) => setFormData({...formData, unresolved: parseInt(e.target.value) || 0})} className="border-[#E0E5DE] h-8 text-sm" required />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] uppercase text-[#68736B] font-bold">Uninspected</span>
              <Input type="number" value={formData.uninspected} onChange={(e) => setFormData({...formData, uninspected: parseInt(e.target.value) || 0})} className="border-[#E0E5DE] h-8 text-sm" required />
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] uppercase text-[#68736B] font-bold">Sample Size (Trees Inspected)</span>
            <Input type="number" value={formData.sample_size} onChange={(e) => setFormData({...formData, sample_size: parseInt(e.target.value) || 0})} className="border-[#E0E5DE] h-8 text-sm" required />
          </div>
        </div>

        <div className="bg-[#F7F7F1] p-4 rounded-lg border border-[#E0E5DE] space-y-4">
          <div className="flex justify-between items-center">
            <label className="text-sm font-bold text-[#214D38] flex items-center gap-2">
              <MapPin size={16} /> Inspection Location
            </label>
            <Button type="button" onClick={captureGPS} disabled={gpsLoading} className="bg-[#214D38] text-white text-xs flex items-center gap-2">
              {gpsLoading ? <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div> : <Navigation size={14} />}
              Capture Location
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

        <div className="space-y-2">
          <label className="text-sm font-medium text-[#242C27]">Notes</label>
          <textarea className="w-full p-2 border border-[#E0E5DE] rounded-md bg-white text-sm h-20" value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="ghost" onClick={onClose} className="text-[#68736B]">Cancel</Button>
          <Button type="submit" disabled={loading} className="bg-[#214D38] text-white px-6">
            {loading ? 'Saving...' : 'Submit Inspection'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
