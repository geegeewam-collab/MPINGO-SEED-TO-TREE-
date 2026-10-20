"use client";
import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { TreePine, User, MapPin, FileText, CheckCircle2 } from 'lucide-react';

export default function JoinPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    // Implementation would call Supabase member_applications table
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
            <h1 className="text-2xl font-bold text-[#242C27]">Application Submitted</h1>
            <p className="text-[#68736B]">Thank you for applying to join the network. Our coordinators will review your details and get back to you soon.</p>
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
          <h1 className="text-4xl font-bold text-[#242C27]">Join the Network</h1>
          <p className="text-[#68736B] max-w-xl mx-auto">
            Become a registered part of the Mpingo restoration effort. Whether you're a grower, nursery, or researcher, we welcome your participation.
          </p>
        </div>

        <Card className="bg-white p-8 border-[#E0E5DE] shadow-sm space-y-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#242C27]">Full Name / Organisation</label>
                <Input required className="border-[#E0E5DE]" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#242C27]">Email Address</label>
                <Input type="email" required className="border-[#E0E5DE]" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#242C27]">Applicant Type</label>
                <select className="w-full p-2 border border-[#E0E5DE] rounded-md bg-white text-sm">
                  <option value="grower">Individual Grower</option>
                  <option value="nursery">Nursery Operator</option>
                  <option value="researcher">Researcher / Academic</option>
                  <option value="organisation">Conservation Organisation</option>
                  <option value="student">Student / Volunteer</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#242C27]">County / Region</label>
                <Input required className="border-[#E0E5DE]" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#242C27]">Experience & Interest</label>
              <textarea
                className="w-full p-2 border border-[#E0E5DE] rounded-md bg-white text-sm h-32"
                placeholder="Tell us about your experience with Mpingo or why you want to participate..."
              />
            </div>

            <div className="flex items-start gap-3 p-4 bg-[#F7F7F1] rounded-lg border border-[#E0E5DE]">
              <input
                type="checkbox"
                required
                className="mt-1 rounded border-gray-300 text-[#214D38]"
              />
              <p className="text-xs text-[#68736B] leading-relaxed">
                I consent to the handling of my data for the purpose of coordinating Mpingo restoration efforts. I understand my information will be used to connect me with seed sources and monitor restoration outcomes.
              </p>
            </div>

            <Button type="submit" disabled={loading} className="w-full bg-[#214D38] text-white py-4 text-lg font-bold">
              {loading ? 'Submitting...' : 'Submit Application'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
