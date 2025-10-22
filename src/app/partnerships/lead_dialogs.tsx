// src/app/partnerships/lead_dialogs.tsx
"use client";
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

type Variant = 'generic' | 'gym' | 'ad';

export function LeadDialog(props: { variant: Variant; className?: string; size?: 'sm'|'default'|'lg'; fullWidth?: boolean }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const defaultType: 'GYM'|'AD' = props.variant === 'gym' ? 'GYM' : props.variant === 'ad' ? 'AD' : 'GYM';
  const title = props.variant === 'gym' ? 'Gym Partnerships' : props.variant === 'ad' ? 'Advertising Partnerships' : 'Become a Partner';
  const triggerLabel = props.variant === 'gym' ? 'Learn More About Gym Integration' : props.variant === 'ad' ? 'Start Advertising Campaign' : 'Become a Partner';

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    const fd = new FormData(e.currentTarget);
    const type = String(fd.get('type') || defaultType) as 'GYM'|'AD';
    const payload = {
      orgName: String(fd.get('orgName') || ''),
      contactName: String(fd.get('contactName') || ''),
      email: String(fd.get('email') || ''),
      phone: String(fd.get('phone') || ''),
      website: String(fd.get('website') || ''),
      details: ((): any => {
        const notes = String(fd.get('detailsText') || '').trim();
        const extra: any = {};
        if (props.variant === 'gym') extra.integrationPreference = String(fd.get('integrationPreference') || '');
        if (props.variant === 'ad') extra.estimatedSpend = String(fd.get('estimatedSpend') || '');
        return { notes, ...extra };
      })(),
    };
    try {
      const res = await fetch('/api/partnerships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'lead_submit', type, payload }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'Failed to submit');
      }
      setSuccess(true);
      setTimeout(() => setOpen(false), 800);
      (e.currentTarget as HTMLFormElement).reset();
    } catch (err: any) {
      setError(err?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size={props.size} className={(props.fullWidth ? 'w-full ' : '') + (props.className || '')}>
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Tell us a bit about your organization and goals. We’ll get back shortly.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid grid-cols-1 gap-3">
          <select name="type" defaultValue={defaultType} className="border rounded px-3 py-2">
            <option value="GYM">Gym Partnership</option>
            <option value="AD">Advertising</option>
          </select>
          <Input name="orgName" placeholder="Organization Name" required />
          <Input name="contactName" placeholder="Contact Name" required />
          <Input name="email" type="email" placeholder="Email" required />
          <Input name="phone" placeholder="Phone (optional)" />
          <Input name="website" placeholder="Website (optional)" />
          {props.variant === 'gym' && (
            <Input name="integrationPreference" placeholder="Integration preference (SDK/API/white-label)" />
          )}
          {props.variant === 'ad' && (
            <Input name="estimatedSpend" placeholder="Estimated monthly spend (optional)" />
          )}
          <Textarea name="detailsText" placeholder="Notes / goals (optional)" />
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={loading}>{loading ? 'Submitting…' : 'Submit'}</Button>
            {success && <span className="text-sm text-green-600">Submitted. Thank you!</span>}
            {error && <span className="text-sm text-red-600">{error}</span>}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function KitDownloadButton(props: { className?: string; size?: 'sm'|'default'|'lg'; variant?: 'default'|'outline' }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function onClick() {
    setLoading(true);
    setError(null);
    try {
      await fetch('/api/partnerships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'kit_download' }),
      });
      // Open kit link (static)
      window.open('https://massimino.fitness/partners/kit.pdf', '_blank');
    } catch (err: any) {
      setError(err?.message || 'Failed to download');
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className={props.className}>
      <Button size={props.size} variant={props.variant || 'default'} onClick={onClick} disabled={loading}>
        {loading ? 'Preparing…' : 'Download Partnership Kit'}
      </Button>
      {error && <div className="text-xs text-red-600 mt-1">{error}</div>}
    </div>
  );
}
