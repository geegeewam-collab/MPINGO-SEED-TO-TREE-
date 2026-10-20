"use client";
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { BookOpen, FileText, Video, ExternalLink, Search, Globe } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function PublicResourcesPage() {
  const supabase = createClient();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  async function fetchResources() {
    setLoading(true);
    const { data, error } = await supabase
      .from('resources')
      .select('*')
      .eq('approval_status', 'approved')
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

  const getTypeIcon = (type) => {
    switch (type) {
      case 'pdf': return <FileText size={18} className="text-red-500" />;
      case 'video': return <Video size={18} className="text-blue-500" />;
      case 'external': return <ExternalLink size={18} className="text-indigo-500" />;
      default: return <BookOpen size={18} className="text-[#214D38]" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F7F1] py-12 px-6">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-[#242C27]">Knowledge Library</h1>
          <p className="text-[#68736B] max-w-2xl mx-auto">
            Access approved guides, research, and educational materials on Mpingo restoration and sustainability.
          </p>
        </div>

        <div className="max-w-2xl mx-auto relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#68736B]" size={20} />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for guides, species info, or propagation tips..."
            className="pl-10 py-6 text-lg border-[#E0E5DE] rounded-2xl shadow-sm"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#214D38]"></div>
          </div>
        ) : filteredResources.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-[#E0E5DE] text-[#68736B]">
            <BookOpen size={48} className="mx-auto mb-4 opacity-20" />
            <p>No published resources available at this time.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResources.map((r) => (
              <Card key={r.id} className="p-6 bg-white border-[#E0E5DE] rounded-2xl hover:shadow-md transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-[#F7F7F1] rounded-lg group-hover:bg-[#E5EDE3] transition-colors">
                    {getTypeIcon(r.content_type)}
                  </div>
                  <span className="text-[10px] uppercase font-bold text-[#68736B] px-2 py-1 bg-[#F7F7F1] rounded">
                    {r.category || 'General'}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-[#242C27] mb-2 group-hover:text-[#214D38] transition-colors">
                  {r.title}
                </h3>
                <p className="text-sm text-[#68736B] line-clamp-3 mb-6 leading-relaxed">
                  {r.body || 'No description available.'}
                </p>
                <div className="flex items-center justify-between pt-4 border-t border-[#E0E5DE]">
                  <span className="text-xs text-[#68736B]">{r.content_type}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[#214D38] font-bold flex items-center gap-1 hover:bg-[#E5EDE3]"
                    onClick={() => {
                      if (r.external_url) window.open(r.external_url, '_blank');
                      else if (r.file_url) window.open(r.file_url, '_blank');
                      else alert('Content is being prepared.');
                    }}
                  >
                    Open <ArrowRight size={14} />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ArrowRight({ size }: { size: number }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 18 19 12 12 6"></polyline></svg>;
}
