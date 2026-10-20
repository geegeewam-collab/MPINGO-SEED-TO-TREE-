"use client";
import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Package, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function SeedRequestPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    // Implementation would call Supabase seed_requests table
    setTimeout(() => {
      setSubmitted(true);
      setLoading(false);
    }, 1000);
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#F7F7F1] flex items-center justify-center p-6">
        <Card className="max-w-md w-full p-12 text-center space-y-6 bg-white border-[#E0E5DE]">
          <div className="mx-auto w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
            <CheckCircle2 size={32} />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-[#242C27]">Request Submitted</h1>
            <p className="text-[#68736B]">Your request for seeds/seedlings has been received. A coordinator will review availability and contact you with the next steps.</p>
          </div>
          <Button onClick={() => window.location.href = '/'} className="w-full bg-[#214D38] text-white">
            Return Home
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F7F1] py-20 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12 space-y-4">
          <h1 className="text-4xl font-bold text-[#242C27]">Request Seeds or Seedlings</h1>
          <p className="text-[#68736B] max-w-xl mx-auto">
            Join the movement by requesting high-quality Mpingo seeds or produced seedlings for your restoration project.
          </p>
        </div>

        <Card className="bg-white p-8 border-[#E0E5DE] shadow-sm space-y-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#242C27]">Your Name</label>
                <Input required className="border-[#E0E5DE]" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#242C27]">Email Address</label>
                <Input type="email" required className="border-[#E0E5DE]" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#242C27]">Request Type</label>
                <select className="w-full p-2 border border-[#E0E5DE] rounded-md bg-white text-sm">
                  <option value="seeds">Seeds</option>
                  <option value="seedlings">Seedlings</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#242C27]">Requested Quantity</label>
                <div className="flex gap-2">
                  <Input type="number" required className="border-[#E0E5DE]" />
                  <Input className="w-24 border-[#E0E5DE]" placeholder="Unit (e.g. kg, qty)" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#242C27]">Intended Use</label>
              <textarea
                className="w-full p-2 border border-[#E0E5DE] rounded-md bg-white text-sm h-24"
                placeholder="Describe where you intend to plant these and the goal of your restoration..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#242C27]">County / Destination</label>
                <Input required className="border-[#E0E5DE]" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#242C27]">Desired Date</label>
                <Input type="date" className="border-[#E0E5DE]" />
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full bg-[#214D38] text-white py-4 text-lg font-bold">
              {loading ? 'Submitting...' : 'Submit Request'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
