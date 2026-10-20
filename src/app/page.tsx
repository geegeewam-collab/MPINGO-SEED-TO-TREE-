"use client";
import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { TreePine, Globe, Users, Package, ArrowRight, CheckCircle2, MapPin } from 'lucide-react';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F7F7F1]">
      {/* Navigation */}
      <nav className="flex justify-between items-center px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="bg-[#214D38] p-1.5 rounded-lg text-white">
            <TreePine size={24} />
          </div>
          <span className="font-bold text-lg text-[#242C27]">Mpingo Seed-to-Tree Network</span>
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-[#68736B]">
          <Link href="#about" className="hover:text-[#214D38]">About</Link>
          <Link href="#resources" className="hover:text-[#214D38]">Resources</Link>
          <Link href="/join" className="hover:text-[#214D38]">Join Network</Link>
          <Link href="/seed-requests/new" className="bg-[#214D38] text-white px-4 py-2 rounded-md hover:bg-[#173B2C] transition-colors">Get Seeds</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="px-6 py-20 max-w-7xl mx-auto text-center space-y-8">
        <h1 className="text-5xl md:text-7xl font-bold text-[#242C27] leading-tight">
          Restoring the <span className="text-[#214D38]">African Blackwood</span><br />
          for future generations.
        </h1>
        <p className="text-xl text-[#68736B] max-w-3xl mx-auto leading-relaxed">
          A connected network linking seed collection, nursery production, and field monitoring to ensure
          the sustainable restoration of the Mpingo tree.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
          <Link href="/join" className="bg-[#214D38] text-white px-8 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-[#173B2C] transition-all transform hover:scale-105">
            Join the Network <ArrowRight size={20} />
          </Link>
          <Link href="/seed-requests/new" className="bg-white border border-[#E0E5DE] text-[#242C27] px-8 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-[#F7F7F1] transition-all">
            Request Seedlings
          </Link>
        </div>
      </header>

      {/* Workflow Section */}
      <section id="about" className="px-6 py-20 bg-white border-y border-[#E0E5DE]">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold text-[#242C27]">The Seed-to-Tree Journey</h2>
            <p className="text-[#68736B] max-w-2xl mx-auto">
              We connect the disparate stages of restoration into one traceable workflow, ensuring every tree planted
              has a verified provenance and a monitored future.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            <WorkflowStep
              number="01"
              title="Seed Sourcing"
              desc="Collecting high-quality seeds from verified wild mother trees."
              icon={<Globe className="text-[#214D38]" />}
            />
            <WorkflowStep
              number="02"
              title="Nursery Care"
              desc="Controlled propagation using expert-approved protocols."
              icon={<TreePine className="text-[#214D38]" />}
            />
            <WorkflowStep
              number="03"
              title="Distribution"
              desc="Connecting nurseries with approved growers and partners."
              icon={<Package className="text-[#214D38]" />}
            />
            <WorkflowStep
              number="04"
              title="Field Planting"
              desc="Recording exact planting locations via high-accuracy GPS."
              icon={<MapPin className="text-[#214D38]" />}
            />
            <WorkflowStep
              number="05"
              title="Monitoring"
              desc="Verifying survival rates to evidence real restoration impact."
              icon={<CheckCircle2 className="text-[#214D38]" />}
            />
          </div>
        </div>
      </section>

      {/* Call to Action Footer */}
      <footer className="px-6 py-20 max-w-7xl mx-auto text-center space-y-8">
        <div className="bg-[#E5EDE3] p-12 rounded-3xl border border-[#E0E5DE] space-y-6">
          <h2 className="text-3xl font-bold text-[#242C27]">Ready to participate?</h2>
          <p className="text-[#68736B] max-w-xl mx-auto">
            Whether you are a grower, a researcher, or a conservation donor, there is a place for you in the Mpingo network.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/join" className="bg-[#214D38] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#173B2C] transition-colors">
              Register Today
            </Link>
          </div>
        </div>
        <div className="pt-12 border-t border-[#E0E5DE] text-sm text-[#68736B] flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <TreePine size={16} />
            <span className="font-bold text-[#242C27]">Mpingo Seed-to-Tree Network</span>
          </div>
          <p>© 2026 Mpingo Restoration Initiative. All rights reserved.</p>
        </div>
      </footer >
    </div>
  );
}

function WorkflowStep({ number, title, desc, icon }: { number: string; title: string; desc: string; icon: React.ReactNode }) {
  return (
    <div className="relative p-6 bg-[#F7F7F1] rounded-2xl border border-[#E0E5DE] space-y-4 group hover:bg-white transition-all hover:shadow-sm">
      <div className="flex justify-between items-start">
        <div className="p-3 bg-white rounded-xl shadow-sm group-hover:bg-[#E5EDE3] transition-colors">
          {icon}
        </div>
        <span className="text-3xl font-black text-[#E5EDE3] group-hover:text-[#E5EDE3]/50 transition-colors">
          {number}
        </span>
      </div>
      <div className="space-y-2">
        <h3 className="font-bold text-[#242C27]">{title}</h3>
        <p className="text-sm text-[#68736B] leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
