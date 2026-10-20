"use client";
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Globe, TreePine, Calendar, CheckCircle2, MapPin, Image as ImageIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { calculateSurvivalMetrics } from '@/lib/calculations/survival';

import { Grove, GroveUpdate, PlantingSite } from '@/types';

export default function PublicGrovePage({ params }: { params: { slug: string } }) {
  const supabase = createClient();
  const [grove, setGrove] = useState<Grove | null>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [updates, setUpdates] = useState<GroveUpdate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadGroveData() {
      setLoading(true);

      // 1. Fetch the grove and its associated site/event
      const { data: groveData, error: groveError } = await supabase
        .from('groves')
        .select(`
          *,
          planting_sites(*)
        `)
        .eq('slug', params.slug)
        .single();

      if (groveError || !groveData) {
        setLoading(false);
        return;
      }
      setGrove(groveData);

      // 2. Fetch the latest verified survival check for the primary event
      if (groveData.primary_planting_event_id) {
        const { data: checkData } = await supabase
          .from('survival_checks')
          .select(`*, planting_events(quantity_planted)`)
          .eq('planting_event_id', groveData.primary_planting_event_id)
          .eq('submission_status', 'verified')
          .order('inspection_date', { ascending: false })
          .limit(1)
          .single();

        if (checkData) {
          const m = calculateSurvivalMetrics(
            checkData.planting_events?.quantity_planted || 0,
            checkData.confirmed_alive,
            checkData.confirmed_dead,
            checkData.unresolved,
            checkData.uninspected
          );
          setMetrics(m);
        }
      }

      // 3. Fetch public updates
      const { data: updateData } = await supabase
        .from('grove_updates')
        .select('*')
        .eq('grove_id', groveData.id)
        .eq('is_public', true)
        .order('update_date', { ascending: false });

      setUpdates(updateData || []);
      setLoading(false);
    }

    loadGroveData();
  }, [params.slug]);

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#214D38]"></div></div>;
  if (!grove) return <div className="text-center py-20 text-[#68736B]">Grove not found or not yet published.</div>;

  return (
    <div className="min-h-screen bg-[#F7F7F1] pb-12">
      {/* Hero Header */}
      <div className="bg-[#214D38] text-white py-16 px-6 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <TreePine size={400} className="absolute -bottom-20 -right-20 rotate-12" />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-xs font-medium backdrop-blur-sm mb-4">
            <Globe size={14} /> Verified Restoration Project
          </div>
          <h1 className="text-4xl md:text-6xl font-bold">{grove.title}</h1>
          <p className="text-lg text-white/80">{grove.description}</p>
          {grove.sponsor_name && (
            <div className="pt-4">
              <span className="text-sm uppercase tracking-widest text-white/60 block mb-1">Supported by</span>
              <span className="text-xl font-semibold">{grove.sponsor_name}</span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 -mt-8 space-y-8">
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            icon={<CheckCircle2 className="text-green-600" />}
            label="Survival Rate"
            value={metrics?.survivalAmongClassified ? `${metrics.survivalAmongClassified.toFixed(1)}%` : 'Pending'}
            subtext="Among classified observations"
          />
          <StatCard
            icon={<TreePine className="text-[#214D38]" />}
            label="Confirmed Alive"
            value={metrics?.confirmedAliveShare ? `${metrics.confirmedAliveShare.toFixed(1)}%` : 'Pending'}
            subtext="Of original planting"
          />
          <StatCard
            icon={<Calendar className="text-blue-600" />}
            label="Verification"
            value={metrics ? 'Verified' : 'Pending'}
            subtext="Latest observation confirmed"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <section className="bg-white p-8 rounded-2xl border border-[#E0E5DE] shadow-sm">
              <h2 className="text-xl font-bold text-[#242C27] mb-6 flex items-center gap-2">
                <MapPin className="text-[#214D38]" /> Site Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-bold text-[#68736B] uppercase block mb-1">Location</label>
                  <p className="text-[#242C27] font-medium">{(grove as any).planting_sites?.general_location || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-[#68736B] uppercase block mb-1">Region</label>
                  <p className="text-[#242C27] font-medium">{(grove as any).planting_sites?.county || 'Tanzania'}</p>
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <h2 className="text-xl font-bold text-[#242C27] flex items-center gap-2">
                <ImageIcon className="text-[#214D38]" /> Restoration Journey
              </h2>
              <div className="space-y-6">
                {updates.length > 0 ? updates.map(update => (
                  <div key={update.id} className="bg-white p-6 rounded-2xl border border-[#E0E5DE] shadow-sm flex gap-6">
                    <div className="hidden sm:block text-center w-24 shrink-0">
                      <div className="text-xs font-bold text-[#68736B] uppercase">{update.update_date?.split('-')[1]}</div>
                      <div className="text-2xl font-bold text-[#214D38]">{update.update_date?.split('-')[2]}</div>
                    </div>
                    <div>
                      <h3 className="font-bold text-[#242C27] mb-2">{update.title}</h3>
                      <p className="text-[#68736B] text-sm leading-relaxed">{update.content}</p>
                      {update.photo_url && (
                        <img src={update.photo_url} alt={update.title} className="mt-4 rounded-xl max-h-64 w-full object-cover" />
                      )}
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-[#E0E5DE] text-[#68736B]">
                    <p>The journey is just beginning. Updates will appear here.</p>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="p-6 bg-[#214D38] text-white rounded-2xl border-none shadow-lg">
              <h3 className="font-bold text-lg mb-4">Our Commitment</h3>
              <p className="text-sm text-white/80 leading-relaxed">
                This grove is part of the Mpingo Seed-to-Tree Network, ensuring a traceable and sustainable path from the wild mother tree to the restored forest.
              </p>
              <div className="mt-6 pt-6 border-t border-white/20">
                <div className="flex items-center gap-2 text-xs font-medium">
                  <CheckCircle2 size={14} /> Fully Traceable Provenance
                </div>
                <div className="flex items-center gap-2 text-xs font-medium mt-2">
                  <CheckCircle2 size={14} /> Verified Survival Data
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, subtext }: { icon: React.ReactNode; label: string; value: string; subtext: string }) {
  return (
    <Card className="p-6 bg-white border-[#E0E5DE] rounded-2xl shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-[#F7F7F1] rounded-lg">{icon}</div>
        <span className="text-sm font-medium text-[#68736B]">{label}</span>
      </div>
      <div className="text-3xl font-bold text-[#242C27] mb-1">{value}</div>
      <div className="text-xs text-[#68736B]">{subtext}</div>
    </Card>
  );
}
