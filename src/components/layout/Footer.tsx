// src/components/layout/Footer.tsx
"use client";

import Link from 'next/link';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Footer() {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [type, setType] = useState<'BUG' | 'FEATURE' | 'GENERAL' | 'NPS'>('GENERAL');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [nps, setNps] = useState<string>('');
  const [success, setSuccess] = useState<string | null>(null);

  async function submitFeedback() {
    try {
      setSubmitting(true);
      const payload: any = {
        type,
        title: title || undefined,
        message: message || undefined,
        email: email || undefined,
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        platform: 'WEB',
      };
      if (type === 'NPS') {
        const score = Number(nps);
        if (Number.isFinite(score)) payload.nps_score = score;
      }
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to submit');
      setSuccess('Thanks for your feedback!');
      setTitle('');
      setMessage('');
      setEmail('');
      setNps('');
      setType('GENERAL');
    } catch (e: any) {
      alert(e?.message || 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  }
  return (
    <footer className="bg-brand-secondary-dark border-t border-brand-primary-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-lg font-semibold text-brand-primary mb-4">Massimino</h3>
            <p className="text-gray-600 mb-4">
              The safety-first fitness community platform for trainers and enthusiasts. 
              Safe workouts for everyone.
            </p>
            <p className="text-sm text-gray-500">
              Massimino is a product of Beresol BV. Copyright of Beresol BV
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-brand-primary uppercase tracking-wider mb-4">
              Quick Links
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/dashboard" className="text-gray-600 hover:text-brand-primary transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/workout-log" className="text-gray-600 hover:text-brand-primary transition-colors">
                  Workout Log
                </Link>
              </li>
              <li>
                <Link href="/exercises" className="text-gray-600 hover:text-brand-primary transition-colors">
                  Exercises
                </Link>
              </li>
              <li>
                <Link href="/community" className="text-gray-600 hover:text-brand-primary transition-colors">
                  Community
                </Link>
              </li>
            </ul>
          </div>

          {/* Partnerships */}
          <div>
            <h4 className="text-sm font-semibold text-brand-primary uppercase tracking-wider mb-4">
              Partnerships
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/partnerships" className="text-gray-600 hover:text-brand-primary transition-colors">
                  Gym Partnerships
                </Link>
              </li>
              <li>
                <Link href="/partnerships#advertising" className="text-gray-600 hover:text-brand-primary transition-colors">
                  Advertising
                </Link>
              </li>
              <li>
                <Link href="/partnerships#api" className="text-gray-600 hover:text-brand-primary transition-colors">
                  API Integration
                </Link>
              </li>
              <li>
                <button onClick={() => setOpen(true)} className="text-gray-600 hover:text-brand-primary transition-colors">
                  Give Us Your Feedback
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-500">
              © 2025 Beresol BV. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link href="/privacy" className="text-sm text-gray-500 hover:text-gray-700">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-sm text-gray-500 hover:text-gray-700">
                Terms of Service
              </Link>
              <Link href="/safety" className="text-sm text-gray-500 hover:text-gray-700">
                Safety Guidelines
              </Link>
              <Link href="/cookies" className="text-sm text-gray-500 hover:text-gray-700">
                Cookies
              </Link>
              <Link href="/legal/subprocessors" className="text-sm text-gray-500 hover:text-gray-700">
                Subprocessors
              </Link>
            </div>
          </div>
        </div>
      </div>
      {/* Feedback Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Feedback</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-600">Type</label>
              <Select value={type} onValueChange={(v: any) => setType(v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="GENERAL">General</SelectItem>
                  <SelectItem value="BUG">Bug</SelectItem>
                  <SelectItem value="FEATURE">Feature Request</SelectItem>
                  <SelectItem value="NPS">NPS</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {type !== 'NPS' && (
              <div>
                <label className="text-sm text-gray-600">Title (optional)</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Short summary" />
              </div>
            )}
            {type === 'NPS' ? (
              <div>
                <label className="text-sm text-gray-600">NPS Score (0-10)</label>
                <Input value={nps} onChange={(e) => setNps(e.target.value)} placeholder="e.g. 9" />
              </div>
            ) : (
              <div>
                <label className="text-sm text-gray-600">Message</label>
                <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Tell us more..." rows={4} />
              </div>
            )}
            <div>
              <label className="text-sm text-gray-600">Email (optional, for follow-up)</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            {success && (
              <div className="text-sm text-emerald-600">{success}</div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Close</Button>
            <Button onClick={submitFeedback} disabled={submitting}>
              {submitting ? 'Sending...' : 'Send'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </footer>
  );
}
